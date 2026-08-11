# cfo.ai

A small business finance assistant built on FastAPI: transaction tracking, inventory tracking, and an AI chat assistant (Gemini), backed by Supabase (Postgres + Auth).

## Tech stack

| Layer         | Choice                                    |
|---------------|--------------------------------------------|
| API framework | FastAPI + Uvicorn                          |
| Templating    | Jinja2 (server-rendered HTML pages)        |
| Database      | Supabase (Postgres) via `supabase-py`      |
| Auth          | Supabase Auth, JWTs verified with `PyJWT`  |
| AI            | Google Gemini via `google-genai`           |

## Project structure

This app is **one FastAPI app split into feature routers**, each in its own file, all wired together in `main.py`.

```
main.py       # creates the FastAPI app, mounts static files, includes every router,
              # and serves the HTML pages (dashboard, transactions, inventory, chat, reports, auth)
auth.py       # get_current_user() — verifies a Supabase JWT from the Authorization header
db.py         # APIRouter for /transactions (create/read/update/delete)
inventory.py  # APIRouter for /inventory (create/read/update/delete)
ai.py         # APIRouter for /chat (POST) — sends user notes to Gemini using prompt.txt as the system prompt
prompt.txt    # system instruction fed to Gemini in ai.py
static/       # JS served at /static (auth.js handles Supabase login/signup client-side)
templates/    # Jinja2 HTML templates rendered by main.py
```

### The pattern for adding a new feature

1. Create a new file, e.g. `reports_api.py`.
2. Build an `APIRouter()` inside it with your routes.
3. In `main.py`, import the router and add:
   ```python
   from reports_api import router as reports_router
   app.include_router(reports_router)
   ```

`main.py` itself only owns the page routes (the ones returning `TemplateResponse`) — it doesn't hold business logic. Each router owns one resource.

## Setup

```bash
git clone <this repo>
cd cfo.ai

python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in real values:

```bash
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
```

| Variable              | Used in                | Purpose                                                        |
|-----------------------|-------------------------|------------------------------------------------------------------|
| `SUPABASE_URL`         | `db.py`, `inventory.py` | Supabase project REST URL                                       |
| `SUPABASE_KEY`         | `db.py`, `inventory.py` | Supabase API key used by the `supabase-py` client                |
| `SUPABASE_JWT_SECRET`  | `auth.py`               | Secret used to verify (HS256) the JWT Supabase issues on login   |
| `GEMINI_API_KEY`       | `ai.py`                 | Google Gemini API key for the `/chat` endpoint                   |

`.env` is git-ignored — never commit it. `.env.example` is the tracked template that documents which variables are needed, without real values.

## Running the app

```bash
uvicorn main:app --reload
```

Then visit `http://127.0.0.1:8000/` — that's the auth (login/signup) page. Supabase Auth runs client-side (see `static/auth.js`); after logging in you're redirected to `/dashboard`.

## Routes

**Pages** (`main.py`, server-rendered HTML):

| Method | Path            | Renders             |
|--------|-----------------|----------------------|
| GET    | `/`             | `Auth.html`          |
| GET    | `/dashboard`    | `Dashboard.html`     |
| GET    | `/transactions` | `Transactions.html`  |
| GET    | `/inventory`    | `Inventory.html`     |
| GET    | `/chat`         | `AI.html`            |
| GET    | `/reports`      | `Reports.html`       |

**JSON API**:

| Method | Path                                        | Router        | Notes                              |
|--------|----------------------------------------------|----------------|--------------------------------------|
| POST   | `/chat`                                      | `ai.py`        | body: `{ "notes": "..." }`          |
| POST   | `/transactions`                              | `db.py`        | body: `TransactionCreate`           |
| GET    | `/transactions/{business_id}`                | `db.py`        |                                       |
| PATCH  | `/transactions/{business_id}/{transaction_id}` | `db.py`      | body: `TransactionUpdate`           |
| DELETE | `/transactions/{business_id}/{transaction_id}` | `db.py`      |                                       |
| POST   | `/inventory`                                 | `inventory.py` | body: `InventoryCreate`             |
| GET    | `/inventory/{business_id}`                   | `inventory.py` |                                       |
| PATCH  | `/inventory/{business_id}/{inventory_id}`    | `inventory.py` | body: `InventoryUpdate`             |
| DELETE | `/inventory/{business_id}/{inventory_id}`    | `inventory.py` |                                       |

## Auth

`auth.py` exposes `get_current_user`, a FastAPI dependency that:

1. Reads the `Authorization: Bearer <token>` header.
2. Verifies the JWT against `SUPABASE_JWT_SECRET` (HS256, audience `authenticated`) — the same token Supabase Auth issues on the client after login/signup (see `static/auth.js`).
3. Returns the `sub` claim (the Supabase user id) on success, or raises `401` on a missing/invalid/expired token.

To protect a route, add it as a dependency:

```python
from fastapi import Depends
from auth import get_current_user

@router.get("/something")
async def something(user_id: str = Depends(get_current_user)):
    ...
```

> **Status:** `get_current_user` exists but isn't yet applied to the `/transactions` or `/inventory` routes in `db.py` / `inventory.py` — those are currently open. Wire it in (and scope queries to the caller's own data) before treating those endpoints as production-ready.

## Known gaps

- `/transactions` and `/inventory` endpoints aren't auth-protected yet (see above).
- No automated tests yet.
- `main.py` references `templates/Auth.html` (capital A) while the file on disk is `templates/auth.html` — works on case-insensitive filesystems (Windows/macOS default) but will 500 on a case-sensitive one (most Linux servers/containers). Rename one to match before deploying to Linux.
