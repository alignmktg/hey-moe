# Hey Moe

AI-native task management PWA. Talk to Moe to manage tasks, or use the swipe/kanban/list views directly.

## Views

- **List** — Classic task list with inline add
- **Kanban** — Drag-and-drop columns (Active / Done / Dropped)
- **Swipe** — Tinder-style triage cards (right = done, left = defer)
- **Moe** — Chat with AI assistant to create tasks, spawn sub-agents

## Setup

```bash
npm install
npm run dev
```

Set `ANTHROPIC_API_KEY` as environment variable for AI features.

## Deploy

Hosted on Vercel. Push to `main` triggers deploy.
