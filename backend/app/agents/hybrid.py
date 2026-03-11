import uuid

from anthropic import AsyncAnthropic

from app.llm.client import call_llm

HYBRID_SYSTEM_PROMPT = """你是微纪元的概念融合专家。你的任务是将两个不同方向的 idea 杂交成一个新物种。

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

不要输出任何 JSON 以外的内容。"""

HYBRID_USER_TEMPLATE = """## 上下文
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

输出 JSON:"""


class HybridAgent:
    def __init__(self, client: AsyncAnthropic):
        self.client = client

    async def hybridize(
        self,
        parent_a: dict,
        parent_b: dict,
        session_id: str,
        user_id: str,
        seed_input: str,
        content_type: str,
        channel_description: str | None,
        generation: int,
    ) -> dict:
        user = HYBRID_USER_TEMPLATE.format(
            content_type=content_type,
            channel_description=channel_description or "未指定",
            parent_a_title=parent_a["title"],
            parent_a_description=parent_a.get("description") or "",
            parent_a_tags=", ".join(parent_a.get("tags", [])),
            parent_b_title=parent_b["title"],
            parent_b_description=parent_b.get("description") or "",
            parent_b_tags=", ".join(parent_b.get("tags", [])),
        )
        raw: dict = await call_llm(self.client, HYBRID_SYSTEM_PROMPT, user)
        return {
            "id": uuid.uuid4(),
            "session_id": session_id,
            "user_id": user_id,
            "title": raw["title"],
            "description": raw.get("description"),
            "tags": raw.get("tags", []),
            "why_promising": raw.get("whyPromising"),
            "parent_ids": [uuid.UUID(str(parent_a["id"])), uuid.UUID(str(parent_b["id"]))],
            "generation": generation,
            "mutation_type": "hybrid",
            "status": "active",
            "brightness": 1.0,
        }
