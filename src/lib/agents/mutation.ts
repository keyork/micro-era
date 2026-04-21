import { callLLM, type LLMConfig } from '../llm/client';
import type { IdeaNode, MutationType } from '@/types/idea';

const MUTATION_SYSTEM_PROMPT = `你是微纪元的创意进化引擎。你的任务是基于给定的 idea 生成变异体。

## 核心原则
- 每个变异体保留亲本的某些 DNA，同时在特定维度上发生变化
- 变异体之间要有足够的差异性，不能只是换了个说法
- 信息要精炼：标题一句话能打动人，不要写长句

## 变异策略
当收到 TWEAK 指令：保持核心角度不变，微调切入点、目标受众或表达方式
当收到 CROSSOVER 指令：保留核心主题，但引入一个完全不同领域的视角（如：科技 × 心理学、商业 × 历史）
当收到 INVERSION 指令：反转亲本的核心论点或前提假设，从对立面思考
当收到 RANDOM 指令：完全跳出当前方向，只保留最抽象的主题关联，大胆、出人意料

## 输出要求
严格输出 JSON 数组，每个元素包含：
- title: string — 一句话标题，要有冲击力，不超过 25 字
- description: string — 一句话补充说明，不超过 40 字
- tags: string[] — 2-3 个关键词标签
- whyPromising: string — 一句话解释为什么有潜力，不超过 30 字
- mutationType: string — 使用的变异策略（tweak/crossover/inversion/random）

不要输出任何 JSON 以外的内容。不要包含 markdown 代码块标记。`;

const MUTATION_USER_TEMPLATE = `## 上下文
内容类型: {content_type}
频道方向: {channel_description}
原始种子: {seed_input}

## 亲本 Idea
标题: {parent_title}
描述: {parent_description}
标签: {parent_tags}

## 任务
请使用以下策略各生成一个变异体: {strategies}

输出 JSON 数组:`;

const FIRST_GEN_USER_TEMPLATE = `## 上下文
内容类型: {content_type}
频道方向: {channel_description}

## 用户的种子想法
{seed_input}

## 任务
请使用 tweak、crossover、inversion、random 策略各生成一个变异体（共 4 个），帮助用户探索这个想法的不同方向。

输出 JSON 数组:`;

const RANDOM_MUTATE_TEMPLATE = `## 上下文
内容类型: {content_type}
频道方向: {channel_description}
原始种子: {seed_input}

## 任务
生成一个完全出人意料的随机变异（RANDOM），与当前进化方向无关，只保留最抽象的主题联系。要大胆、跳跃。

输出包含单个元素的 JSON 数组:`;

interface RawMutation {
  title: string;
  description?: string;
  tags?: string[];
  whyPromising?: string;
  mutationType?: string;
}

function rawToNode(
  raw: RawMutation,
  sessionId: string,
  generation: number,
  parentIds: string[],
): IdeaNode {
  return {
    id: crypto.randomUUID(),
    sessionId,
    title: raw.title,
    description: raw.description,
    tags: raw.tags ?? [],
    whyPromising: raw.whyPromising,
    parentIds,
    generation,
    mutationType: (raw.mutationType ?? 'tweak') as MutationType,
    status: 'active',
    brightness: 1.0,
    createdAt: new Date().toISOString(),
  };
}

export class MutationAgent {
  constructor(private config: LLMConfig) {}

  async generateFirstGen(
    seedInput: string,
    contentType: string,
    channelDescription: string | undefined,
    sessionId: string,
    seedNodeId: string,
  ): Promise<IdeaNode[]> {
    const user = FIRST_GEN_USER_TEMPLATE.replace('{content_type}', contentType)
      .replace(
        '{channel_description}',
        channelDescription || '未指定',
      )
      .replace('{seed_input}', seedInput);

    const rawList = (await callLLM(
      this.config,
      MUTATION_SYSTEM_PROMPT,
      user,
    )) as RawMutation[];
    return rawList
      .slice(0, 4)
      .map((r) => rawToNode(r, sessionId, 1, [seedNodeId]));
  }

  async generate(
    parent: IdeaNode,
    strategies: string[],
    sessionId: string,
    seedInput: string,
    contentType: string,
    channelDescription: string | undefined,
    generation: number,
  ): Promise<IdeaNode[]> {
    const user = MUTATION_USER_TEMPLATE.replace('{content_type}', contentType)
      .replace(
        '{channel_description}',
        channelDescription || '未指定',
      )
      .replace('{seed_input}', seedInput)
      .replace('{parent_title}', parent.title)
      .replace('{parent_description}', parent.description ?? '')
      .replace('{parent_tags}', parent.tags.join(', '))
      .replace('{strategies}', strategies.join('、'));

    const rawList = (await callLLM(
      this.config,
      MUTATION_SYSTEM_PROMPT,
      user,
    )) as RawMutation[];
    return rawList.map((r) =>
      rawToNode(r, sessionId, generation, [parent.id]),
    );
  }

  async randomMutate(
    sessionId: string,
    seedInput: string,
    contentType: string,
    channelDescription: string | undefined,
    generation: number,
    parentId: string,
  ): Promise<IdeaNode> {
    const user = RANDOM_MUTATE_TEMPLATE.replace('{content_type}', contentType)
      .replace(
        '{channel_description}',
        channelDescription || '未指定',
      )
      .replace('{seed_input}', seedInput);

    const rawList = (await callLLM(
      this.config,
      MUTATION_SYSTEM_PROMPT,
      user,
    )) as RawMutation[];
    const raw = rawList[0];
    return rawToNode(
      { ...raw, mutationType: 'random' },
      sessionId,
      generation,
      [parentId],
    );
  }
}
