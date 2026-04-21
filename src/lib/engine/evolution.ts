import type { LLMConfig } from '../llm/client';
import type { ContentType, IdeaBrief, IdeaNode } from '@/types/idea';
import { MutationAgent } from '../agents/mutation';
import { CriticAgent } from '../agents/critic';
import { HybridAgent } from '../agents/hybrid';
import { BriefAgent } from '../agents/brief';

export class EvolutionEngine {
  private mutationAgent: MutationAgent;
  private criticAgent: CriticAgent;
  private hybridAgent: HybridAgent;
  private briefAgent: BriefAgent;

  constructor(config: LLMConfig) {
    this.mutationAgent = new MutationAgent(config);
    this.criticAgent = new CriticAgent(config);
    this.hybridAgent = new HybridAgent(config);
    this.briefAgent = new BriefAgent(config);
  }

  makeSeedNode(
    sessionId: string,
    userId: string,
    seedInput: string,
  ): IdeaNode {
    return {
      id: crypto.randomUUID(),
      sessionId,
      title: seedInput.slice(0, 200),
      tags: [],
      parentIds: [],
      generation: 0,
      mutationType: 'seed',
      status: 'selected',
      brightness: 1.0,
      createdAt: new Date().toISOString(),
    };
  }

  async bigBang(
    sessionId: string,
    seedInput: string,
    contentType: ContentType,
    channelDescription: string | undefined,
  ): Promise<IdeaNode[]> {
    const seed = this.makeSeedNode(sessionId, '', seedInput);

    const variants = await this.mutationAgent.generateFirstGen(
      seedInput,
      contentType,
      channelDescription,
      sessionId,
      seed.id,
    );

    const scored = await this.criticAgent.evaluate(
      variants,
      contentType,
      channelDescription,
    );

    return [seed, ...scored];
  }

  async evolve(
    selectedIds: string[],
    allNodes: IdeaNode[],
    sessionId: string,
    seedInput: string,
    contentType: ContentType,
    channelDescription: string | undefined,
    currentGeneration: number,
    hybridize: boolean = false,
  ): Promise<IdeaNode[]> {
    const nodeMap = new Map<string, IdeaNode>();
    for (const n of allNodes) {
      nodeMap.set(n.id, n);
    }
    const parents = selectedIds
      .filter((sid) => nodeMap.has(sid))
      .map((sid) => nodeMap.get(sid)!);

    const nextGen = currentGeneration + 1;
    let candidates: IdeaNode[];

    if (hybridize && parents.length === 2) {
      const hybrid = await this.hybridAgent.hybridize(
        parents[0],
        parents[1],
        sessionId,
        contentType,
        channelDescription,
        nextGen,
      );

      const children = await this.mutationAgent.generate(
        hybrid,
        ['tweak', 'crossover'],
        sessionId,
        seedInput,
        contentType,
        channelDescription,
        nextGen + 1,
      );

      candidates = [hybrid, ...children];
    } else {
      const parent = parents[0];
      const strategies = selectStrategies(currentGeneration);
      candidates = await this.mutationAgent.generate(
        parent,
        strategies,
        sessionId,
        seedInput,
        contentType,
        channelDescription,
        nextGen,
      );
    }

    const scored = await this.criticAgent.evaluate(
      candidates,
      contentType,
      channelDescription,
    );

    if (Math.random() < 0.2 && parents.length > 0) {
      const mutant = await this.mutationAgent.randomMutate(
        sessionId,
        seedInput,
        contentType,
        channelDescription,
        nextGen,
        parents[0].id,
      );
      const mutantScored = await this.criticAgent.evaluate(
        [mutant],
        contentType,
        channelDescription,
      );
      scored.push(...mutantScored);
    }

    return scored.slice(0, 4);
  }

  async generateBrief(
    lockedNode: IdeaNode,
    allNodes: IdeaNode[],
    seedInput: string,
    contentType: ContentType,
    channelDescription: string | undefined,
  ): Promise<IdeaBrief> {
    const evolutionPath = tracePath(lockedNode, allNodes);
    return this.briefAgent.generate(
      lockedNode,
      contentType,
      channelDescription,
      seedInput,
      evolutionPath,
    );
  }
}

function selectStrategies(currentGeneration: number): string[] {
  if (currentGeneration <= 1) {
    return ['tweak', 'crossover', 'inversion'];
  }
  return ['tweak', 'tweak', 'crossover'];
}

function tracePath(node: IdeaNode, allNodes: IdeaNode[]): IdeaNode[] {
  const nodeMap = new Map<string, IdeaNode>();
  for (const n of allNodes) {
    nodeMap.set(n.id, n);
  }

  const path: IdeaNode[] = [];
  const visited = new Set<string>();
  let current: IdeaNode | undefined = node;

  while (current) {
    if (visited.has(current.id)) break;
    visited.add(current.id);
    path.unshift(current);
    if (current.parentIds.length === 0) break;
    current = nodeMap.get(current.parentIds[0]);
  }

  return path;
}
