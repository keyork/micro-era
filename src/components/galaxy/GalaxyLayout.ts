import { IdeaNode } from '@/types/idea';

export interface XYPosition { x: number; y: number }

const FIRST_RING_RADIUS = 250;
const CHILD_STEP = 160;
const MAX_DISTANCE_FROM_PARENT_ROOT = 220;
const SIBLING_GAP = 74;
const BRANCH_SPREAD = 0.4;
const ARM_SWAY = 0.16;
const JITTER = 8;

function getSortKey(node: IdeaNode): string {
  return node.createdAt || node.id;
}

function hashStr(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  }
  return hash;
}

function jitterFor(id: string) {
  const x = (((hashStr(id) % 2000) + 2000) % 2000) / 1000 - 1;
  const y = (((hashStr(`${id}:y`) % 2000) + 2000) % 2000) / 1000 - 1;
  return { dx: x * JITTER, dy: y * JITTER };
}

function angleOf(position: XYPosition): number {
  return Math.atan2(position.y, position.x);
}

function averageAngles(angles: number[]): number {
  const x = angles.reduce((sum, angle) => sum + Math.cos(angle), 0);
  const y = angles.reduce((sum, angle) => sum + Math.sin(angle), 0);
  return Math.atan2(y, x);
}

function positionOn(angle: number, radius: number, tangentOffset = 0): XYPosition {
  return {
    x: Math.cos(angle) * radius - Math.sin(angle) * tangentOffset,
    y: Math.sin(angle) * radius + Math.cos(angle) * tangentOffset,
  };
}

function armKeyFor(node: IdeaNode, nodeMap: Map<string, IdeaNode>): string {
  if (node.generation <= 1) {
    return node.id;
  }

  let current: IdeaNode | undefined = node;
  const visited = new Set<string>();

  while (current && current.generation > 1 && current.parentIds.length > 0) {
    const nextParentId = [...current.parentIds].sort()[0];
    if (visited.has(nextParentId)) {
      break;
    }
    visited.add(nextParentId);
    current = nodeMap.get(nextParentId);
  }

  return current?.id ?? node.id;
}

function averagePosition(positions: XYPosition[]): XYPosition {
  if (positions.length === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: positions.reduce((sum, position) => sum + position.x, 0) / positions.length,
    y: positions.reduce((sum, position) => sum + position.y, 0) / positions.length,
  };
}

function clampFromOrigin(origin: XYPosition, target: XYPosition, maxDistance: number): XYPosition {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const distance = Math.sqrt(dx ** 2 + dy ** 2);

  if (distance <= maxDistance || distance === 0) {
    return target;
  }

  const scale = maxDistance / distance;
  return {
    x: origin.x + dx * scale,
    y: origin.y + dy * scale,
  };
}

export function computeLayout(nodes: IdeaNode[]): Map<string, XYPosition> {
  const positions = new Map<string, XYPosition>();
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const byGeneration = new Map<number, IdeaNode[]>();
  const armAngles = new Map<string, number>();

  for (const node of nodes) {
    if (!byGeneration.has(node.generation)) {
      byGeneration.set(node.generation, []);
    }
    byGeneration.get(node.generation)!.push(node);
  }

  const seedNodes = byGeneration.get(0) ?? [];
  seedNodes.forEach((node) => positions.set(node.id, { x: 0, y: 0 }));

  const firstGen = [...(byGeneration.get(1) ?? [])].sort((a, b) => getSortKey(a).localeCompare(getSortKey(b)));
  firstGen.forEach((node, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / Math.max(firstGen.length, 1);
    armAngles.set(node.id, angle);
    const { dx, dy } = jitterFor(node.id);
    const base = positionOn(angle, FIRST_RING_RADIUS);
    positions.set(node.id, { x: base.x + dx, y: base.y + dy });
  });

  const generations = [...byGeneration.keys()].filter((generation) => generation > 1).sort((a, b) => a - b);

  for (const generation of generations) {
    const generationNodes = [...(byGeneration.get(generation) ?? [])].sort((a, b) => getSortKey(a).localeCompare(getSortKey(b)));
    const branchGroups = new Map<string, IdeaNode[]>();

    for (const node of generationNodes) {
      const key = armKeyFor(node, nodeMap);
      if (!branchGroups.has(key)) {
        branchGroups.set(key, []);
      }
      branchGroups.get(key)!.push(node);
    }

    const orderedGroups = [...branchGroups.entries()].sort(([a], [b]) => a.localeCompare(b));

    orderedGroups.forEach(([armKey, branchNodes], groupIndex) => {
      const armAngle = armAngles.get(armKey) ?? (-Math.PI / 2 + (groupIndex * Math.PI * 2) / Math.max(orderedGroups.length, 1));
      const siblingGroups = new Map<string, IdeaNode[]>();

      for (const node of branchNodes) {
        const key = node.parentIds.length > 0 ? [...node.parentIds].sort().join('|') : node.id;
        if (!siblingGroups.has(key)) {
          siblingGroups.set(key, []);
        }
        siblingGroups.get(key)!.push(node);
      }

      const siblingEntries = [...siblingGroups.entries()].sort(([a], [b]) => a.localeCompare(b));

      siblingEntries.forEach(([, siblings], siblingGroupIndex) => {
        const parentPositions = siblings[0].parentIds
          .map((parentId) => positions.get(parentId))
          .filter((position): position is XYPosition => Boolean(position));

        const parentCenter = averagePosition(parentPositions);
        const parentAngle = parentPositions.length > 0 ? averageAngles(parentPositions.map(angleOf)) : armAngle;
        const groupSwing = (groupIndex % 2 === 0 ? -1 : 1) * ARM_SWAY;
        const baseAngle = parentAngle * 0.82 + armAngle * 0.18 + groupSwing;
        const groupTangent = (siblingGroupIndex - (siblingEntries.length - 1) / 2) * SIBLING_GAP * 0.34;
        const localSpread = siblings.length === 1 ? 0 : Math.min(BRANCH_SPREAD, 0.11 * siblings.length);

        siblings.forEach((node, index) => {
          const localOffset = siblings.length === 1 ? 0 : index - (siblings.length - 1) / 2;
          const angle = baseAngle + localOffset * (localSpread / Math.max(siblings.length - 1, 1));
          const tangentOffset = groupTangent + localOffset * SIBLING_GAP;
          const candidate = {
            x: parentCenter.x + Math.cos(angle) * CHILD_STEP - Math.sin(angle) * tangentOffset,
            y: parentCenter.y + Math.sin(angle) * CHILD_STEP + Math.cos(angle) * tangentOffset,
          };
          const clamped = clampFromOrigin(parentCenter, candidate, MAX_DISTANCE_FROM_PARENT_ROOT);
          const { dx, dy } = jitterFor(node.id);

          positions.set(node.id, {
            x: clamped.x + dx,
            y: clamped.y + dy,
          });
        });
      });
    });
  }

  return positions;
}
