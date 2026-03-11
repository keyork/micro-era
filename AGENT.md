# 微纪元 (Micro Era)

> 本文件是 Claude Code 的完整开发指南。按顺序阅读，按 Phase 执行。

---

## 项目概述

微纪元是一款面向内容创作者的 AI 创意进化引擎。用户输入一个模糊的想法（种子），系统通过变异、选择、杂交的进化循环，帮助用户找到最佳创意方向，最终输出一份结构化的选题 Brief。

**一句话定位：Stop brainstorming. Start evolving.**

**核心体验：** 用户看着自己的想法像星系一样在屏幕上生长、分裂、演化——而不是阅读一个列表。

---

## 产品逻辑

### 目标用户

探索型内容创作者（优先：YouTube / 短视频创作者），他们享受构思过程，认为好选题是"养出来的"而非"挑出来的"。

### 核心闭环（5 步）

```
种子输入 → 大爆炸（第一代变异）→ 选择/杂交 → 持续进化（2-3 轮）→ 锁定选题
```

#### Step 1: 种子输入

用户有两种入口：

- **有想法**：输入一句模糊描述，例如"我想做一期关于 AI 焦虑的视频"
- **没想法**：输入几个关键词或选一个领域，系统生成种子

轻量 onboarding 信息：

- 内容类型（视频 / 文章 / 播客 / Newsletter）
- 频道方向（可选，一句话）

#### Step 2: 大爆炸 — 第一代变异

系统生成 3-4 个变异方向，每个包含：

- 一句话标题（核心角度）
- 2-3 个关键词标签
- 一句话 why（为什么有潜力）

**关键设计：** 节点逐个"长出来"（每个间隔 600-800ms），不是一次性全部出现。信息量要少，创作者靠"感觉"选择。

#### Step 3: 选择与杂交

用户可以：

- 选择 1 个方向 → 系统基于此生成下一代变异
- 选择 2 个方向杂交 → 系统融合两者特征生成新变异（拖拽两个节点靠近触发）
- 全部不满意 → 重新变异（增大变异幅度）

#### Step 4: 持续进化（2-3 轮）

每轮生成 3-4 个新变异。每个变异附带 Critic 评分：

- 新鲜度 (0-100)：市场上同类内容的稀缺程度
- 共鸣度 (0-100)：是否切中目标受众的真实关切
- 可执行度 (0-100)：创作者能否实际完成

**随机突变机制：** 每轮有 20% 概率出现一个完全跳出当前方向的"随机突变"节点，用特殊颜色标识。

#### Step 5: 锁定选题

用户点击 "Lock This Idea"，系统生成选题 Brief：

- 核心角度（一句话）
- 目标受众
- 内容大纲建议（3-5 个要点）
- 进化路径回顾（这个 idea 从哪个种子、经过哪些变异演化来的）

### 星系可视化

MVP 使用 2D 节点图 + 发光效果 + 动画（非 3D）：

- **中心恒星**：种子 idea
- **行星**：每一代变异，被选中的更大更亮
- **暗星云**：被淘汰的变异，变暗飘远但可点击复活
- **连线**：显示进化路径，杂交显示双线汇合
- **缩放**：zoom out 看全局，zoom in 看单个节点详情

交互映射：

- 点击星球 → 展开 idea 详情面板
- 拖拽两个星球靠近 → 触发杂交
- 双击暗星云 → 复活被淘汰的 idea
- 滚轮缩放 → 切换全局/局部视角
- 点击 Lock → 锁定选题，生成 Brief

布局算法：自定义径向布局

- 种子节点固定在中心 (0, 0)
- 每一代节点分布在同心圆上，半径 = generation × 150px
- 被选中的节点偏向内侧（引力效果，-30px）
- 被淘汰的节点偏向外侧（漂移效果，+40px）

视觉语言：

- 活跃/选中节点：明亮 + 光晕 (box-shadow glow)
- 淘汰节点：暗淡 + 半透明 (opacity: 0.4)
- 杂交连线：双色渐变
- 随机突变：粉红色脉冲动画
- 锁定节点：金色高亮 + 脉冲

### MVP 不做的事

不要实现以下功能：

- 3D 星系可视化（2D 足够）
- Lineage 历史回溯与全局 idea 复活
- 自治比例调节旋钮（先固定中等自治度）
- 复杂 onboarding 和用户画像系统
- 多人协作
- 外部数据接入（趋势 API、竞品分析）

---

## 技术架构

### 整体结构

```
┌──────────────────────────────────────────────────┐
│                   Frontend                        │
│          Next.js 14+ (App Router)                 │
│          TypeScript + Tailwind CSS                │
│          React Flow + Framer Motion (星系可视化)    │
│          Zustand (状态管理)                         │
└──────────────────────┬───────────────────────────┘
                       │ WebSocket + REST API
┌──────────────────────▼───────────────────────────┐
│                   Backend                         │
│               Python FastAPI                      │
│                                                   │
│  ┌──────────────┐  ┌────────────┐  ┌───────────┐ │
│  │ EvolutionEngine│ │ Agent 编排  │  │ 会话管理   │ │
│  │ (进化核心逻辑)  │ │ (Mutation/ │  │ (Session  │ │
│  │               │ │  Critic/   │  │  State)   │ │
│  │               │ │  Hybrid)   │  │           │ │
│  └──────────────┘  └────────────┘  └───────────┘ │
└──────────────────────┬───────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌─────────┐  ┌──────────┐  ┌──────────┐
   │ LLM API  │  │ PostgreSQL│  │  Redis   │
   │ (Claude  │  │ (Supabase│  │ (会话缓存) │
   │  Sonnet) │  │  / Neon)  │  │          │
   └─────────┘  └──────────┘  └──────────┘
```

### 技术栈

**Frontend:**

- Next.js 14+ (App Router) — 框架
- TypeScript — 语言
- Tailwind CSS — 样式
- React Flow — 星系节点图基础
- Framer Motion — 所有动画（大爆炸、节点弹出、淘汰漂移、杂交、锁定）
- Zustand — 状态管理（进化树、当前会话、UI 状态）

**Backend:**

- Python 3.11+ / FastAPI — 主框架（异步支持好，LLM 调用适配）
- 自建轻量 Agent 编排 — 不使用 LangChain，直接封装 Claude API 调用
- anthropic Python SDK — LLM 调用（主用 Claude Sonnet）
- WebSocket (FastAPI) — 实时推送进化结果
- Celery + Redis — 异步任务队列（LLM 调用耗时）

**数据存储:**

- PostgreSQL (Supabase 或 Neon) — 用户、会话、idea 节点
- Redis — 会话状态缓存、进化中间态

**部署:**

- Frontend → Vercel
- Backend → Railway 或 Fly.io
- Database → Supabase 或 Neon
- 监控 → Sentry (错误) + PostHog (用户行为)

**认证:**

- NextAuth 或 Clerk

---

## 数据模型

### 数据库 Schema

**users 表：**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**evolution_sessions 表：**

```sql
CREATE TABLE evolution_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- 种子信息
  seed_input TEXT NOT NULL,              -- 用户原始输入
  content_type VARCHAR(50) NOT NULL,     -- video / article / podcast / newsletter
  channel_description TEXT,              -- 频道描述（可选）
  
  -- 进化状态
  current_generation INT DEFAULT 0,
  total_nodes INT DEFAULT 0,
  locked_idea_id UUID,                   -- 最终锁定的 idea（外键，后续 ALTER ADD）
  
  -- 会话状态
  status VARCHAR(20) DEFAULT 'evolving', -- evolving / completed / abandoned
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**idea_nodes 表：**

```sql
CREATE TABLE idea_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES evolution_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- 内容
  title VARCHAR(200) NOT NULL,           -- 一句话标题
  description TEXT,                       -- 简要描述 / subtitle
  tags TEXT[] DEFAULT '{}',              -- 关键词标签
  why_promising TEXT,                     -- 为什么有潜力
  
  -- 进化关系
  parent_ids UUID[] DEFAULT '{}',        -- 父节点 ID 列表（杂交时有多个）
  generation INT NOT NULL DEFAULT 0,     -- 第几代（种子 = 0）
  mutation_type VARCHAR(20) NOT NULL,    -- seed / tweak / crossover / inversion / random / hybrid
  
  -- 状态
  status VARCHAR(20) DEFAULT 'active',   -- active / selected / dormant / locked
  
  -- Critic 评分
  score_freshness INT,                   -- 0-100
  score_resonance INT,                   -- 0-100
  score_feasibility INT,                 -- 0-100
  
  -- 星系可视化位置（前端计算后回写，或纯前端管理）
  position_x FLOAT,
  position_y FLOAT,
  brightness FLOAT DEFAULT 1.0,          -- 0-1
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 添加外键
ALTER TABLE evolution_sessions 
  ADD CONSTRAINT fk_locked_idea 
  FOREIGN KEY (locked_idea_id) REFERENCES idea_nodes(id);

-- 索引
CREATE INDEX idx_idea_nodes_session ON idea_nodes(session_id);
CREATE INDEX idx_idea_nodes_status ON idea_nodes(session_id, status);
CREATE INDEX idx_sessions_user ON evolution_sessions(user_id);
```

**idea_briefs 表：**

```sql
CREATE TABLE idea_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES evolution_sessions(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES idea_nodes(id) ON DELETE CASCADE,
  
  core_angle TEXT NOT NULL,              -- 核心角度
  target_audience TEXT NOT NULL,
  outline_points TEXT[] NOT NULL,        -- 3-5 个内容要点
  evolution_path UUID[] NOT NULL,        -- 进化路径（id 链）
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### TypeScript 类型（前端共享）

```typescript
// types/idea.ts

export type MutationType = 'seed' | 'tweak' | 'crossover' | 'inversion' | 'random' | 'hybrid';
export type NodeStatus = 'active' | 'selected' | 'dormant' | 'locked';
export type SessionStatus = 'evolving' | 'completed' | 'abandoned';
export type ContentType = 'video' | 'article' | 'podcast' | 'newsletter';

export interface IdeaNode {
  id: string;
  sessionId: string;
  title: string;
  description?: string;
  tags: string[];
  whyPromising?: string;
  parentIds: string[];
  generation: number;
  mutationType: MutationType;
  status: NodeStatus;
  scores?: {
    freshness: number;
    resonance: number;
    feasibility: number;
  };
  position?: { x: number; y: number };
  brightness: number;
  createdAt: string;
}

export interface EvolutionSession {
  id: string;
  userId: string;
  seedInput: string;
  contentType: ContentType;
  channelDescription?: string;
  currentGeneration: number;
  totalNodes: number;
  lockedIdeaId?: string;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IdeaBrief {
  id: string;
  sessionId: string;
  ideaId: string;
  coreAngle: string;
  targetAudience: string;
  outlinePoints: string[];
  evolutionPath: string[];
  createdAt: string;
}

// WebSocket 事件类型
export type WSEvent =
  | { type: 'node_emerging'; node: IdeaNode; delay: number }
  | { type: 'evolution_complete'; generation: number }
  | { type: 'brief_generated'; brief: IdeaBrief }
  | { type: 'error'; message: string };
```

---

## API 设计

### REST Endpoints

```
POST   /api/sessions                     创建进化会话
  body: { seedInput: string, contentType: string, channelDescription?: string }
  returns: EvolutionSession

GET    /api/sessions/:id                  获取会话详情
  returns: EvolutionSession

GET    /api/sessions/:id/nodes            获取会话所有 idea 节点
  returns: IdeaNode[]

POST   /api/sessions/:id/evolve           触发一轮进化
  body: { selectedIds: string[], hybridize?: boolean }
  returns: { generation: number }
  注意：实际 idea 节点通过 WebSocket 逐个推送

POST   /api/sessions/:id/lock/:nodeId     锁定最终选题
  returns: IdeaBrief

POST   /api/sessions/:id/revive/:nodeId   复活一个休眠节点
  returns: IdeaNode (status 变为 active)

GET    /api/users/me/sessions             当前用户所有会话
  returns: EvolutionSession[]
```

### WebSocket Protocol

连接地址：`ws://HOST/ws/sessions/:sessionId`

**Client → Server：**

```json
{ "type": "start_evolution", "selectedIds": ["uuid1", "uuid2"], "hybridize": false }
{ "type": "start_evolution", "selectedIds": ["uuid1", "uuid2"], "hybridize": true }
```

**Server → Client（逐个推送，配合前端动画）：**

```json
{ "type": "node_emerging", "node": { /* IdeaNode */ }, "delay": 0 }
{ "type": "node_emerging", "node": { /* IdeaNode */ }, "delay": 800 }
{ "type": "node_emerging", "node": { /* IdeaNode */ }, "delay": 1600 }
{ "type": "evolution_complete", "generation": 2 }
```

delay 字段告诉前端每个节点的出场延迟（ms），前端据此编排动画。

---

## Agent 编排（后端核心）

### 进化引擎 Pipeline

不使用 LangChain。自建轻量编排：

```python
# engine/evolution.py

import random
from anthropic import AsyncAnthropic

class EvolutionEngine:
    def __init__(self, llm_client: AsyncAnthropic):
        self.client = llm_client
        self.mutation_agent = MutationAgent(llm_client)
        self.critic_agent = CriticAgent(llm_client)
        self.hybrid_agent = HybridAgent(llm_client)
    
    async def big_bang(self, session: EvolutionSession) -> list[IdeaNode]:
        """第一次进化：从种子生成第一代变异"""
        seed_node = create_seed_node(session)
        variants = await self.mutation_agent.generate_first_gen(
            seed_input=session.seed_input,
            content_type=session.content_type,
            channel_description=session.channel_description,
            count=4
        )
        scored = await self.critic_agent.evaluate(variants, session)
        return [seed_node] + scored
    
    async def evolve(self, selected_ids: list[str], session: EvolutionSession, hybridize: bool = False) -> list[IdeaNode]:
        """一轮进化的完整流程"""
        parents = await self.get_nodes(selected_ids)
        
        if hybridize and len(parents) == 2:
            # 杂交模式
            hybrid_child = await self.hybrid_agent.hybridize(parents[0], parents[1], session)
            variants = await self.mutation_agent.generate_from_parent(hybrid_child, session, count=2)
            candidates = [hybrid_child] + variants
        else:
            # 标准变异模式
            parent = parents[0]
            strategies = self.select_strategies(parent, session)
            candidates = await self.mutation_agent.generate(parent, strategies, session)
        
        # Critic 评分
        scored = await self.critic_agent.evaluate(candidates, session)
        
        # 20% 概率注入随机突变
        if random.random() < 0.2:
            mutant = await self.mutation_agent.random_mutate(session)
            mutant_scored = await self.critic_agent.evaluate([mutant], session)
            scored.extend(mutant_scored)
        
        return scored[:4]  # 最多返回 4 个
    
    def select_strategies(self, parent: IdeaNode, session: EvolutionSession) -> list[str]:
        """根据进化阶段选择变异策略组合"""
        gen = session.current_generation
        if gen <= 1:
            return ['tweak', 'crossover', 'inversion']  # 早期：多样化探索
        else:
            return ['tweak', 'tweak', 'crossover']       # 后期：偏向收敛
```

### Mutation Agent — 完整 Prompt

```python
# agents/mutation.py

MUTATION_SYSTEM_PROMPT = """你是微纪元的创意进化引擎。你的任务是基于给定的 idea 生成变异体。

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

不要输出任何 JSON 以外的内容。不要包含 markdown 代码块标记。"""

MUTATION_USER_TEMPLATE = """## 上下文
内容类型: {content_type}
频道方向: {channel_description}
原始种子: {seed_input}

## 亲本 Idea
标题: {parent_title}
描述: {parent_description}
标签: {parent_tags}

## 任务
请使用以下策略各生成一个变异体: {strategies}

输出 JSON 数组:"""
```

### Critic Agent — 完整 Prompt

```python
# agents/critic.py

CRITIC_SYSTEM_PROMPT = """你是微纪元的内容策略评估专家。你的任务是评估每个 idea 变异体的质量。

## 评估维度

1. freshness (0-100): 这个角度在目标平台上有多稀缺？
   90+ = 前所未有的角度
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

不要输出任何 JSON 以外的内容。"""

CRITIC_USER_TEMPLATE = """## 上下文
内容类型: {content_type}
频道方向: {channel_description}
目标平台: {content_type}

## 待评估的 Ideas
{ideas_json}

输出 JSON 数组:"""
```

### Hybrid Agent — 完整 Prompt

```python
# agents/hybrid.py

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
```

### Brief 生成 Prompt

```python
# agents/brief.py

BRIEF_SYSTEM_PROMPT = """你是微纪元的选题策划专家。用户已经通过进化过程锁定了一个最终 idea，你需要生成一份结构化的选题 Brief。

## 输出要求
输出单个 JSON 对象，包含：
- coreAngle: string — 核心角度，用一段话清晰阐述（50-100 字）
- targetAudience: string — 目标受众描述（一句话）
- outlinePoints: string[] — 内容大纲，3-5 个要点，每个要点是一句话描述该部分的内容
- insightSummary: string — 一句话总结这个选题为什么好

大纲要点应该形成一个有叙事弧线的结构（开头吸引注意 → 展开论述 → 转折或高潮 → 结尾收束）。

不要输出任何 JSON 以外的内容。"""
```

### LLM 调用封装

```python
# llm/client.py

import json
from anthropic import AsyncAnthropic

MODEL = "claude-sonnet-4-20250514"

async def call_llm(client: AsyncAnthropic, system: str, user: str) -> dict | list:
    """统一的 LLM 调用封装，返回解析后的 JSON"""
    response = await client.messages.create(
        model=MODEL,
        max_tokens=2000,
        system=system,
        messages=[{"role": "user", "content": user}]
    )
    
    text = response.content[0].text.strip()
    # 清理可能的 markdown 标记
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    text = text.strip()
    
    return json.loads(text)
```

---

## 前端结构

### 目录结构

```
src/
├── app/
│   ├── layout.tsx                  # 根布局
│   ├── page.tsx                    # 首页 / Landing
│   ├── evolve/
│   │   └── [sessionId]/
│   │       └── page.tsx            # 进化主界面（星系 + 交互）
│   └── api/                        # Next.js API routes（如果不用独立后端可做 BFF）
├── components/
│   ├── galaxy/
│   │   ├── GalaxyCanvas.tsx        # 星系主画布（React Flow 容器）
│   │   ├── IdeaNodeComponent.tsx   # 自定义星球节点
│   │   ├── EdgeComponent.tsx       # 自定义连线（进化路径）
│   │   └── GalaxyLayout.ts        # 径向布局算法
│   ├── panels/
│   │   ├── SeedInput.tsx           # 种子输入面板
│   │   ├── NodeDetail.tsx          # 节点详情侧边栏
│   │   ├── BriefPanel.tsx          # 锁定后的 Brief 展示
│   │   └── ControlBar.tsx          # 底部控制栏（进化/杂交/锁定按钮）
│   └── ui/
│       ├── ScoreBar.tsx            # 评分可视化条
│       ├── MutationBadge.tsx       # 变异类型标签
│       └── GlowButton.tsx         # 发光按钮组件
├── stores/
│   └── evolutionStore.ts           # Zustand store（会话状态、节点树、UI 状态）
├── hooks/
│   ├── useEvolution.ts             # 进化操作 hook（调 API、处理 WebSocket）
│   └── useWebSocket.ts            # WebSocket 连接管理
├── lib/
│   ├── api.ts                      # REST API 客户端
│   └── galaxyLayout.ts            # 布局计算工具函数
└── types/
    └── idea.ts                     # 共享类型定义（上面已给出）
```

### Zustand Store 结构

```typescript
// stores/evolutionStore.ts

interface EvolutionStore {
  // 会话
  session: EvolutionSession | null;
  
  // 节点树
  nodes: Map<string, IdeaNode>;
  
  // UI 状态
  selectedNodeIds: string[];        // 当前选中的节点（用于进化/杂交）
  focusedNodeId: string | null;     // 当前查看详情的节点
  isEvolving: boolean;              // 是否正在进化中
  
  // Brief
  brief: IdeaBrief | null;
  
  // Actions
  setSession: (session: EvolutionSession) => void;
  addNode: (node: IdeaNode) => void;
  updateNodeStatus: (nodeId: string, status: NodeStatus) => void;
  selectNode: (nodeId: string) => void;
  deselectNode: (nodeId: string) => void;
  focusNode: (nodeId: string | null) => void;
  setEvolving: (v: boolean) => void;
  setBrief: (brief: IdeaBrief) => void;
  reset: () => void;
}
```

### 星系节点组件

```typescript
// components/galaxy/IdeaNodeComponent.tsx
// 使用 React Flow 的自定义节点

import { motion } from 'framer-motion';

const colorMap: Record<MutationType, string> = {
  seed: '#f0c86c',       // 金色
  tweak: '#7c6cf0',      // 紫色
  crossover: '#6c9ff0',  // 蓝色
  inversion: '#f06c8c',  // 粉红
  random: '#f06c8c',     // 粉红（脉冲动画区分）
  hybrid: '#6cf0c8',     // 青绿
};

// 节点大小根据状态变化：
// seed: 70px, selected: 60px, active: 45px, dormant: 30px, locked: 80px
// 光晕强度 = brightness 值 × 20px spread
// dormant 节点 opacity: 0.4
```

---

## 开发顺序

严格按以下顺序开发，每个 Phase 完成后应可独立运行和测试。

### Phase 1: 项目初始化与数据层

1. 初始化 Next.js 14 项目（App Router, TypeScript, Tailwind）
2. 初始化 FastAPI 后端项目
3. 配置 PostgreSQL 数据库，执行建表 SQL
4. 配置 Redis 连接
5. 实现数据库 CRUD 操作（sessions, idea_nodes, briefs）
6. 编写 TypeScript 类型定义文件
7. 配置环境变量（.env.local）：ANTHROPIC_API_KEY, DATABASE_URL, REDIS_URL

### Phase 2: Agent 核心逻辑

1. 实现 LLM 调用封装（call_llm 函数）
2. 实现 MutationAgent（含 generate_first_gen, generate, random_mutate）
3. 实现 CriticAgent（evaluate 方法）
4. 实现 HybridAgent（hybridize 方法）
5. 实现 EvolutionEngine（big_bang, evolve 流程编排）
6. 实现 Brief 生成
7. 编写单元测试：验证各 Agent 输出格式正确、JSON 可解析

### Phase 3: API 层

1. 实现所有 REST endpoints
2. 实现 WebSocket 连接和事件推送
3. 实现进化过程中节点的逐个推送（delay 机制）
4. 端到端测试：通过 API 完成一次完整进化流程

### Phase 4: 前端 — 种子输入

1. 实现 SeedInput 组件（输入框 + 内容类型选择 + 频道描述）
2. 实现首页到进化页的路由跳转
3. 调用 POST /api/sessions 创建会话

### Phase 5: 前端 — 星系可视化

1. 搭建 React Flow 画布（GalaxyCanvas）
2. 实现自定义 IdeaNodeComponent（发光星球）
3. 实现自定义 EdgeComponent（进化路径连线）
4. 实现径向布局算法（GalaxyLayout）
5. 实现大爆炸动画（种子出现 → 脉冲 → 子节点依次弹出）
6. 实现 WebSocket hook，接收 node_emerging 事件并触发节点入场动画

### Phase 6: 前端 — 交互逻辑

1. 实现节点选择（单选 / 多选用于杂交）
2. 实现进化触发（选中后点击"进化"按钮或拖拽触发杂交）
3. 实现进化动画（新节点从父节点方向飞出）
4. 实现淘汰效果（未选中的节点变暗、缩小、外漂）
5. 实现节点详情侧边栏（NodeDetail：标题、描述、标签、评分）
6. 实现锁定选题流程（Lock → Brief 生成 → BriefPanel 展示）
7. 实现暗星云双击复活

### Phase 7: 联调与打磨

1. 前后端联调完整流程
2. 动画节奏调优（大爆炸时长、节点出场间隔、淘汰过渡）
3. Prompt 质量迭代（测试不同种子，检查变异多样性和 Critic 准确性）
4. 用户认证集成（NextAuth 或 Clerk）
5. 错误处理和 loading 状态
6. 响应式适配（桌面优先，平板次之）
7. 部署到 Vercel + Railway

---

## LLM 调用约束

- 模型：Claude Sonnet（claude-sonnet-4-20250514）
- 所有 Agent prompt 要求返回纯 JSON，不带 markdown 标记
- 单次进化的 token 预算：input ~2000, output ~1000
- 完整流程（3 轮 + brief）约 8000-10000 tokens，成本约 $0.03-0.05
- 错误处理：JSON 解析失败时重试一次，仍失败则返回预设的 fallback 变异
- 并行优化：变异和评分可以流水线化，第一个变异生成后立即开始评分
- Context 压缩：每轮只传当前选中节点 + 种子信息，不传整棵树

---

## 视觉设计规范

### 色彩

```
背景:       #0a0a12 (深太空色)
表面:       #12121e
边框:       #1e1e35
主文字:     #e8e6f0
次文字:     #8a87a0
弱文字:     #5a5872

主色:       #7c6cf0 (紫色，活跃/选中)
金色:       #f0c86c (锁定/最终选择)
粉色:       #f06c8c (反转/突变)
青绿:       #6cf0c8 (杂交)
暗色:       #3a3850 (休眠/淘汰)
```

### 动画时序

```
大爆炸动画:         种子出现 400ms → 脉冲 300ms → 首个子节点 600ms → 后续节点每个间隔 600-800ms
进化节点入场:       从父节点位置弹出，ease-out 600ms
淘汰节点消退:       缩小 + 变暗 + 外漂，800ms
杂交动画:           两节点连线出现 400ms → 交汇点光效 300ms → 新节点弹出 600ms
锁定动画:           节点放大 + 金色脉冲 500ms → 其他节点淡出 800ms
```

### 字体

系统字体栈，中文优先：`'SF Pro Display', -apple-system, 'Noto Sans SC', 'PingFang SC', sans-serif`

---

## 环境变量

```env
# .env.local (Frontend)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# .env (Backend)
ANTHROPIC_API_KEY=sk-ant-xxx
DATABASE_URL=postgresql://user:pass@host:5432/microera
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=http://localhost:3000
```

---

## 关键提醒

1. **不要过度工程化。** MVP 的目标是验证"用户愿意通过进化方式发展 idea"这个核心假设。能跑通闭环就行。
2. **Prompt 是最重要的代码。** 花时间调试变异 Agent 的 prompt，确保输出有足够的多样性和创意质量。
3. **动画是产品的灵魂。** 节点逐个"长出来"的感觉是核心体验，不能省略。先让动画跑通，再优化细节。
4. **星系可视化 MVP 用 2D。** 不要尝试 3D，React Flow + Framer Motion 足够。
5. **JSON 解析要健壮。** LLM 输出不总是完美的 JSON，要有清理和重试逻辑。
6. **限制进化轮数。** MVP 最多 5 轮进化（约 20 个节点），避免性能问题。
