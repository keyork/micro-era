import { LLMFormatError, callLLM, type LLMConfig } from '../llm/client';
import type { IdeaNode } from '@/types/idea';

const CRITIC_SYSTEM_PROMPT = `你是微纪元的内容策略评估专家。你的任务是评估每个 idea 变异体的质量。

## 评估维度

1. freshness (0-100): 这个角度在目标平台上有多稀缺？
   90+ = 前所未见的角度
   70-89 = 有新意，少有人做过
   50-69 = 有一些类似内容但不多
   30-49 = 比较常见
   0-29 = 已经烂大街

2. resonance (0-100): 目标受众会有多强烈的情感反应？
   90+ = 直击灵魂，必须点开
   70-89 = 引发好奇心或共鸣
   50-69 = 有一定兴趣
   30-49 = 无感
   0-29 = 完全不相关

3. feasibility (0-100): 一个普通内容创作者能否独立完成？
   90+ = 一个人几天内轻松完成
   70-89 = 一个人一周内可完成
   50-69 = 需要一些额外资源或准备
   30-49 = 需要大量资源或专业知识
   0-29 = 几乎不可能独立完成

## 关键规则
- 必须有区分度，不要所有分数都在 70-80 之间
- 至少有一个维度给出低于 70 的分数
- freshness 和 feasibility 往往负相关：越新颖的角度往往越难执行

## 输出要求
输出 JSON 数组，每个元素包含：
- ideaTitle: string — 被评估 idea 的标题（原样复制）
- freshness: number
- resonance: number
- feasibility: number

不要输出任何 JSON 以外的内容。`;

const CRITIC_USER_TEMPLATE = `## 上下文
内容类型: {content_type}
频道方向: {channel_description}

## 待评估的 Ideas
{ideas_json}

输出 JSON 数组:`;

interface CriticScore {
  ideaTitle: string;
  freshness: number;
  resonance: number;
  feasibility: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }
  return fallback;
}

function buildFallbackScores(nodes: IdeaNode[]): IdeaNode[] {
  return nodes.map((node, index) => ({
    ...node,
    scores: {
      freshness: Math.max(40, 78 - index * 5),
      resonance: Math.max(45, 74 - index * 3),
      feasibility: Math.max(50, 80 - index * 4),
    },
  }));
}

export class CriticAgent {
  constructor(private config: LLMConfig) {}

  async evaluate(
    nodes: IdeaNode[],
    contentType: string,
    channelDescription: string | undefined,
  ): Promise<IdeaNode[]> {
    const ideasPayload = nodes.map((n) => ({
      title: n.title,
      description: n.description,
      tags: n.tags,
    }));

    const user = CRITIC_USER_TEMPLATE.replace('{content_type}', contentType)
      .replace(
        '{channel_description}',
        channelDescription || '未指定',
      )
      .replace('{ideas_json}', JSON.stringify(ideasPayload));

    let raw: unknown;
    try {
      raw = await callLLM(
        this.config,
        CRITIC_SYSTEM_PROMPT,
        user,
      );
    } catch (error) {
      if (error instanceof LLMFormatError) {
        return buildFallbackScores(nodes);
      }
      throw error;
    }

    const scoresList = Array.isArray(raw)
      ? raw
          .filter((entry): entry is Record<string, unknown> => isRecord(entry))
          .map((entry) => ({
            ideaTitle: typeof entry.ideaTitle === 'string' ? entry.ideaTitle : '',
            freshness: toNumber(entry.freshness, 65),
            resonance: toNumber(entry.resonance, 68),
            feasibility: toNumber(entry.feasibility, 72),
          }))
      : [];

    const scoreMap = new Map<string, CriticScore>();
    for (const s of scoresList) {
      if (s.ideaTitle) {
        scoreMap.set(s.ideaTitle, s);
      }
    }

    return nodes.map((node, index) => {
      const s = scoreMap.get(node.title);
      return {
        ...node,
        scores: s
          ? {
              freshness: s.freshness,
              resonance: s.resonance,
              feasibility: s.feasibility,
            }
          : {
              freshness: Math.max(40, 72 - index * 4),
              resonance: Math.max(45, 70 - index * 3),
              feasibility: Math.max(50, 76 - index * 2),
            },
      };
    });
  }
}
