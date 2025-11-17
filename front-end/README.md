# Team Tasks Front-end

React + TypeScript client for the collaborative task platform. It targets the NestJS backend in `../back-end`, provides JWT auth, team and todo management, Socket.IO powered realtime updates, and an AI assistant that suggests task descriptions/status defaults.

## Tech stack

- React 19 + Vite
- Redux Toolkit for state and async orchestration
- Material UI for UI components and layout
- Axios for REST calls, Socket.IO client for realtime streaming
- Node v22.14.0 via `nvm use 22.14.0`

## Getting started

```bash
cd front-end
nvm use 22.14.0
npm install --cache ../.npm-cache
cp .env.example .env    # provide API + socket URLs if different
npm run dev
```

By default the UI expects the backend at `http://localhost:3000/api` and sockets at `http://localhost:3000`. Configure `VITE_API_URL` / `VITE_WS_URL` to point elsewhere.

## Feature overview

- **Auth & Teams**: JWT login/register, list/create teams, invite users (owner permission enforced by backend)
- **Todo management**: CRUD with title, description, due date, status, assignee; assignments limited to current team members
- **Realtime collaboration**: Socket.IO client auto-joins the selected team room to push `todo.created/updated/deleted` events instantly
- **AI assistant**: `AiAssistant` component calls `/ai/suggestions`, surfaces recommendation + reasoning, and can seed the task form

See `src/pages/DashboardPage.tsx` for the main workflow and `src/components` for modular UI pieces.

## AI feature rationale

The AI integration intentionally hits the backend `/ai/suggestions` endpoint so the experience works whether the service proxies to a real LLM or the provided rule-based mock. The UI focuses on:

1. Encouraging context-rich prompts so the backend can improve suggestions.
2. Showing confidence + reasoning so teammates can trust (or override) the output.
3. Providing fast copy/paste into the todo dialog for rapid planning.

Swapping in a hosted LLM only requires changing the backend service; no frontend changes are necessary.


docker compose run --rm back-end npm run seed