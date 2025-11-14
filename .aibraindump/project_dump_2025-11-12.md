Project dump generated: 2025-11-12T00:00:00Z

Purpose
-------
This file is a literal project dump intended for another Senior Software Engineer to pick up context quickly.
It contains: repository structure snapshot, a high-level narrative of recent work performed by the automated agent, a change log of key files added/modified, run & verification steps, outstanding work and priorities, and a short troubleshooting / diagnostic checklist.

Do not store secrets here. This is documentation only.

Repository snapshot (high-level)
--------------------------------
Top-level items (as present in workspace snapshot):

- docker-compose.yml
- README.md
- #ADRs/ (architecture decision records)
- #PDRs/ (product design records)
- backend/
  - Dockerfile
  - nodemon.json
  - package.json
  - README.md
  - server.ts
  - tsconfig.json
  - database/
    - schema.sql
    - migrations/
      - 2025-10-30_mvp_chat.sql
      - 2025-11-12_add_refresh_tokens_metadata.sql
      - 2025-11-12_add_refresh_tokens.sql
  - src/
    - config/
      - index.ts
      - supabase.ts
    - controllers/
      - authController.ts
      - chatController.ts
      - listController.ts
      - taskController.ts
    - lib/
      - langchainAdapter.ts
      - realtime.ts
    - middleware/
      - auth.ts
      - index.ts
      - validation.ts
    - routes/
      - api.ts
      - auth.ts
      - chats.ts
      - index.ts
      - lists.ts
      - supabase.ts
      - tasks.ts
    - services/
      - chatService.ts
    - types/
      - index.ts
- database/
  - README.md
  - script.sql
- frontend/
  - planeja-ai/
    - components.json
    - Dockerfile
    - eslint.config.mjs
    - next-env.d.ts
    - next.config.ts
    - nginx.conf
    - package.json
    - postcss.config.mjs
    - README.md
    - tsconfig.json
    - @types/
      - task.d.ts
    - app/
      - globals.css
      - layout.tsx
      - page.tsx
      - auth/page.tsx
      - chat/page.tsx
    - components/
      - add-task-form.tsx
      - analytics-cards.tsx
      - task-list.tsx
      - chat/
        - chat-window.tsx
        - sidebar.tsx
      - ui/
        - badge.tsx
        - button.tsx
        - calendar.tsx
        - card.tsx
        - checkbox.tsx
        - header.tsx
        - input.tsx
        - ...
    - lib/
      - auth.ts
      - socket.ts
      - supabase.ts
      - utils.ts
    - public/
    - readme/
      - GABRIEL_STORTI.md
      - LUIS_CHIQUETO.md
- infra/
  - README.md
  - certificates/
    - fullchain.pem
    - generate-certs.sh
    - privkey.pem
    - rootCA.key
    - rootCA.pem
  - nginx/
    - default.conf
- PRDs/

Note: The working snapshot above is derived from the workspace listing provided by the environment. For exact, up-to-date file contents, inspect files directly.

Summary of recent work (what I implemented)
-------------------------------------------
This section provides a concise narrative of the recent engineering work performed across backend and frontend to support an LLM-driven chat with streaming tokens via Socket.IO and a hardened refresh-token lifecycle.

High-level goals implemented
- Add LLM-driven chat with streaming tokens to clients (Socket.IO streaming of tokens during LLM generation).
- Scaffold Chat UI in frontend (desktop sidebar + responsive chat page on mobile).
- Implement robust refresh-token lifecycle: server stores rotating refresh tokens in DB, sets HttpOnly cookie, provides refresh endpoint, logout, list & revoke endpoints.
- Implement client-side socket singleton with dynamic auth callback and reconnect-on-refresh behavior.

Backend: main changes
- Auth refresh token persistence
  - New migrations added:
    - backend/database/migrations/2025-11-12_add_refresh_tokens.sql (creates table auth_refresh_tokens)
    - backend/database/migrations/2025-11-12_add_refresh_tokens_metadata.sql (adds ip_address and user_agent columns)
  - `backend/src/controllers/authController.ts` updated/extended with:
    - createAndSetRefreshToken(userId, res, ip?, userAgent?) helper: creates DB row for refresh token + sets HttpOnly cookie.
    - `refresh` endpoint: reads refresh token cookie, validates DB row, rotates token, returns new access token, sets new cookie.
    - `logout` endpoint: deletes/invalidates refresh token and clears cookie.
    - `listTokens` & `revokeToken` endpoints: admin / user-facing token list and revocation.

- Cookie parsing
  - `cookie-parser` is mounted in `backend/server.ts` to read HttpOnly cookies from requests.

- Realtime / LangChain
  - LangChain streaming adapter exists server-side (backend/src/lib/langchainAdapter.ts) and the server emits tokens to clients via Socket.IO rooms/events.
  - `backend/src/lib/realtime.ts` manages the Socket.IO server integration.

Frontend: main changes
- Socket helper
  - `frontend/planeja-ai/lib/socket.ts`: a client singleton that accepts a dynamic auth callback (to supply the latest access token at handshake time), sets reconnection config, and listens for `connect_error`. On `connect_error` due to auth, it calls a refresh helper (via `window.getNewToken()` / auth lib) and retries connect.

- Auth helper
  - `frontend/planeja-ai/lib/auth.ts`: provides `getToken`, `setToken`, and `refreshToken()` (POST /api/v1/auth/refresh with credentials included). It writes tokens to localStorage and exposes a global helper on `window` to be used by the socket helper.

- UI components
  - `frontend/planeja-ai/components/chat/sidebar.tsx` - desktop chat list UI.
  - `frontend/planeja-ai/components/chat/chat-window.tsx` - chat UI that fetches messages and listens to socket events `chat:stream:token` and `chat:stream:done` to render streaming assistant output.
  - `frontend/planeja-ai/app/chat/page.tsx` - Chat route that initializes socket when token available.
  - `frontend/planeja-ai/components/ui/header.tsx` - global header that initializes socket on layout load and shows connection status badge.
  - `frontend/planeja-ai/app/layout.tsx` updated to include the `Header` so socket initialization is global.

Miscellaneous
- Added `socket.io-client` dependency in frontend package.json (developer must run npm install).
- Added `backend/scripts/refresh_flow_test.mjs` — a small integration smoke script to exercise register -> login -> refresh -> logout flows against a running backend. Path: `backend/scripts/refresh_flow_test.mjs`.

APIs / Endpoints added or modified
--------------------------------
Auth endpoints (pattern: /api/v1/auth/*)
- POST /api/v1/auth/register  — creates user, returns access token, sets refresh cookie
- POST /api/v1/auth/login     — returns access token, sets refresh cookie
- POST /api/v1/auth/refresh   — POST with credentials (cookie included). Validates, rotates refresh token, returns new access token and sets new cookie.
- POST /api/v1/auth/logout    — invalidates refresh token and clears cookie.
- GET /api/v1/auth/refresh-tokens — lists user's active refresh tokens (device metadata) — requires auth.
- DELETE /api/v1/auth/refresh-tokens/:id — revoke a specific refresh token row.

Chat endpoints (existing earlier and used in UI)
- GET /api/v1/chats           — list chats (for sidebar)
- GET /api/v1/chats/:id/messages — list messages for a chat
- POST /api/v1/chats/messages — send a message (initiates LLM generation and token streaming)

Socket events (server → client)
- chat:stream:token — A streaming token emitted as the LLM generates response.
- chat:stream:done  — Emitted when generation completes.

Files of particular interest (changes / new)
-------------------------------------------
- backend/src/controllers/authController.ts (modified): refresh, rotation, logout, listTokens, revokeToken, cookie set helper.
- backend/server.ts (modified): added cookie-parser mount.
- backend/database/migrations/2025-11-12_add_refresh_tokens.sql (new)
- backend/database/migrations/2025-11-12_add_refresh_tokens_metadata.sql (new)
- backend/scripts/refresh_flow_test.mjs (new): smoke test script for auth flow.
- frontend/planeja-ai/lib/socket.ts (new/modified): socket singleton + auth callback + connect_error logic.
- frontend/planeja-ai/lib/auth.ts (new/modified): get/set token, refreshToken() hitting server refresh endpoint.
- frontend/planeja-ai/components/ui/header.tsx (new/modified): global header and socket init.
- frontend/planeja-ai/components/chat/chat-window.tsx (new): listens to socket stream events to render tokens.

How to run locally (developer checklist)
----------------------------------------
Prerequisites: Node 18+, npm, psql (for applying migrations / connecting to Postgres), a running Postgres (or Supabase) instance. The backend expects a DATABASE_URL environment variable (or other config depending on project config files). Confirm values in `backend/src/config`.

1) Apply DB migrations

Make sure the DB is reachable and DATABASE_URL is exported in your shell. Example:

```bash
export DATABASE_URL="postgres://user:pass@localhost:5432/planeja"
psql $DATABASE_URL -f backend/database/migrations/2025-11-12_add_refresh_tokens.sql
psql $DATABASE_URL -f backend/database/migrations/2025-11-12_add_refresh_tokens_metadata.sql
```

If you use a migration tool (knex, flyway, etc.), prefer using it instead of raw psql; these files are SQL and can be applied with any Postgres client.

2) Install dependencies

Backend:

```bash
cd backend
npm install
# then start (example dev command)
npm run start:dev
```

Frontend:

```bash
cd frontend/planeja-ai
npm install
npm run dev
```

3) Verify flows manually

- Register (POST /api/v1/auth/register) — should return an access token and set HttpOnly cookie `refresh_token`.
- Login (POST /api/v1/auth/login) — returns access token and sets cookie.
- Visit the app. The header initializes socket and uses the stored access token. Socket should connect and show connected status.
- Trigger an expired token scenario by expiring the access token (shorter TTL) or simulate by removing local access token; when socket fails `connect_error` due to auth, it will call POST /api/v1/auth/refresh (credentials: include) to rotate the refresh token and obtain a new access token. The client will reconnect with the new token.

4) Run the integration smoke script (optional)

Node must be >= 18 to use global fetch. Example:

```bash
# ensure backend is running and DB migrations applied
cd backend
node --experimental-fetch scripts/refresh_flow_test.mjs
```

This script will attempt: register -> login -> access /me -> refresh -> logout. It's a smoke test; it expects the server to set and return cookies correctly.

Known issues and caveats
-----------------------
- Migrations must be applied before the refresh endpoint will work. If you hit errors like "relation auth_refresh_tokens does not exist", that indicates migrations weren't applied.
- TypeScript/editor diagnostics will appear in the workspace until `npm install` has been run in both `backend` and `frontend/planeja-ai` to fetch newly-added packages and types (e.g., cookie-parser, socket.io-client types).
- Some flows assume the server sets the refresh token cookie scoped to the same origin; running the frontend & backend on different ports/hosts might require proper cookie attributes (SameSite, secure, domain). Adjust cookie settings in `authController` accordingly for local dev vs production.

Security notes
--------------
- Refresh tokens are persisted server-side (rotating tokens) and an HttpOnly cookie is used to hold the token on the client. This reduces exposure to XSS. The server rotates refresh tokens on use and records metadata (ip_address, user_agent) for audit and revocation.
- Ensure HTTPS in production and set cookie secure flags. Consider rotating token TTLs, device/session naming, and compromise detection (unusual IPs or geolocations).

Change log (concise)
--------------------
- 2025-11-12: Added refresh token migrations and metadata migration files.
- 2025-11-12: Implemented refresh rotation endpoints in `authController` and mounted `cookie-parser` in server.
- 2025-11-12: Added front-end socket singleton and auth refresh helper; wired Header to initialize socket globally.
- 2025-11-12: Added integration smoke script `backend/scripts/refresh_flow_test.mjs`.

Outstanding work & recommended next steps
--------------------------------------
1) Apply migrations to the DB (high priority). Without this, `POST /auth/refresh` will fail.
2) Run `npm install` in backend and frontend to resolve TypeScript / missing module errors.
3) Run the smoke script and manual verification of socket reconnection + refresh.
4) Add minimal UI action to logout the current device (frontend) to call POST /api/v1/auth/logout and remove local access token.
5) Add unit/integration tests later if desired (these were intentionally removed by you).
6) Consider adding a small admin UI for viewing & revoking refresh tokens (optional but helpful for security ops).

Quick troubleshooting checklist (if things fail)
---------------------------------------------
- If refresh endpoint returns 500 or `relation "auth_refresh_tokens" does not exist` → run migrations.
- If cookies are not being sent to backend from frontend → check that the fetch/ajax calls include `credentials: 'include'` and that cookie settings (SameSite/Domain/Secure) allow sending between your dev hosts.
- If socket fails to connect with 401/Invalid token → ensure the token returned by refresh is stored and the socket's auth callback returns the latest token at handshake time.
- If TypeScript complains about missing modules → run `npm install` in the package directory which owns those imports.

Contact points (where in repo to look for behavior)
---------------------------------------------------
- To inspect refresh token behavior: `backend/src/controllers/authController.ts` and `backend/database/migrations/2025-11-12_add_refresh_tokens.sql`.
- To inspect socket connect / reconnection: `frontend/planeja-ai/lib/socket.ts` and `frontend/planeja-ai/lib/auth.ts`.
- To inspect LLM streaming & token emission: `backend/src/lib/langchainAdapter.ts` and `backend/src/lib/realtime.ts`.
- To inspect chat UI: `frontend/planeja-ai/components/chat/chat-window.tsx` and `frontend/planeja-ai/app/chat/page.tsx`.

Final notes
-----------
This dump is intended to be a durable, on-disk snapshot of the current engineering context. It emphasizes operational steps (migrations, installs) required to verify runtime behavior. If you want, I can also:

- produce a minimal README inside `backend/` and `frontend/planeja-ai/` with exact env variables and dev commands;
- apply the DB migrations programmatically (if you provide DB access or instructions for a local dev DB connection);
- add a small frontend logout button and wire it to the logout endpoint;
- create a CI job that runs the smoke script against a deployed dev backend.

If you want any of those, tell me which and I'll implement it next.
