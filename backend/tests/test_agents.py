"""
Unit tests for Agent JSON output format.
These tests require a real ANTHROPIC_API_KEY and hit the live API.
Skip in CI if the key is not set.
"""
import os
import uuid

import pytest

pytestmark = pytest.mark.skipif(
    not os.getenv("ANTHROPIC_API_KEY") or os.getenv("ANTHROPIC_API_KEY", "").startswith("sk-ant-xxx"),
    reason="ANTHROPIC_API_KEY not set",
)


@pytest.mark.asyncio
async def test_llm_client_returns_parseable_json():
    from anthropic import AsyncAnthropic
    from app.llm.client import call_llm

    client = AsyncAnthropic()
    result = await call_llm(
        client,
        system='Output a JSON array with one object: {"ok": true}',
        user="go",
    )
    assert isinstance(result, list)
    assert result[0].get("ok") is True


@pytest.mark.asyncio
async def test_mutation_agent_first_gen_format():
    from anthropic import AsyncAnthropic
    from app.agents.mutation import MutationAgent

    agent = MutationAgent(AsyncAnthropic())
    session_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    seed_id = str(uuid.uuid4())

    nodes = await agent.generate_first_gen(
        seed_input="我想做一期关于 AI 焦虑的视频",
        content_type="video",
        channel_description="科技与人文交叉",
        session_id=session_id,
        user_id=user_id,
        seed_node_id=seed_id,
    )
    assert len(nodes) >= 1
    for node in nodes:
        assert "title" in node
        assert "mutation_type" in node
        assert node["generation"] == 1


@pytest.mark.asyncio
async def test_critic_agent_scores_format():
    from anthropic import AsyncAnthropic
    from app.agents.critic import CriticAgent

    agent = CriticAgent(AsyncAnthropic())
    nodes = [
        {"id": uuid.uuid4(), "title": "AI 时代的职业焦虑：程序员的自我救赎", "description": "探讨AI对编程职业的冲击", "tags": ["AI", "职场"]},
    ]
    result = await agent.evaluate(nodes, "video", None)
    assert result[0].get("score_freshness") is not None
    assert 0 <= result[0]["score_freshness"] <= 100


@pytest.mark.asyncio
async def test_hybrid_agent_format():
    from anthropic import AsyncAnthropic
    from app.agents.hybrid import HybridAgent

    agent = HybridAgent(AsyncAnthropic())
    pa = {"id": uuid.uuid4(), "title": "AI焦虑", "description": "AI带来的职业焦虑", "tags": ["AI"]}
    pb = {"id": uuid.uuid4(), "title": "冥想治愈", "description": "用冥想对抗现代焦虑", "tags": ["心理"]}

    result = await agent.hybridize(
        parent_a=pa,
        parent_b=pb,
        session_id=str(uuid.uuid4()),
        user_id=str(uuid.uuid4()),
        seed_input="关于AI焦虑",
        content_type="video",
        channel_description=None,
        generation=2,
    )
    assert result["mutation_type"] == "hybrid"
    assert "title" in result
    assert len(result["parent_ids"]) == 2
