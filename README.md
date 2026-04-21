# 微纪元 Micro Era

> Stop brainstorming. Start evolving.

微纪元是一个面向内容创作者的「选题进化」原型项目。

它不把 LLM 当成一次性灵感生成器，而是把模糊想法当作一个种子，通过多轮变异、评分、杂交和锁定，逐步收敛成一个更可执行的选题 Brief。

当前仓库实现的是第一阶段 MVP，重点验证以下事情：

- 用户是否愿意从"想点子"切换到"进化点子"
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
- 新节点逐个出现（带动画延迟），前端做渐进式展示

## 纯前端架构

这是一个**纯前端应用**，不需要后端服务器：

- **LLM 调用**：浏览器直接调用 OpenAI 兼容的 Chat Completions API
- **数据持久化**：所有会话、节点、Brief 保存在 `localStorage`
- **演化引擎**：完全在浏览器中运行（Mutation → Critic → Hybrid → Brief Agent）
- **API Key 管理**：用户在页面输入自己的 Key，存在浏览器本地

支持的 LLM 提供商（任何 OpenAI 兼容接口）：

- **OpenAI**：留空 Base URL，model = `gpt-4o`
- **Moonshot**：Base URL = `https://api.moonshot.cn/v1`，model = `moonshot-v1-8k`
- **DeepSeek**：Base URL = `https://api.deepseek.com/v1`，model = `deepseek-chat`

## 技术栈

- **Next.js 14+** (App Router) — 框架
- **TypeScript** — 语言
- **Tailwind CSS** — 样式
- **React Flow** — 星系节点图基础
- **Framer Motion** — 动画
- **Zustand** — 状态管理

## 项目结构

```text
micro-era/
└── src/
    ├── app/
    │   ├── page.tsx                    # 首页 + 种子输入 + 设置面板
    │   └── evolve/[sessionId]/page.tsx # 演化主界面
    ├── components/
    │   ├── galaxy/                     # GalaxyCanvas, IdeaNode, Edge, Layout
    │   ├── panels/                     # SeedInput, NodeDetail, ControlBar, BriefPanel, SettingsPanel
    │   └── ui/                         # ScoreBar, MutationBadge, GlowButton
    ├── stores/evolutionStore.ts        # Zustand store
    ├── hooks/
    │   ├── useEvolution.ts             # 演化流程编排（BigBang, Evolve, Lock, Revive）
    │   └── useLLMConfig.ts             # API Key 配置管理
    ├── lib/
    │   ├── api.ts                      # 本地存储 API 封装
    │   ├── galaxyLayout.ts             # 径向布局算法
    │   ├── llm/client.ts               # fetch-based LLM 客户端
    │   ├── agents/                     # Mutation, Critic, Hybrid, Brief
    │   ├── engine/evolution.ts          # EvolutionEngine
    │   └── store/localStore.ts          # localStorage 持久化
    └── types/idea.ts                   # 类型定义
```

## 快速开始

### 前置要求

- Node.js 20+
- npm 10+
- 一个 OpenAI 兼容的 API Key

### 安装和启动

```bash
npm install
npm run dev
```

然后访问 http://localhost:3000

### 配置 API Key

1. 打开首页
2. 在底部展开「API 设置」面板
3. 输入你的 API Key
4. 可选：填写 Base URL（用于非 OpenAI 提供商）和模型名称
5. 密钥保存在浏览器本地，不会发送到任何服务器

## 使用流程

### 1. 创建会话

在首页输入：

- 一个模糊的种子想法
- 内容类型：视频 / 文章 / 播客 / Newsletter
- 可选的频道方向描述

提交后跳转到演化页面。

### 2. Big Bang

进入演化页面后，如果当前会话还没有节点，系统会自动执行第一轮 Big Bang：

- 创建种子节点
- 生成第一代变异体（4 个方向）
- Critic 评分
- 节点逐个出现在画板上

### 3. 继续进化

- 选中 1 个节点 → 点击「继续扩写」
- 选中 2 个节点 → 点击「融合方向」
- 双击灰色节点 → 复活淘汰方向

### 4. 锁定 Brief

当选定一个最终方向后：

- 点击「锁定成 Brief」
- 系统回溯演化路径并生成结构化 Brief
- 包含核心角度、目标受众、内容大纲

## 演化机制

内置的变异策略：

- `tweak`：保持核心角度，微调切入点或表达方式
- `crossover`：引入其他领域视角
- `inversion`：从相反立场重构命题
- `random`：保留抽象主题联系，做大跨度跳跃
- `hybrid`：融合两个已选节点

第一轮尽量铺开探索空间，后续轮次更偏向收敛。每轮有 20% 概率出现随机突变。

## 开发命令

```bash
npm run dev        # 开发服务器 :3000
npm run build      # 生产构建
npx tsc --noEmit   # 类型检查
```
