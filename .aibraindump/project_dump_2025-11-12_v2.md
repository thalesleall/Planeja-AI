Project dump (update) generated: 2025-11-12T00:30:00Z

Summary of delta since previous dump
-----------------------------------
- Removed duplicate `cookie-parser` mount in `backend/server.ts` to avoid double registration.
- Centralized cookie configuration (env-driven) and wired it into `authController` for reading/setting/clearing the refresh cookie.
- Tidied server startup to start the in-process refresh-token cleanup job and left a note where cookieParser is mounted.

Files changed in this update
---------------------------
- backend/server.ts
  - Removed duplicate `app.use(cookieParser())` call (previously mounted twice). Added a comment explaining that cookie parser is mounted earlier.

- backend/src/config/index.ts
  - (previous change) Added `cookie` config block to centralize cookie settings (name, secure, sameSite, domain, maxAgeDays).

- backend/src/controllers/authController.ts
  - (previous change) `createAndSetRefreshToken`, `refresh` and `logout` now use configuration values for cookie name and attributes when setting, reading, and clearing the refresh cookie.

Why this change
---------------
Duplicate mounting of `cookie-parser` can lead to odd behavior or double parsing; removing the second mount reduces noise and prevents potential middleware ordering confusion. Centralizing cookie configuration ensures dev vs prod behavior is explicit and easier to manage via env vars.

How to test these changes locally
--------------------------------
1) Ensure dependencies are installed in backend:

```bash
cd backend
npm install
```

2) Start the backend (after applying DB migrations):

```bash
export DATABASE_URL="postgres://user:pass@localhost:5432/planeja"
export NODE_ENV=development
# optional env overrides
export COOKIE_SECURE=false
export COOKIE_SAMESITE=lax
node dist/server.js # or npm run start:dev if using ts-node/nodemon
```

3) Confirm cookie parsing works and cookies set by auth endpoints are present using a browser or curl with cookie support. Example (login -> inspect cookie):

```bash
curl -i -X POST http://localhost:3001/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"test@example.com","password":"Password123!"}' -c /tmp/cookies.txt
cat /tmp/cookies.txt
```

4) Ensure logout clears the cookie and removes DB row for token.

Notes for the incoming engineer
--------------------------------
- Cookie config is in `backend/src/config/index.ts` under `cookie`. Use env vars to control behavior:
  - REFRESH_TOKEN_COOKIE_NAME (default: refreshToken)
  - COOKIE_SECURE (true/false)
  - COOKIE_SAMESITE (none|lax|strict)
  - COOKIE_DOMAIN
  - REFRESH_TOKEN_EXPIRY_DAYS

- The server mounts `cookie-parser` once at the top of the middleware chain. The second mount was removed to avoid duplication.

- If you plan to serve frontend and backend on different domains in production, remember to set `COOKIE_SAMESITE=none` and `COOKIE_SECURE=true` and provide an appropriate `COOKIE_DOMAIN`.

Next suggested steps
--------------------
1) Add unit tests that assert the cookie attributes are set as expected by the `createAndSetRefreshToken` helper.
2) Add a small dev README snippet describing cookie env vars and typical local dev settings.
3) Consider moving the refresh-token cleanup job into a worker or scheduled DB job if you plan to scale horizontally.
