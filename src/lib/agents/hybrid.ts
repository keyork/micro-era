import { LLMFormatError, callLLM, type LLMConfig } from '../llm/client';
import type { IdeaNode } from '@/types/idea';

const HYBRID_SYSTEM_PROMPT = `你是微纪元的概念融合专家。你的任务是将两个不同方向的 idea 杂交成一个新物种。

## 核心原则
- 不是简单的 A + B，而是从两者中各提取一个有趣的特征，组合出第三种东西
- 杂交体应该让人觉得"我从来没想过可以这样连接这两个方向"
- 杂交体应该比两个亲本中的任何一个都更有趣

## 输出要求
输出单个 JSON 对象，包含：
- title: string — 一句话标题
- description: string — 一句话补充说明
- tags: string[] — 2-3 个关键词标签
- whyPromising: string — 一句话解释杂交的独特价值
- mutationType: "hybrid"
- parentConnection: string — 一句话解释两个亲本是如何被连接的

不要输出任何 JSON 以外的内容。`;

const HYBRID_USER_TEMPLATE = `## 上下文
内容类型: {content_type}
频道方向: {channel_description}

## 亲本 A
标题: {parent_a_title}
描述: {parent_a_description}
标签: {parent_a_tags}

## 亲本 B
标题: {parent_b_title}
描述: {parent_b_description}
标签: {parent_b_tags}

输出 JSON:`;

export class HybridAgent {
  constructor(private config: LLMConfig) {}

  async hybridize(
    parentA: IdeaNode,
    parentB: IdeaNode,
    sessionId: string,
    contentType: string,
    channelDescription: string | undefined,
    generation: number,
  ): Promise<IdeaNode> {
    const user = HYBRID_USER_TEMPLATE.replace('{content_type}', contentType)
      .replace(
        '{channel_description}',
        channelDescription || '未指定',
      )
      .replace('{parent_a_title}', parentA.title)
      .replace('{parent_a_description}', parentA.description ?? '')
      .replace('{parent_a_tags}', parentA.tags.join(', '))
      .replace('{parent_b_title}', parentB.title)
      .replace('{parent_b_description}', parentB.description ?? '')
      .replace('{parent_b_tags}', parentB.tags.join(', '));

    let raw: Record<string, unknown>;
    try {
      raw = (await callLLM(
        this.config,
        HYBRID_SYSTEM_PROMPT,
        user,
      )) as Record<string, unknown>;
    } catch (error) {
      if (!(error instanceof LLMFormatError)) {
        throw error;
      }

      raw = {
        title: `${parentA.title.slice(0, 10)} × ${parentB.title.slice(0, 10)}`,
        description: '保留两个方向里最强的一点，先合成一个可继续打磨的新切口。',
        tags: Array.from(new Set([...parentA.tags, ...parentB.tags])).slice(0, 3),
        whyPromising: '两个方向已经被压成一个可继续验证的最小杂交体。',
      };
    }

    return {
      id: crypto.randomUUID(),
      sessionId,
      title: typeof raw['title'] === 'string' ? raw['title'] : `${parentA.title.slice(0, 10)} × ${parentB.title.slice(0, 10)}`,
      description: typeof raw['description'] === 'string' ? raw['description'] : '保留两个方向里最强的一点，先合成一个可继续打磨的新切口。',
      tags: (raw['tags'] as string[]) ?? [],
      whyPromising: typeof raw['whyPromising'] === 'string' ? raw['whyPromising'] : '两个方向已经被压成一个可继续验证的最小杂交体。',
      parentIds: [parentA.id, parentB.id],
      generation,
      mutationType: 'hybrid',
      status: 'active',
      brightness: 1.0,
      createdAt: new Date().toISOString(),
    };
  }
}
