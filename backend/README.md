# Backend - Loan Eligibility Engine

Serverless AWS stack + n8n workflows for ingesting user CSVs, scraping loan products, matching, and notifying users.

## Components
- **Lambda `createUploadUrl`**: HTTP POST `/upload-url`, returns S3 presigned POST for CSV.
- **Lambda `ingestCsv`**: S3 trigger on `.csv` uploads, parses CSV, upserts `users`, then calls `N8N_WEBHOOK_URL` to launch matching (Workflow B).
- **n8n**: three workflows in `n8n/workflows` (A discovery cron, B matching webhook, C notification webhook).
- **Postgres**: schema in `db/schema.sql` (users, loan_products, matches, workflow_events).

## Setup
1. Copy `.env.example` → `.env` and fill AWS, Postgres, webhook values.
2. Create S3 bucket named in `UPLOAD_BUCKET` and RDS Postgres; run `db/schema.sql`.
3. Vendor Python deps for Lambda:
   ```bash
   cd backend
   python -m pip install -r requirements.txt -t .python_packages/lib/site-packages
   ```
4. Deploy: `serverless deploy` (AWS credentials + Serverless installed).

## n8n
- Start locally: `docker compose up -d` (port 5678, basic auth admin/admin).
- Import JSON workflows from `n8n/workflows`.
- Configure credentials: Postgres (points to RDS), SMTP/SES credential for notifications, optional OpenAI/Gemini for deeper scoring nodes.

## CSV Format
`user_id,email,monthly_income,credit_score,employment_status,age`

## Flow
1. UI requests `/upload-url`, uploads CSV directly to S3.
2. `ingestCsv` parses and writes users.
3. Webhook to n8n triggers Workflow B → prefilter income/credit → optional AI rerank → write `matches`.
4. Workflow C emails users via SES with recent matches.

## Optimization Idea
- Stage 1: SQL-style prefilter (income/credit gates).
- Stage 2: heuristic score (interest rate, tenure if available).
- Stage 3 (optional): LLM node only on top-K pairs to validate qualitative factors (docs level, speed).
