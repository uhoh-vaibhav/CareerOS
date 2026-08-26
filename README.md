# CareerOS

An AI-Powered Career Intelligence Platform — MCA capstone project, Christ University.

This repo is a monorepo with three services, matching the architecture in the
Design Document:

```
careeros/
├── backend/       Node.js / Express / TypeScript API (Prisma + PostgreSQL)
├── frontend/      Next.js / React / TypeScript / Tailwind
├── ai-service/    Python / FastAPI — resume parsing, skill-gap, AI Mentor (RAG)
└── docker-compose.yml
```

## Quick start (Docker)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000 (health check at `/health`)
- AI service: http://localhost:8000 (interactive docs at `/docs`)
- PostgreSQL: localhost:5432 (user/pass/db: `careeros`)

## Running services individually (local dev)

### Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init   # creates the schema in your local Postgres
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### AI service

```bash
cd ai-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

The AI service runs with **zero configuration** by default — `LLM_PROVIDER=mock`
and `VECTOR_STORE=mock` in `.env.example` use in-memory stand-ins so the whole
stack is runnable without any API keys. See "Swapping the LLM provider /
vector store" below for wiring in the real thing.

## What's implemented vs. scaffolded

This is a working skeleton, not the finished MVP. Implemented end-to-end:

- **Auth**: register / login / me, JWT + bcrypt, RBAC middleware (`AUTH-01/02/03`)
- **Database schema**: full Prisma schema matching the ER diagram in the Design Document
- **AI service**: resume parsing, skill-gap analysis, and the AI Mentor RAG
  loop (`STU-03/04`, `SKL-01/02/03`, `MEN-01/02/03`) — all runnable against
  the mock adapters right now
- **Frontend**: landing page, login/register (wired to the real backend),
  Student Dashboard shell matching the wireframe

Not yet built (see the SRS for the full requirement list): the remaining
Student sub-modules (mock interview UI, portfolio, certificates), Recruiter /
Placement Officer / Faculty / Admin dashboards, GitHub portfolio analysis,
and the Readiness Score aggregator service.

## Swapping the LLM provider / vector store

Both are behind an adapter interface + factory, selected by one env var —
no other code changes needed:

| Component | Env var | Options |
|---|---|---|
| LLM | `LLM_PROVIDER` (ai-service/.env) | `mock` (default), `openai`, `gemini` |
| Vector store | `VECTOR_STORE` (ai-service/.env) | `mock` (default), `chroma`, `pinecone` |

To use OpenAI: set `LLM_PROVIDER=openai` and `OPENAI_API_KEY=...`.
To use Chroma: set `VECTOR_STORE=chroma`, then `pip install chromadb` (not in
`requirements.txt` by default to keep the base install light).
To use Pinecone: set `VECTOR_STORE=pinecone`, `PINECONE_API_KEY=...`, then
`pip install pinecone-client` and wire an embedding call into
`PineconeVectorStore._embed` (see the TODO in that file).

## Known limitation in this scaffold

`npx prisma generate` requires downloading Prisma's engine binaries from
`binaries.prisma.sh`. If you're running this in a network-restricted
environment, that step may fail — it works normally on a regular machine
with internet access.

## Documentation

The Synopsis, SRS, Design Document, and Presentation for this project are
maintained separately from this repo as the academic deliverables for
submission C1.
