import { IdeaNode } from '@/types/idea';

const GENERATION_RADIUS = 150; // px per generation ring
const SELECTED_PULL = -30;     // selected nodes pull inward
const DORMANT_DRIFT = 40;      // dormant nodes drift outward

export interface NodePosition {
  x: number;
  y: number;
}

/**
 * Compute 2D positions for all nodes using a radial layout.
 * Seed node (generation 0) is fixed at (0, 0).
 * Each generation is distributed evenly on a concentric circle.
 */
export function computeGalaxyLayout(nodes: IdeaNode[]): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>();

  // Group nodes by generation
  const byGeneration = new Map<number, IdeaNode[]>();
  for (const node of nodes) {
    const gen = node.generation;
    if (!byGeneration.has(gen)) byGeneration.set(gen, []);
    byGeneration.get(gen)!.push(node);
  }

  for (const [gen, genNodes] of byGeneration) {
    if (gen === 0) {
      // Seed: center
      for (const node of genNodes) {
        positions.set(node.id, { x: 0, y: 0 });
      }
      continue;
    }

    const baseRadius = gen * GENERATION_RADIUS;
    const count = genNodes.length;

    genNodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;

      let radiusAdjust = 0;
      if (node.status === 'selected') radiusAdjust = SELECTED_PULL;
      if (node.status === 'dormant') radiusAdjust = DORMANT_DRIFT;

      const r = baseRadius + radiusAdjust;
      positions.set(node.id, {
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      });
    });
  }

  return positions;
}
