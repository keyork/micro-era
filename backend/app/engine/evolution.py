import random
import uuid

from anthropic import AsyncAnthropic

from app.agents.brief import BriefAgent
from app.agents.critic import CriticAgent
from app.agents.hybrid import HybridAgent
from app.agents.mutation import MutationAgent


class EvolutionEngine:
    def __init__(self, llm_client: AsyncAnthropic):
        self.client = llm_client
        self.mutation_agent = MutationAgent(llm_client)
        self.critic_agent = CriticAgent(llm_client)
        self.hybrid_agent = HybridAgent(llm_client)
        self.brief_agent = BriefAgent(llm_client)

    def make_seed_node(self, session_id: str, user_id: str, seed_input: str) -> dict:
        return {
            "id": uuid.uuid4(),
            "session_id": session_id,
            "user_id": user_id,
            "title": seed_input[:200],
            "description": None,
            "tags": [],
            "why_promising": None,
            "parent_ids": [],
            "generation": 0,
            "mutation_type": "seed",
            "status": "selected",
            "score_freshness": None,
            "score_resonance": None,
            "score_feasibility": None,
            "brightness": 1.0,
        }

    async def big_bang(
        self,
        session_id: str,
        user_id: str,
        seed_input: str,
        content_type: str,
        channel_description: str | None,
    ) -> list[dict]:
        """Generate seed node + first generation variants."""
        seed = self.make_seed_node(session_id, user_id, seed_input)
        seed_id = str(seed["id"])

        variants = await self.mutation_agent.generate_first_gen(
            seed_input=seed_input,
            content_type=content_type,
            channel_description=channel_description,
            session_id=session_id,
            user_id=user_id,
            seed_node_id=seed_id,
        )
        scored = await self.critic_agent.evaluate(variants, content_type, channel_description)
        return [seed] + scored

    async def evolve(
        self,
        selected_ids: list[str],
        all_nodes: list[dict],
        session_id: str,
        user_id: str,
        seed_input: str,
        content_type: str,
        channel_description: str | None,
        current_generation: int,
        hybridize: bool = False,
    ) -> list[dict]:
        """Run one evolution round. Returns up to 4 new nodes."""
        node_map = {str(n["id"]): n for n in all_nodes}
        parents = [node_map[sid] for sid in selected_ids if sid in node_map]

        next_gen = current_generation + 1

        if hybridize and len(parents) == 2:
            hybrid = await self.hybrid_agent.hybridize(
                parent_a=parents[0],
                parent_b=parents[1],
                session_id=session_id,
                user_id=user_id,
                seed_input=seed_input,
                content_type=content_type,
                channel_description=channel_description,
                generation=next_gen,
            )
            children = await self.mutation_agent.generate(
                parent=hybrid,
                strategies=["tweak", "crossover"],
                session_id=session_id,
                user_id=user_id,
                seed_input=seed_input,
                content_type=content_type,
                channel_description=channel_description,
                generation=next_gen + 1,
            )
            candidates = [hybrid] + children
        else:
            parent = parents[0]
            strategies = self._select_strategies(current_generation)
            candidates = await self.mutation_agent.generate(
                parent=parent,
                strategies=strategies,
                session_id=session_id,
                user_id=user_id,
                seed_input=seed_input,
                content_type=content_type,
                channel_description=channel_description,
                generation=next_gen,
            )

        scored = await self.critic_agent.evaluate(candidates, content_type, channel_description)

        # 20% chance of a random mutation
        if random.random() < 0.2 and parents:
            mutant = await self.mutation_agent.random_mutate(
                session_id=session_id,
                user_id=user_id,
                seed_input=seed_input,
                content_type=content_type,
                channel_description=channel_description,
                generation=next_gen,
                parent_id=str(parents[0]["id"]),
            )
            mutant_scored = await self.critic_agent.evaluate([mutant], content_type, channel_description)
            scored.extend(mutant_scored)

        return scored[:4]

    async def generate_brief(
        self,
        locked_node: dict,
        session_id: str,
        all_nodes: list[dict],
        seed_input: str,
        content_type: str,
        channel_description: str | None,
    ) -> dict:
        """Build evolution path and generate the final Brief."""
        evolution_path = self._trace_path(locked_node, all_nodes)
        return await self.brief_agent.generate(
            locked_node=locked_node,
            session_id=session_id,
            idea_id=str(locked_node["id"]),
            content_type=content_type,
            channel_description=channel_description,
            seed_input=seed_input,
            evolution_path_nodes=evolution_path,
        )

    # ── helpers ──────────────────────────────────────────────────────────────

    @staticmethod
    def _select_strategies(current_generation: int) -> list[str]:
        if current_generation <= 1:
            return ["tweak", "crossover", "inversion"]
        return ["tweak", "tweak", "crossover"]

    @staticmethod
    def _trace_path(node: dict, all_nodes: list[dict]) -> list[dict]:
        """Walk parent_ids backwards to reconstruct the evolution lineage."""
        node_map = {str(n["id"]): n for n in all_nodes}
        path: list[dict] = []
        current: dict | None = node
        visited: set[str] = set()
        while current is not None:
            nid = str(current["id"])
            if nid in visited:
                break
            visited.add(nid)
            path.insert(0, current)
            parent_ids = current.get("parent_ids", [])
            if not parent_ids:
                break
            current = node_map.get(str(parent_ids[0]))
        return path
