import json
import uuid

from openai import AsyncOpenAI

from app.llm.client import call_llm

BRIEF_SYSTEM_PROMPT = """你是微纪元的选题策划专家。用户已经通过进化过程锁定了一个最终 idea，你需要生成一份结构化的选题 Brief。

## 输出要求
输出单个 JSON 对象，包含：
- coreAngle: string — 核心角度，用一段话清晰阐述（50-100 字）
- targetAudience: string — 目标受众描述（一句话）
- outlinePoints: string[] — 内容大纲，3-5 个要点，每个要点是一句话描述该部分的内容
- insightSummary: string — 一句话总结这个选题为什么好

大纲要点应该形成一个有叙事弧线的结构（开头吸引注意 → 展开论述 → 转折或高潮 → 结尾收束）。

不要输出任何 JSON 以外的内容。"""

BRIEF_USER_TEMPLATE = """## 会话上下文
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

生成选题 Brief，输出 JSON:"""


class BriefAgent:
    def __init__(self, client: AsyncOpenAI, model: str):
        self.client = client
        self.model = model

    async def generate(
        self,
        locked_node: dict,
        session_id: str,
        idea_id: str,
        content_type: str,
        channel_description: str | None,
        seed_input: str,
        evolution_path_nodes: list[dict],
    ) -> dict:
        path_summary = " → ".join(n["title"] for n in evolution_path_nodes) if evolution_path_nodes else locked_node["title"]
        user = BRIEF_USER_TEMPLATE.format(
            content_type=content_type,
            channel_description=channel_description or "未指定",
            seed_input=seed_input,
            title=locked_node["title"],
            description=locked_node.get("description") or "",
            tags=", ".join(locked_node.get("tags", [])),
            why_promising=locked_node.get("why_promising") or "",
            evolution_path_summary=path_summary,
        )
        raw: dict = await call_llm(self.client, self.model, BRIEF_SYSTEM_PROMPT, user)
        evolution_path_ids = [uuid.UUID(str(n["id"])) for n in evolution_path_nodes]
        return {
            "id": uuid.uuid4(),
            "session_id": session_id,
            "idea_id": idea_id,
            "core_angle": raw["coreAngle"],
            "target_audience": raw["targetAudience"],
            "outline_points": raw["outlinePoints"],
            "evolution_path": evolution_path_ids,
        }
