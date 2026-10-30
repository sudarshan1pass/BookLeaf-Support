# BookLeaf Support Platform

Monorepo with a React/Vite/Tailwind client and an Express API using PostgreSQL, Prisma, JWT/bcrypt authentication, and Socket.IO.

## Requirements

- Node.js 24.11 or newer
- npm 10 or newer
- Docker Desktop, or a PostgreSQL 15+ database

## Local setup (PowerShell)

From the repository root:

    if (-not (Test-Path server/.env)) { Copy-Item server/.env.example server/.env }
    npm install
    docker compose up -d db
    npm run db:migrate --workspace=@bookleaf/server -- --name init
    npm run db:seed --workspace=@bookleaf/server
    npm run dev

The author portal runs at http://localhost:5173. The API and authenticated Socket.IO server run at http://localhost:3000. Visit /signup to create an author account or /admin/login to sign in as an administrator.

The client reads its backend URL from `VITE_API_URL`. Local development can use `client/.env` to point to the live Render API or leave it unset to use the Vite proxy at `http://localhost:3000`. Production builds use the public backend URL in `client/.env.production`; a Vercel `VITE_API_URL` environment variable can override it. The backend allows the origin configured by `CLIENT_ORIGIN` plus the comma-separated origins in `CLIENT_ORIGINS`; the example includes both BookLeaf Vercel frontends and the local Vite origin.

The example environment file contains development-only database and seed credentials. Replace them for any shared or deployed environment. Set DATABASE_URL before running migrations when using an existing PostgreSQL instance.

## Useful commands

    npm run db:migrate --workspace=@bookleaf/server -- --name describe_change
    npm run db:generate --workspace=@bookleaf/server
    npm run db:seed --workspace=@bookleaf/server
    npm run db:studio --workspace=@bookleaf/server
    npm run check
    npm run build
    npm test --workspace=@bookleaf/server

The seed account uses SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, and SEED_ADMIN_NAME. Seeding creates or updates that admin account and idempotently loads the supplied sample dataset of 10 authors and 18 books. It preserves the source author/book IDs and publishing statuses. New sample author accounts receive unique random passwords that are never printed or stored in plaintext. For local demos only, set `SEED_SAMPLE_AUTHOR_PASSWORD` in `server/.env` to give newly created sample accounts a shared password; the seed rejects this setting unless `NODE_ENV=development`. Existing accounts keep their current passwords on later seed runs. Public registration cannot create an administrator.

## Environment and AI

Set the real `OPENAI_API_KEY` only in `server/.env`; never place it in `client/.env`, a `VITE_*` variable, or frontend code. `.gitignore` excludes `.env` files, and `server/.env.example` contains an empty key placeholder. `OPENAI_MODEL` defaults to `gpt-4o-mini`; `OPENAI_TIMEOUT_MS` defaults to 8000. Classification and priority use separate structured JSON requests with bounded inputs and outputs, no automatic retries, and `store: false`. Ticket creation falls back to `GENERAL_INQUIRY` and `MEDIUM` if either request fails.

Set `BOOKLEAF_KNOWLEDGE_BASE_PATH` to a UTF-8 text or Markdown copy of the BookLeaf Knowledge Base. The default example path is `knowledge/bookleaf.md`, relative to the server working directory. The assignment PDF and its Knowledge Base are not present in this workspace, so no company timelines or policies are packaged here. Without the file, the response prompt requires a neutral acknowledgement and a request for relevant details; it must not invent a timeline. Admins can still write and send replies manually.

AI verification:

- Run the mocked service/fallback checks with `npm test --workspace=@bookleaf/server`; these tests do not call OpenAI or need a key.
- For a live classification/priority check, put the key in `server/.env`, restart the server, log in as an author, and submit a support ticket. The admin queue shows the resulting category and priority; provider failure leaves the ticket created with safe defaults.
- For a live response-draft check, configure the Knowledge Base file, restart the server, log in as an admin, open a ticket, and use **AI draft**. Review and edit the draft before sending it.

## API

All authenticated API requests use Authorization: Bearer <token>. Author data queries scope books, tickets, messages, and attachments to the account ID from the verified token. Admin routes require an ADMIN token.

Authentication:

- POST /api/auth/register — create a USER or AUTHOR account
- POST /api/auth/login — login for either registered role
- POST /api/auth/author/login — author login
- POST /api/auth/admin/login — admin login
- GET /api/auth/me — current account

Author:

- GET /api/author/dashboard, /profile, /books, /books/:bookId
- GET /api/author/tickets, /tickets/:ticketId
- POST /api/author/tickets — submit query; optional multipart attachment accepts PDF, PNG, JPG, or TXT up to 5 MB
- POST /api/author/tickets/:ticketId/messages — reply
- GET /api/author/tickets/:ticketId/attachments/:attachmentId

Admin:

- GET /api/admin/authors, /authors/:authorId, /books, /books/:bookId
- GET /api/admin/tickets — paginated ticket queue; optional filters status, category, priority, from, to, page, and pageSize
- GET /api/admin/tickets/:ticketId — ticket conversation and admin-only internal notes
- POST /api/admin/tickets/:ticketId/assign — assign to the signed-in admin
- PATCH /api/admin/tickets/:ticketId — update status, category, and/or priority
- POST /api/admin/tickets/:ticketId/notes — add a private note
- POST /api/admin/tickets/:ticketId/messages — send a public response
- POST /api/admin/tickets/:ticketId/ai-draft — generate a draft for admin review
- GET /api/admin/tickets/:ticketId/attachments/:attachmentId

Ticket statuses are OPEN, IN_PROGRESS, WAITING_ON_AUTHOR, RESOLVED, and CLOSED. The queue sorts by priority and ticket age. Admin filters are validated and page size is capped at 100.

## Security and deployment notes

JWTs are short-lived and currently stored in browser sessionStorage. Attachments are stored on the server's local disk under server/uploads/. The Socket.IO handshake authenticates the JWT, but ticket rooms, event publishing, and client-side realtime refresh are not implemented yet; ticket updates currently use HTTP requests and reloads.

Docker Compose provides PostgreSQL for local development only. Vercel is configured to build the static client; the Express API runs on a separate production host. The server's `prestart` script runs `prisma migrate deploy` before `npm start`; the server entrypoint also applies pending migrations when launched directly, such as with `node dist/src/server.js`. Review upload storage, TLS, secret management, database backups, and monitoring before production deployment.

## Vercel frontend deployment

Connect the Git repository to Vercel and preferably set **Root Directory** to the repository root. The root `vercel.json` installs the npm workspaces, builds only the React client, and serves `client/dist`; the root `package.json` pins the build runtime to Node 24.x. A separate `client/vercel.json` also supports projects whose Root Directory is set to `client`, using that folder's package manifest directly without a parent-directory install command. The Express API must be hosted separately and routed/configured for the deployed client before authenticated portal features will work.

Tests use mocked Prisma calls and do not require a database connection. They cover authentication, ownership boundaries, admin access, input validation, manual overrides, and isolated AI fallback behavior.
# BookLeaf-Support
