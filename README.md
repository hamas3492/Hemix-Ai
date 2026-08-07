<div align="center">
  <img src="public/assets/logo.png" alt="Hemix AI Logo" width="280" />

  # Hemix AI

  ### Think Faster. Create Smarter.

  **A premium AI chatbot SaaS platform** — multi-model support for GPT-5.0, Claude 5, Claude 4.8, Gemini, DeepSeek, Qwen, Llama, Mistral, OpenRouter, and AgentRouter.

  [![Live Demo](https://img.shields.io/badge/Live-hemix--ai.vercel.app-8B5CF6?style=for-the-badge)](https://hemix-ai.vercel.app)
  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)

  **🔗 Live App: [hemix-ai.vercel.app](https://hemix-ai.vercel.app)**
</div>

---

## Features

- 🎨 **Premium UI** — Glassmorphism design with animated aurora background
- 🤖 **Multi-Model** — Switch between GPT-5.0, Claude 5, Claude 4.8, Gemini, DeepSeek, Qwen, Llama, Mistral, and more in real-time
- ⚡ **Streaming** — Real-time streaming responses with syntax highlighting
- 📝 **Markdown** — Full markdown rendering with code blocks and copy support
- 📎 **File Upload** — Upload images and files to any conversation
- 🔐 **Auth** — Login, signup, forgot password, remember me
- 💬 **Chat Management** — Pin, rename, delete, search, and export conversations
- ⌨️ **Keyboard Shortcuts** — Press Enter to send, Shift+Enter for new line
- 🎯 **API Keys** — Generate and manage API keys for programmatic access
- 💼 **Workspace** — Team management with roles and invitations
- 💳 **Billing** — Subscription plans and billing history
- 🌙 **Dark Mode** — Beautiful dark theme by default
- 📱 **Responsive** — Works on mobile, tablet, and desktop

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion**
- **Lucide React**
- **Zustand** (state management)
- **Supabase** (auth + database)
- **React Markdown** + **Syntax Highlighter**

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your API keys
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Architecture

```
hemix-ai/
├── app/
│   ├── api/chat/        # Streaming chat API route (edge runtime)
│   ├── auth/            # Login, signup, forgot password
│   ├── dashboard/       # Chat, settings, billing, API keys, models, workspace
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Landing page
├── components/
│   ├── ui/              # Reusable UI components (Button, Input, Modal, etc.)
│   ├── landing/         # Landing page sections
│   └── dashboard/       # Dashboard components (Sidebar, ModelSelector)
├── hooks/               # Custom React hooks
├── lib/                 # Utilities, store, models, constants, auth context
├── services/            # AI service layer, auth service, Supabase clients
├── styles/              # Global CSS
└── types/               # TypeScript type definitions
```

## Supported Models

| Model | Provider | Context |
|-------|----------|---------|
| **GPT-5.0** | AgentRouter | 256K |
| **Claude 5 Sonnet** | AgentRouter | 200K |
| **Claude 4.8** | AgentRouter | 200K |
| AgentRouter Auto | AgentRouter | 256K |
| GPT-4o | OpenAI | 128K |
| GPT-4o Mini | OpenAI | 128K |
| Claude 3.5 Sonnet | Anthropic | 200K |
| Claude 3 Opus | Anthropic | 200K |
| Gemini 1.5 Pro | Google | 2M |
| Gemini 1.5 Flash | Google | 1M |
| DeepSeek V3 | DeepSeek | 64K |
| Qwen Max | Alibaba | 32K |
| Llama 3.1 70B | Meta | 128K |
| Mistral Large | Mistral | 32K |
| OpenRouter Auto | OpenRouter | 128K |

## Deployment

Deployed on **Vercel** — [hemix-ai.vercel.app](https://hemix-ai.vercel.app)

Backend powered by **Supabase** for authentication, chat history, and user data. See `lib/supabase-schema.sql` for the full database schema.

## License

MIT

---

<div align="center">
  <sub>Built by <a href="https://github.com/hamas3492">Hamas Ahmed</a></sub>
</div>
