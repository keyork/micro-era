# 微纪元 Micro Era

Micro Era 是一个面向内容创作者的纯前端选题进化工作台。

它不把 LLM 当成一次性灵感生成器，而是把一个粗糙主题当作“种子”：先扩展出候选方向，再评分、筛选、融合、复活，最后锁定一个方向并生成结构化内容 Brief。

当前版本是 MVP，重点打通完整流程：

1. 连接一个 OpenAI 兼容的 LLM。
2. 输入种子想法。
3. 进入想法星系画板。
4. 继续演化、融合、复活并锁定最终方向。
5. 将最终 Brief 导出为 Markdown。

## 功能

- 纯前端应用，不需要自建后端。
- 浏览器直接调用 OpenAI 兼容的 Chat Completions API。
- 会话、节点和 Brief 使用 `localStorage` 保存在本地浏览器。
- 首页是引导式流程：先连接模型，再填写想法。
- 根据种子主题生成第一代候选方向。
- 对候选方向进行 freshness、resonance、feasibility 三维评分。
- 使用 React Flow 画板进行节点选择、复活、演化和融合。
- 锁定最终方向后生成核心角度、目标受众、大纲和演化路径。
- 最终 Brief 支持 Markdown 导出。

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- React Flow
- Framer Motion
- Zustand

## 环境要求

- Node.js 20+
- npm 10+
- 一个 OpenAI 兼容 API Key

## 快速开始

```bash
npm install
npm run dev
```

打开 http://localhost:3000。

`npm run dev` 当前刻意使用 webpack：

```json
"dev": "next dev . --webpack"
```

原因是当前工作区结构下，Turbopack dev 的 CSS resolver 可能会从父目录解析 Tailwind，导致 `Can't resolve 'tailwindcss'`。生产构建仍使用 Next.js 默认构建流程。

## LLM 配置

Micro Era 会从浏览器直接请求你配置的 LLM 服务。API Key 只保存在当前浏览器的 `localStorage` 中。

首页操作流程：

1. 进入模型配置步骤。
2. 输入 API Key。
3. 可选填写 Base URL 和模型名称。
4. 使用连接测试确认配置可用。
5. 再进入想法输入步骤创建会话。

常见兼容接口示例：

| 提供商 | Base URL | 模型示例 |
| --- | --- | --- |
| OpenAI | `https://api.openai.com/v1` 或留空 | `gpt-4o-mini` |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| Moonshot | `https://api.moonshot.cn/v1` | `moonshot-v1-8k` |

注意：提供商必须支持浏览器可直接访问的 OpenAI 兼容 `/chat/completions` 接口。有些服务会因为 CORS 策略拒绝浏览器直连。

## 使用流程

### 1. 连接模型

应用会先引导你配置 LLM。这样可以避免创建了种子会话却无法生成第一代节点。

### 2. 输入种子想法

填写一个粗糙主题，选择内容类型，并可选描述你的频道方向或目标受众。种子不需要完整成稿，但最好包含你想探索的矛盾、观察或情绪。

### 3. 生成第一代星系

提交种子后进入画板，并自动执行第一轮扩展：

- 创建种子节点。
- 生成第一代变异方向。
- 对候选方向评分。
- 将节点放到星系画板中。

### 4. 探索和演化

在画板中：

- 点击 active 节点可以选中或取消选中。
- 选中 1 个节点后可以继续演化下一代。
- 选中 2 个节点后可以融合方向。
- 双击 dormant 节点可以复活它。
- 锁定 1 个节点后生成最终 Brief。

### 5. 导出 Brief

锁定方向后，Micro Era 会生成 Brief，并支持导出 Markdown。导出内容包括：

- 核心角度
- 目标受众
- 内容大纲
- 演化路径

## 演化机制

第一代默认使用四种变异策略：

- `tweak`：保留核心角度，微调表达方式或切入点。
- `crossover`：引入另一个领域或视角。
- `inversion`：从相反前提出发重构命题。
- `random`：在保留抽象关联的基础上做更大跳跃。

后续还支持：

- `hybrid`：融合两个被选中的父节点。

Critic Agent 会从三个维度给候选方向评分：

- Freshness：角度是否新鲜
- Resonance：是否能引发情绪和共鸣
- Feasibility：是否容易执行落地

如果 LLM 返回了格式不规范的 JSON，客户端会尝试修复。修复失败时，部分 Agent 会退回到结构化占位结果，避免界面空白。

## 项目结构

```text
src/
  app/
    page.tsx
    evolve/[sessionId]/page.tsx
    globals.css
  components/
    home/                 # 首页引导流程
    galaxy/               # React Flow 画板、节点、边、背景
    panels/               # 种子输入、设置、控制栏、详情、Brief 面板
    ui/
  hooks/
    useEvolution.ts       # 前端演化流程编排
    useLLMConfig.ts       # 本地 LLM 配置
  lib/
    agents/               # mutation、critic、hybrid、brief agents
    engine/evolution.ts   # EvolutionEngine
    llm/client.ts         # OpenAI 兼容 fetch client
    store/localStore.ts   # localStorage 持久化
    api.ts
  stores/
    evolutionStore.ts
  types/
    idea.ts
```

## 脚本

```bash
npm run dev      # 使用 webpack 启动本地开发服务
npm run build    # 生产构建
npm run start    # 启动构建后的应用
```

## 数据和隐私

这个仓库没有自定义后端。

- API Key：保存在浏览器 `localStorage`。
- 会话：保存在浏览器 `localStorage`。
- 节点和 Brief：保存在浏览器 `localStorage`。
- LLM prompt 和响应：浏览器直接发送到你配置的提供商。

不要在共享或不可信的浏览器环境里使用敏感 API Key。

## 已知限制

- 浏览器直连 LLM 依赖提供商的 CORS 支持。
- `localStorage` 适合 MVP，不适合多设备同步。
- 长时间或重复会话会增加 localStorage 占用。
- 画板针对中等节点数量优化，不适合展示成千上万个节点。
- 开发模式使用 webpack，是为了避开当前工作区下 Turbopack dev 的 Tailwind 解析问题。

## 常见问题

### dev 模式出现 Tailwind 解析错误

如果看到类似错误：

```text
Can't resolve 'tailwindcss' in '/Users/.../work/ky'
```

请确认使用的是：

```bash
npm run dev
```

并且 `package.json` 里的 dev 脚本仍包含 `--webpack`。

### LLM 连接失败

检查：

- API Key 是否填写。
- Base URL 是否正确。
- 模型名称是否被提供商支持。
- 提供商是否允许浏览器请求。
- 浏览器控制台是否有网络或 CORS 错误。

### 进入画板但没有节点

检查：

- 是否已经配置 API Key。
- 第一代 LLM 请求是否成功。
- 浏览器是否禁用了 localStorage。
- localStorage 是否已满。

如果某个 session 数据异常，可以回到首页重新创建会话。

## License

见 [LICENSE](./LICENSE)。
