# 微纪元 Micro Era

> Stop brainstorming. Start evolving.

微纪元是一个面向内容创作者的「选题进化」原型项目。

它不把 LLM 当成一次性灵感生成器，而是把模糊想法当作一个种子，通过多轮变异、评分、杂交和锁定，逐步收敛成一个更可执行的选题 Brief。

当前仓库实现的是第一阶段 MVP，重点验证以下事情：

- 用户是否愿意从“想点子”切换到“进化点子”
- 多轮候选生成 + 评分是否比单次生成更有价值
- 可视化的节点演化界面是否能帮助用户做判断

## 核心能力

- 输入一个模糊的种子想法，创建演化会话
- 基于种子自动生成第一代候选节点
- 对候选节点进行评分，辅助选择
- 支持继续进化单个节点
- 支持选中两个节点进行 hybridize（杂交）
- 支持 revive 沉睡节点，重新回到探索流程
- 锁定最终节点后生成结构化 Brief
- 通过 WebSocket 逐个推送新节点，前端做渐进式展示

## 当前实现范围

### 后端

- `FastAPI` 提供 HTTP API 和 WebSocket 接口
- `OpenAI-compatible` LLM 客户端
- 四类 agent：
  - `MutationAgent`：生成变异体
  - `CriticAgent`：给候选打分
  - `HybridAgent`：融合两个亲本节点
  - `BriefAgent`：为最终节点生成 Brief
- `EvolutionEngine` 负责串起整个演化流程
- 使用内存存储会话、节点和 brief，不依赖数据库或 Redis

### 前端

- `Next.js` App Router
- 首页输入种子想法、内容类型、频道方向
- 演化页使用 `React Flow` 展示 idea galaxy
- 支持选择、聚焦、进化、杂交、锁定、查看 Brief
- 使用 `Zustand` 管理前端状态
- 使用 `framer-motion` 做基础动效

## 项目结构

```text
micro-era/
├── backend/                # FastAPI 后端
│   ├── app/
│   │   ├── agents/         # mutation / critic / hybrid / brief
│   │   ├── engine/         # 演化主流程
│   │   ├── llm/            # OpenAI-compatible client
│   │   ├── routers/        # HTTP / WebSocket 路由
│   │   ├── schemas/        # Pydantic schema
│   │   └── store.py        # 内存存储
│   ├── tests/
│   └── requirements.txt
├── frontend/               # Next.js 前端
│   ├── src/app/            # 页面入口
│   ├── src/components/     # galaxy / panels / ui
│   ├── src/hooks/          # REST / WebSocket 逻辑
│   ├── src/lib/            # API 封装
│   ├── src/stores/         # Zustand store
│   └── src/types/          # 类型定义
└── README.md
```

## 运行环境

建议环境：

- Python 3.11+
- Node.js 20+
- npm 10+

LLM 侧默认使用 OpenAI，也支持任何兼容 OpenAI API 的服务，只要提供兼容的 `base_url` 即可。

## 快速开始

### 1. 启动后端

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

编辑 `backend/.env`：

```env
OPENAI_API_KEY=sk-xxx
LLM_BASE_URL=
LLM_MODEL=gpt-4o-mini
```

说明：

- `OPENAI_API_KEY`：必填
- `LLM_BASE_URL`：可选；留空时走 OpenAI 官方地址，也可以配置 Moonshot、DeepSeek 等兼容接口
- `LLM_MODEL`：默认是 `gpt-4o-mini`

启动服务：

```bash
uvicorn app.main:app --reload --port 8000
```

后端健康检查：

```bash
curl http://localhost:8000/health
```

### 2. 启动前端

```bash
cd frontend
npm install
```

创建 `frontend/.env.local`：

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

启动开发环境：

```bash
npm run dev
```

然后访问：

```text
http://localhost:3000
```

## 使用流程

### 1. 创建会话

在首页输入：

- 一个模糊的种子想法
- 内容类型：视频 / 文章 / 播客 / Newsletter
- 可选的频道方向描述

提交后，前端会先创建 session，然后跳转到演化页面。

### 2. Big Bang

演化页建立 WebSocket 连接后，如果当前 session 还没有生成过节点，后端会自动执行第一轮 Big Bang：

- 创建 seed 节点
- 生成第一代变异体
- 调用 critic 对候选打分
- 按顺序推送给前端展示

### 3. 继续进化

用户可以：

- 选中 1 个节点，继续 evolve
- 选中 2 个节点，进行 hybridize
- 双击 dormant 节点，将其 revive 为 active

后端每一轮最多返回一批新的候选节点，前端按流式事件逐步呈现。

### 4. 锁定 Brief

当用户决定某个节点方向成立后，可以执行 lock：

- 回溯该节点的演化路径
- 基于路径和当前节点生成结构化 Brief
- 将 session 标记为完成

## 演化机制

当前版本内置的主要策略：

- `tweak`：保持核心角度，微调切入点或表达方式
- `crossover`：引入其他领域视角
- `inversion`：从相反立场重构命题
- `random`：保留抽象主题联系，做大跨度跳跃
- `hybrid`：融合两个已选节点

第一轮会尽量铺开探索空间，后续轮次更偏向收敛。

## API 概览

### HTTP

- `GET /health`
- `POST /api/sessions`
- `GET /api/sessions/{session_id}`
- `GET /api/sessions/{session_id}/nodes`
- `POST /api/sessions/{session_id}/evolve`
- `POST /api/sessions/{session_id}/lock/{node_id}`
- `POST /api/sessions/{session_id}/revive/{node_id}`
- `GET /api/users/me/sessions`

### WebSocket

- `WS /ws/sessions/{session_id}`

主要事件：

- `node_emerging`
- `evolution_complete`
- `error`

## 测试

后端目前有一组偏 smoke test / contract test 的 agent 测试，用来确认 LLM 返回的 JSON 结构可解析。

运行方式：

```bash
cd backend
source .venv/bin/activate
pytest -q
```

注意：

- 这些测试依赖真实的 `OPENAI_API_KEY`
- 没有 key 时会自动跳过
- 当前测试更关注输出结构，不是完整业务覆盖

## 当前限制

- 使用内存存储，服务重启后数据会丢失
- 没有用户系统，当前使用固定 demo user
- 没有持久化队列和后台任务系统
- 没有细粒度鉴权和多租户隔离
- 前端和后端都还处于 MVP 阶段，接口和数据结构仍可能调整

## 适合继续补强的方向

- 接入数据库和持久化存储
- 为 session / node / brief 增加更完整的查询能力
- 增加更稳定的测试覆盖，而不是只测 LLM 输出格式
- 为不同内容类型设计更细的评分标准
- 支持演化历史回放、导出、分享
- 增加更精细的前端状态与错误处理
