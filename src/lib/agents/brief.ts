import { callLLM, type LLMConfig } from '../llm/client';
import type { IdeaBrief, IdeaNode } from '@/types/idea';

const BRIEF_SYSTEM_PROMPT = `你是微纪元的选题策划专家。用户已经通过进化过程锁定了一个最终 idea，你需要生成一份结构化的选题 Brief。

## 输出要求
输出单个 JSON 对象，包含：
- coreAngle: string — 核心角度，用一段话清晰阐述（50-100 字）
- targetAudience: string — 目标受众描述（一句话）
- outlinePoints: string[] — 内容大纲，3-5 个要点，每个要点是一句话描述该部分的内容
- insightSummary: string — 一句话总结这个选题为什么好

大纲要点应该形成一个有叙事弧线的结构（开头吸引注意 → 展开论述 → 转折或高潮 → 结尾收束）。

不要输出任何 JSON 以外的内容。`;

const BRIEF_USER_TEMPLATE = `## 会话上下文
内容类型: {content_type}
频道方向: {channel_description}
原始种子想法: {seed_input}

## 锁定的 Idea
标题: {title}
描述: {description}
标签: {tags}
为什么有潜力: {why_promising}

## 进化路径
{evolution_path_summary}

生成选题 Brief，输出 JSON:`;

export class BriefAgent {
  constructor(private config: LLMConfig) {}

  async generate(
    lockedNode: IdeaNode,
    contentType: string,
    channelDescription: string | undefined,
    seedInput: string,
    evolutionPathNodes: IdeaNode[],
  ): Promise<IdeaBrief> {
    const pathSummary =
      evolutionPathNodes.length > 0
        ? evolutionPathNodes.map((n) => n.title).join(' → ')
        : lockedNode.title;

    const user = BRIEF_USER_TEMPLATE.replace('{content_type}', contentType)
      .replace(
        '{channel_description}',
        channelDescription || '未指定',
      )
      .replace('{seed_input}', seedInput)
      .replace('{title}', lockedNode.title)
      .replace('{description}', lockedNode.description ?? '')
      .replace('{tags}', lockedNode.tags.join(', '))
      .replace('{why_promising}', lockedNode.whyPromising ?? '')
      .replace('{evolution_path_summary}', pathSummary);

    const raw = (await callLLM(
      this.config,
      BRIEF_SYSTEM_PROMPT,
      user,
    )) as Record<string, unknown>;

    return {
      id: crypto.randomUUID(),
      sessionId: lockedNode.sessionId,
      ideaId: lockedNode.id,
      coreAngle: raw['coreAngle'] as string,
      targetAudience: raw['targetAudience'] as string,
      outlinePoints: raw['outlinePoints'] as string[],
      evolutionPath: evolutionPathNodes.map((n) => n.id),
      createdAt: new Date().toISOString(),
    };
  }
}
