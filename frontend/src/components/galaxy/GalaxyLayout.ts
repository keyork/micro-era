import { IdeaNode } from '@/types/idea';

export interface XYPosition { x: number; y: number }

const GENERATION_RADIUS = 150;
const SELECTED_PULL = -30;
const DORMANT_DRIFT = 40;

export function computeLayout(nodes: IdeaNode[]): Map<string, XYPosition> {
  const positions = new Map<string, XYPosition>();
  const byGen = new Map<number, IdeaNode[]>();

  for (const n of nodes) {
    if (!byGen.has(n.generation)) byGen.set(n.generation, []);
    byGen.get(n.generation)!.push(n);
  }

  for (const [gen, genNodes] of byGen) {
    if (gen === 0) {
      genNodes.forEach((n) => positions.set(n.id, { x: 0, y: 0 }));
      continue;
    }
    const r0 = gen * GENERATION_RADIUS;
    const count = genNodes.length;
    genNodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      let dr = 0;
      if (n.status === 'selected' || n.status === 'locked') dr = SELECTED_PULL;
      if (n.status === 'dormant') dr = DORMANT_DRIFT;
      const r = r0 + dr;
      positions.set(n.id, { x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    });
  }

  return positions;
}
