# n8n Workflow Deployment Checklist

## Pre-Deployment
- [ ] n8n instance is running (self-hosted or n8n.cloud account)
- [ ] RDS Postgres is deployed and `backend/db/schema.sql` has been applied
- [ ] Backend Lambdas are deployed (`serverless deploy` completed)
- [ ] AWS SES is enabled in `ap-south-1` (for Workflow C emails)

## Step 1: Create Postgres Credential in n8n
- [ ] Log in to n8n instance
- [ ] Go to **Credentials** → **New Credential**
- [ ] Type: **Postgres**
- [ ] Host: `YOUR_RDS_ENDPOINT` (from `aws rds describe-db-instances --db-instance-identifier clickpay-pg --region ap-south-1 --query 'DBInstances[0].Endpoint.Address'`)
- [ ] Database: `clickpaydb`
- [ ] User: `clickpay`
- [ ] Password: (your strong password from RDS creation)
- [ ] Port: `5432`
- [ ] SSL: `Disable`
- [ ] Click **Save** and **copy the credential ID**

## Step 2: Update Workflow JSONs
For each of `workflow-a-product-discovery.json`, `workflow-b-matching.json`, `workflow-c-notification.json`:
- [ ] Open the file in a text editor
- [ ] Find all instances of `"PG_CREDENTIAL_ID"`
- [ ] Replace with the credential ID from Step 1
- [ ] Save

## Step 3: Import Workflows
- [ ] Go to n8n **Workflows** → **Import from file**
- [ ] Upload `workflow-a-product-discovery.json`
- [ ] Upload `workflow-b-matching.json`
- [ ] Upload `workflow-c-notification.json`

## Step 4: Activate Workflow B and Get Webhook URL
- [ ] Open Workflow B in n8n editor
- [ ] Click **Activate** (toggle on)
- [ ] Click on the **Webhook Trigger** node
- [ ] Copy the webhook URL (e.g., `https://your-n8n.com/webhook/user-upload-complete`)

## Step 5: Wire Workflow B to Backend
- [ ] Open `backend/.env`
- [ ] Set: `N8N_WEBHOOK_URL=<webhook URL from Step 4>`
- [ ] Save
- [ ] Run: `cd backend && serverless deploy`

## Step 6: Configure SES (for Workflow C)
- [ ] Go to n8n **Credentials** → **New Credential**
- [ ] Type: **AWS**
- [ ] Region: `ap-south-1`
- [ ] Access Key ID & Secret (from AWS IAM user with `ses:SendEmail` permission)
- [ ] Click **Save** and copy credential ID
- [ ] Open `workflow-c-notification.json` → find "Send SES Email" node
- [ ] Replace AWS credential ID if different
- [ ] Also replace sender email (`no-reply@yourdomain.com` → your verified SES sender)

## Step 7: Test End-to-End
### Workflow A (Product Discovery)
- [ ] Activate Workflow A
- [ ] Wait for next 4 AM UTC trigger, or manually trigger in n8n UI
- [ ] Check DB: `SELECT * FROM loan_products;` should have rows

### Workflow B (User Matching)
- [ ] Upload a CSV via frontend or presigned URL
- [ ] Lambda ingests → calls `N8N_WEBHOOK_URL`
- [ ] Check n8n execution logs for Workflow B
- [ ] Check DB: `SELECT * FROM matches;` should have rows

### Workflow C (Notifications)
- [ ] Manually trigger Workflow C in n8n UI
- [ ] Check SES sending statistics in AWS Console
- [ ] Verify emails arrive in inbox (or SES sandbox mode logs)

## Troubleshooting
- **Postgres connection fails**: Verify RDS security group allows 5432 from n8n IP. Test with `psql -h <host> -U clickpay -d clickpaydb` on your machine.
- **Webhook not triggered**: Tail logs: `serverless logs -f ingestCsv -t` to see if Lambda calls the webhook.
- **Emails not sending**: Check SES sandbox mode (verify recipient emails). Verify sender email is verified in SES.

## Success Indicators
- [ ] Workflow A populates `loan_products` table
- [ ] Workflow B creates entries in `matches` table after CSV upload
- [ ] Workflow C sends emails to users (or logs errors in n8n execution)
- [ ] Frontend `/products` page shows matched loans
- [ ] Chat (Gemini) responds to loan inquiries using DB data

---

**Next**: Once all steps pass, test the full flow: upload CSV → ingest → match → notify → view on frontend.
