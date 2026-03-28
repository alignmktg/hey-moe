# Hey Moe

AI-native task management PWA. Local-first (Dexie/IndexedDB), AI-powered (Anthropic via Vercel AI SDK).

## Stack

- **Frontend**: React 19 + TypeScript + Vite 8 + Tailwind CSS 4
- **State**: Zustand (UI only) + Dexie.js (source of truth, IndexedDB)
- **AI**: Vercel AI SDK v6 + @ai-sdk/anthropic + Claude Sonnet 4.6
- **API**: Vercel Edge Function (`api/chat.ts`)
- **Hosting**: Vercel
- **PWA**: vite-plugin-pwa

## Architecture

- `src/db/dexieDB.ts` — Dexie schema + seed data. Components read via `useLiveQuery`.
- `src/store/useStore.ts` — Zustand. Ephemeral UI state ONLY. Never duplicate DB data here.
- `src/agents/moeService.ts` — Client-side tool execution against Dexie.
- `api/chat.ts` — Vercel Edge proxy to Anthropic. Tools defined here, executed server-side, results trigger client-side DB writes.

## Conventions

- Mobile-first. Light theme only.
- "Linear-light" design: bg-white, text-gray-900, accent indigo-600.
- Framer Motion for all animations (duration 0.2, ease "easeOut"; swipe uses spring physics).
- Touch targets: 44px minimum.
- `cn()` utility at `src/lib/cn.ts` for className merging.

## Environment

- `ANTHROPIC_API_KEY` — Set on Vercel, never in .env files committed to repo.

## Scripts

- `npm run dev` — Local dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build
