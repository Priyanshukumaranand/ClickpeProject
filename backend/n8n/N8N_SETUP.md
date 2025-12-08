# n8n Workflow Setup Guide

## Overview
Three workflows automate the loan eligibility engine:
- **Workflow A**: Daily product discovery (scrapes bank sites, stores products)
- **Workflow B**: User-triggered matching (reads users + products from DB, computes eligibility, stores matches)
- **Workflow C**: Notification (sends emails to users with matched products)

## Prerequisites
- n8n instance running (self-hosted or cloud)
- Postgres RDS instance deployed (with schema from `backend/db/schema.sql`)
- Backend Lambda deployed with `ingestCsv` function
- SES credentials (for email sending in Workflow C)

## Setup Steps

### 1. Create Postgres Credential in n8n
1. Go to **Credentials** → **Create new credential**
2. Type: **Postgres**
3. Fill in:
   - **Host**: Your RDS endpoint (e.g., `clickpay-pg.xxxxx.rds.amazonaws.com`)
   - **Database**: `clickpaydb`
   - **User**: `clickpay`
   - **Password**: Your strong password
   - **Port**: `5432`
   - **SSL**: `Disable` (or `Allow` if your RDS has SSL; free tier typically doesn't)
4. Click **Save**. Note the credential ID (shown in URL or credential list).

### 2. Update Workflow JSONs with Credential ID
Replace all instances of `"PG_CREDENTIAL_ID"` in the three workflow JSON files with the actual credential ID from step 1.

Example:
```json
"credentials": {"postgres": {"id": "abc123xyz", "name": "Postgres"}}
```

### 3. Import Workflows into n8n
**Option A: Via UI**
1. Go to **Workflows** → **Import from file**
2. Upload each JSON in order:
   - `workflow-a-product-discovery.json`
   - `workflow-b-matching.json`
   - `workflow-c-notification.json`

**Option B: Via n8n CLI**
```bash
n8n import:workflow --file workflow-a-product-discovery.json
n8n import:workflow --file workflow-b-matching.json
n8n import:workflow --file workflow-c-notification.json
```

### 4. Configure Workflow B Webhook
After importing Workflow B, activate it. The webhook will generate a URL like:
```
https://your-n8n-instance.com/webhook/user-upload-complete
```

Copy this URL and set it in `backend/.env`:
```
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/user-upload-complete
```

Then redeploy the backend:
```bash
cd backend
serverless deploy
```

### 5. Configure Workflow C Email
In Workflow C node "Send SES Email":
- Replace `"fromEmail"` with your verified SES sender email
- Ensure your AWS account has SES enabled in `ap-south-1`
- Add SES credentials to n8n (if not using IAM role):
  - Go to **Credentials** → **AWS**
  - Provide Access Key & Secret Key with `ses:SendEmail` permission

### 6. Test the Flow
1. **Test Workflow A**: Activate it or manually trigger (runs daily at 4 AM UTC by default)
2. **Test Workflow B**: 
   - Upload a CSV via your frontend (or presigned URL)
   - Lambda calls `N8N_WEBHOOK_URL` after ingestion
   - Workflow B triggers, fetches users & products, computes matches
3. **Test Workflow C**: 
   - After matches are inserted, manually trigger Workflow C to send emails
   - Or set up an event node to auto-trigger on match insertion (requires polling or CDC)

## Troubleshooting

### Postgres Connection Failed
- Check RDS security group allows inbound 5432 from n8n instance IP
- Verify `PGHOST`, `PGUSER`, `PGPASSWORD` in credential

### Webhook Not Triggered
- Check `N8N_WEBHOOK_URL` is correctly set in `backend/.env`
- Verify Workflow B is activated (green toggle)
- Tail Lambda logs: `serverless logs -f ingestCsv -t`

### SES Emails Not Sending
- Verify sender email is verified in SES
- Check SES sandbox mode (free tier); receiver email must also be verified
- Review n8n execution logs for email node errors

## Next Steps
- Monitor Workflow A for product discovery success
- Verify Workflow B matches accuracy
- Set up CI/CD to re-import workflows on changes
- Add data validation (e.g., income/credit score format checks) to Workflow B
