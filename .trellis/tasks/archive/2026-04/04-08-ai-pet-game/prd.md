# AI 驱动的电子宠物应用 (AI Pet Game)

## Goal

创建一个高级AI电子宠物游戏，宠物拥有类人特性（多重性格、自我进化）、联网对战、社交互动、以及通过大模型驱动的智能对话能力。玩家可以自定义和改造宠物外观。

## What I already know

* **Platform**: Electron desktop app with Vite + TypeScript
* **Core Features**:
  - AI宠物具备多重性格特性
  - 通过大模型API进行智能对话
  - 宠物间可互相交谈
  - 变身和进化系统
  - 外部图片生成API集成（换装/改造）
  - 网联网对战功能
  - 宠物社交系统
  - 等级系统触发进化
* **Tech Stack**: Electron, Vite, TypeScript
* **Target**: Desktop gaming application
* **UI Framework**: Vue 3 + Pinia (confirmed)
* **Visual Style**: SVG-based animations (confirmed)
* **Database**: SQLite (better-sqlite3) (confirmed)

## Requirements (confirmed)

### API Configuration
* 支持多种LLM API提供商（OpenAI, Anthropic, 通义千问, Kimi等）
* **支持本地vLLM部署的API接口**（兼��OpenAI格式）
* 支持图片生成API（通义万相、DALL-E等）
* 用户可配置API端点和密钥

### Core Features
* 宠物核心交互：对话、响应、性格展现
* 多重性格系统：可切换或混合的性格特性
* 等级与进化：基于互动和成长的进化机制
* 外观系统：通过图片生成API换装/改造
* API配置界面：支持多种LLM和图片生成API
* 宠物状态持久化：使用SQLite本地存储

## Assumptions

* 网络连接为必要条件（AI对话需要）
* vLLM本地部署使用OpenAI兼容API格式
* 图片生成可使用本地Stable Diffusion或云端API
* 宠物外观变化通过图片生成API实现

## Research Notes

### What similar tools do

**AI Character Apps (e.g., character.ai, Inworld AI):**
- Use large language models for conversational AI
- Character profiles with defined traits/personalities
- Persistent memory of conversations

**Virtual Pet Games (e.g., Tamagotchi, Neopets):**
- Lifecycle management: hatch → grow → evolve
- Stats system: hunger, happiness, health
- Social features: trading, battling

**vLLM Deployments:**
- OpenAI-compatible API endpoint
- Can run locally without cloud dependency
- Supports standard chat completion format

### Constraints from our repo/project

* **Electron**: Desktop-only, can use Node.js APIs directly
* **CORS**: Main process handles API calls to avoid CORS issues
* **State Persistence**: Local SQLite database
* **vLLM Compatibility**: Must support OpenAI API format

### Feasible approaches here

**Hybrid Architecture with vLLM Support**

* How:
  - Electron app with Vue 3 + Pinia frontend
  - SVG-based pet rendering with animations
  - OpenAI-compatible API client
  - Support both cloud APIs and local vLLM endpoint
  - SQLite for pet state persistence
  - Optional cloud sync for backup

* Pros:
  - Works with cloud or local LLM
  - Flexible API configuration
  - Offline capability with local vLLM
  - Vue 3 is lightweight for desktop apps

## Requirements

### Core Features
* 宠物核心交互：对话、响应、性格展现
* 多重性格系统：可切换或混合的性格特性
* 等级与进化：基于互动和成长的进化机制
* 外观系统：通过图片生成API换装/改造
* API配置界面：支持多种LLM和图片生成API
* vLLM本地支持：兼容OpenAI格式的本地部署

### Technical Requirements
* Electron主进程处理网络请求（避免CORS）
* 渲染进程：Vue 3 + Pinia
* SVG渲染宠物形态
* SQLite (better-sqlite3) 本地存储宠物状态
* 支持用户自定义API端点和密钥

## Acceptance Criteria

* [ ] 宠物能通过大模型API进行自然对话
* [ ] 支持至少3种不同的性格
* [ ] 支持本地vLLM部署��OpenAI兼容API）
* [ ] 支持用户配置多个API提供商
* [ ] 宠物外观可以通过API变换
* [ ] 本地存储宠物状态和对话历史
* [ ] SVG宠物形象可动画展示

## Definition of Done

* 所有功能模块开发完成
* Lint / Typecheck通过
* 基本测试覆盖
* 文档更新（API配置指南）

## Out of Scope

* 移动端版本（本阶段仅桌面端）
* 硬件集成（如Arduino控制的实体宠物）
* 虚拟现实/AR体验

## Technical Approach

### Project Structure
```
src/
├── main.ts              # Electron main process
├── preload.ts           # Context bridge
├── renderer.ts          # Vue 3 app entry
├── api/                 # API clients
│   ├── llm.ts           # LLM API client (OpenAI-compatible)
│   └── image.ts         # Image generation API
├── db/                  # SQLite database
│   ├── schema.ts        # Database schema
│   └── pet.ts           # Pet data access
├── store/               # Pinia stores
│   ├── pet.ts           # Pet state
│   ├── chat.ts          # Chat history
│   └── config.ts        # API configuration
└── components/          # Vue components
    ├── Pet.vue          # SVG pet display
    ├── Chat.vue         # Chat interface
    └── Config.vue       # API config UI
```

### Technology Stack
* Electron + Vite + TypeScript
* Vue 3 + Pinia
* SQLite (better-sqlite3)
* SVG for pet rendering
* axios for API calls

### API Client Design
```typescript
// OpenAI-compatible interface
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMClient {
  chat(messages: ChatMessage[]): Promise<string>;
  getConfig(): LLMAPIConfig;
  setConfig(config: LLMAPIConfig): void;
}
```

## Decision (ADR-lite)

**Context**: 需要支持多种LLM API，包括云服务和本地vLLM部署

**Decision**: 采用OpenAI兼容API格式作为统一接口，支持用户自定义端点

**Consequences**: 
* 优点：兼容性好，支持大多数LLM服务
* 需要：开发API配置界面
* 限制：依赖API格式一致性

**UI Framework**: Vue 3 + Pinia
* 优点：轻量、文档友好、适合桌面应用
* 选择理由：比React更轻量，比Svelte生态更成熟

**Visual Style**: SVG-based animations
* 优点：可缩放、体积小、易于程序化控制
* 选择理由：适合宠物形态变化和进化效果

**Database**: SQLite (better-sqlite3)
* 优点：同步API、性能好、支持SQL
* 选择理由：简单可靠，适合本地存储
