import { LLMFormatError, callLLM, type LLMConfig } from '../llm/client';
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

const FIRST_GEN_MUTATION_TYPES: MutationType[] = ['tweak', 'crossover', 'inversion', 'random'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function normalizeMutationType(value: string | undefined, fallback: MutationType): MutationType {
  switch (value) {
    case 'tweak':
    case 'crossover':
    case 'inversion':
    case 'random':
    case 'hybrid':
    case 'seed':
      return value;
    default:
      return fallback;
  }
}

function sanitizeTags(value: unknown, seedHint: string): string[] {
  if (!Array.isArray(value)) {
    return [truncate(seedHint, 10), '待细化'].filter(Boolean);
  }

  const tags = value
    .map((entry) => asNonEmptyString(entry))
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 3);

  return tags.length > 0 ? tags : [truncate(seedHint, 10), '待细化'].filter(Boolean);
}

function extractFallbackCandidates(rawContent: string, max: number): string[] {
  const normalized = rawContent
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[•·]/g, '\n')
    .replace(/\r/g, '')
    .trim();

  const chunks = normalized
    .split(/[\n。！？!?]+/)
    .map((entry) => entry.replace(/^[-*\d.\s:：]+/, '').trim())
    .filter((entry) => entry.length >= 4);

  return Array.from(new Set(chunks)).slice(0, max);
}

function buildFallbackMutation(
  seedHint: string,
  mutationType: MutationType,
  candidate: string | undefined,
): RawMutation {
  const compactSeed = truncate(seedHint || '原始想法', 14);

  const fallbackByType: Record<MutationType, { title: string; description: string; whyPromising: string }> = {
    seed: {
      title: truncate(compactSeed, 25),
      description: '把原始想法先收束成一句可执行的话。',
      whyPromising: '先把核心问题说清，后续更容易扩展。',
    },
    tweak: {
      title: `${compactSeed}：先做最想做的切口`,
      description: '优先保留一个你现在就愿意开始做的方向。',
      whyPromising: '更容易真正落地，不会卡在无限分岔里。',
    },
    crossover: {
      title: `${compactSeed}：借别的视角重讲`,
      description: '把原主题和另一个领域的观察硬连接一次。',
      whyPromising: '跨域连接能迅速拉开和常规表达的差距。',
    },
    inversion: {
      title: `${compactSeed}：也许问题在反面`,
      description: '不再证明原判断，而是先质疑它为什么可能错。',
      whyPromising: '反向论证更容易逼出真正锋利的观点。',
    },
    random: {
      title: `${compactSeed}：先做一个离谱版本`,
      description: '保留最抽象的主题，只测试最意外的一跳。',
      whyPromising: '随机扰动能打破当前思路的惯性。',
    },
    hybrid: {
      title: `${compactSeed}：把两个方向压成一个`,
      description: '抽取两个亲本里最强的一点，先得到一个可讨论的杂交体。',
      whyPromising: '先合成一个最小版本，后续再慢慢分化。',
    },
  };

  if (candidate) {
    return {
      title: truncate(candidate, 25),
      description: fallbackByType[mutationType].description,
      tags: [truncate(compactSeed, 10), mutationType, '待细化'],
      whyPromising: fallbackByType[mutationType].whyPromising,
      mutationType,
    };
  }

  return {
    ...fallbackByType[mutationType],
    tags: [truncate(compactSeed, 10), mutationType, '待细化'],
    mutationType,
  };
}

function sanitizeMutationList(
  raw: unknown,
  seedHint: string,
  mutationTypes: MutationType[],
  rawFallbackContent?: string,
): RawMutation[] {
  const list = Array.isArray(raw) ? raw : [];
  const fallbackCandidates = rawFallbackContent
    ? extractFallbackCandidates(rawFallbackContent, mutationTypes.length)
    : [];

  return mutationTypes.map((mutationType, index) => {
    const entry = list[index];
    const fallback = buildFallbackMutation(seedHint, mutationType, fallbackCandidates[index]);

    if (!isRecord(entry)) {
      return fallback;
    }

    return {
      title: asNonEmptyString(entry.title) ?? fallback.title,
      description: asNonEmptyString(entry.description) ?? fallback.description,
      tags: sanitizeTags(entry.tags, seedHint),
      whyPromising: asNonEmptyString(entry.whyPromising) ?? fallback.whyPromising,
      mutationType: normalizeMutationType(asNonEmptyString(entry.mutationType), mutationType),
    };
  });
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

    let raw: unknown;
    let rawFallbackContent: string | undefined;
    try {
      raw = await callLLM(
        this.config,
        MUTATION_SYSTEM_PROMPT,
        user,
      );
    } catch (error) {
      if (!(error instanceof LLMFormatError)) {
        throw error;
      }
      raw = [];
      rawFallbackContent = error.rawContent;
    }

    const rawList = sanitizeMutationList(raw, seedInput, FIRST_GEN_MUTATION_TYPES, rawFallbackContent);
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

    let raw: unknown;
    let rawFallbackContent: string | undefined;
    try {
      raw = await callLLM(
        this.config,
        MUTATION_SYSTEM_PROMPT,
        user,
      );
    } catch (error) {
      if (!(error instanceof LLMFormatError)) {
        throw error;
      }
      raw = [];
      rawFallbackContent = error.rawContent;
    }

    const mutationTypes = strategies.map((strategy) => normalizeMutationType(strategy, 'tweak'));
    const rawList = sanitizeMutationList(raw, parent.title || seedInput, mutationTypes, rawFallbackContent);
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

    let llmResult: unknown;
    let rawFallbackContent: string | undefined;
    try {
      llmResult = await callLLM(
        this.config,
        MUTATION_SYSTEM_PROMPT,
        user,
      );
    } catch (error) {
      if (!(error instanceof LLMFormatError)) {
        throw error;
      }
      llmResult = [];
      rawFallbackContent = error.rawContent;
    }

    const rawList = sanitizeMutationList(llmResult, seedInput, ['random'], rawFallbackContent);
    const rawMutation = rawList[0];
    return rawToNode(
      { ...rawMutation, mutationType: 'random' },
      sessionId,
      generation,
      [parentId],
    );
  }
}
