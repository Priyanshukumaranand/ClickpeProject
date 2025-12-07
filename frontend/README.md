## Loan Picks Dashboard

Dashboard to surface top 5 personalized loan matches, browse all products with filters, and ask grounded AI questions on any loan. Built with Next.js App Router, TypeScript, Tailwind + shadcn/ui, Supabase, Zod, and OpenAI.

### Architecture

```
Browser (Dashboard, All Products, Chat Sheet)
			| fetch /api/products
			| POST /api/ai/ask
			v
Next.js App Router (Edge/Node)
	├─ Route: /api/products -> Zod-validated filters -> Supabase (read) -> badge logic -> JSON
	├─ Route: /api/ai/ask -> Zod body -> Supabase (product lookup) -> OpenAI (grounded prompt)
	└─ UI (server components) -> Client cards, filters, chat sheet
Supabase Postgres
	├─ products (seeded 10 rows)
	├─ users
	└─ ai_chat_messages
```

### Tech
- Next.js 16 (App Router) + React 19
- Tailwind CSS 3 + shadcn/ui primitives
- Zod for API validation
- Supabase JS client for hosted Postgres reads
- OpenAI chat completions for grounded answers

### Setup
1. Install deps: `npm install`
2. Copy envs: `cp .env.example .env.local` and fill:
	 - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
	 - `OPENAI_API_KEY` (or any OpenAI-compatible endpoint) and optional `OPENAI_MODEL`
3. Create Postgres (Supabase recommended) and run the schema + seed: `psql $SUPABASE_DB_URL -f supabase/seed.sql`
4. Run dev server: `npm run dev` -> http://localhost:3000

### Database
- Schema & seed: `supabase/seed.sql` (creates `products`, `users`, `ai_chat_messages`; seeds 10 products aligned with UI mock data)
- Products columns align with brief: `name, bank, type, rate_apr, min_income, min_credit_score, tenure_min_months, tenure_max_months, processing_fee_pct, prepayment_allowed, disbursal_speed, docs_level, summary, faq, terms`

### API Contracts (Zod-validated)
- `GET /api/products?bank&minApr&maxApr&minIncome&minCredit&limit`
	- Filters by bank (ilike), APR range, max income requirement, max credit score requirement, limit (<=50)
	- Returns enriched products with derived badges and match_score
- `POST /api/ai/ask`
	```json
	{
		"productId": "uuid",
		"message": "What is the minimum credit score?",
		"history": [{ "role": "user" | "assistant", "content": "..." }]
	}
	```
	- Looks up product in Supabase (falls back to mock seed if env missing)
	- Builds grounded prompt and queries OpenAI (model default: gpt-4o-mini)
	- Fallback safe answer when model key is absent or question is out-of-scope

### Badge Logic
Badges are derived per product (see `src/lib/badge.ts`):
- Low APR (<=11%)
- No Prepayment (prepayment_allowed)
- Fast Disbursal (fast/instant)
- Flexible Tenure (>=36 month spread)
- Low Docs (low/minimal)
- Salary Friendly (min_income <= 45k)
- Credit Score Friendly (min_credit_score <= 700)
- Limited-Time Offer (terms.limited_time_offer)

### AI Grounding Strategy
- Fetch product row (structured fields + FAQ + terms)
- System prompt includes serialized product JSON and an instruction to only answer from provided data; otherwise reply with a safe fallback
- Temperature 0.3, max 300 tokens, model configurable via env
- History is capped (max 10 turns) and sent with each request

### Deployment (Vercel)
1. Push to GitHub (private) and invite reviewers: harsh.srivastav@clickpe.ai, paras.upadhaya@clickpe.ai, punit.kumar@clickpe.ai, saurabh@clickpe.ai
2. In Vercel: Import repo → set env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `OPENAI_MODEL`) → deploy
3. Run `supabase/seed.sql` against the connected database (Supabase SQL editor or psql)

### Testing / QA
- `npm run lint` (Next + TypeScript rules)
- Manual: Dashboard loads top 5, All Products filters apply instantly, Chat sheet answers with product-grounded responses and graceful fallbacks

### Video (to record)
- 5–8 min walkthrough covering dashboard, filters, and chat interaction with citations/fallback behavior.
