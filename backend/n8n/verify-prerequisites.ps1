# Verify n8n Workflow Prerequisites
# Run this script before deploying workflows to ensure all dependencies are in place.

param(
    [string]$RDS_ENDPOINT,
    [string]$RDS_USER = "clickpay",
    [string]$RDS_PASSWORD,
    [string]$RDS_DATABASE = "clickpaydb",
    [string]$N8N_URL,
    [string]$AWS_REGION = "ap-south-1"
)

Write-Host "=== n8n Workflow Prerequisites Check ===" -ForegroundColor Cyan

# Check 1: RDS Connectivity
Write-Host "`n[1] Testing RDS PostgreSQL connection..." -ForegroundColor Yellow
if (-not $RDS_ENDPOINT -or -not $RDS_PASSWORD) {
    Write-Host "ERROR: RDS_ENDPOINT and RDS_PASSWORD are required." -ForegroundColor Red
    exit 1
}

# Install psql if not present (assumes WSL or standalone psql)
$psqlTest = psql --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: psql not found. Install PostgreSQL client or use WSL." -ForegroundColor Yellow
} else {
    Write-Host "psql found: $psqlTest" -ForegroundColor Green
    
    # Test connection (note: uses PGPASSWORD env var)
    $env:PGPASSWORD = $RDS_PASSWORD
    $testQuery = psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -c "SELECT version();" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ RDS connection successful" -ForegroundColor Green
        Write-Host "  Endpoint: $RDS_ENDPOINT" -ForegroundColor Gray
    } else {
        Write-Host "✗ RDS connection failed: $testQuery" -ForegroundColor Red
        Write-Host "  Check: Security group allows 5432, RDS is available, credentials correct" -ForegroundColor Yellow
    }
    
    # Check schema tables
    Write-Host "`n[2] Checking database schema..." -ForegroundColor Yellow
    $tables = psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -tc "SELECT tablename FROM pg_tables WHERE schemaname = 'public';" 2>&1
    $tableList = $tables -split "`n" | Where-Object {$_ -match '\S'} | ForEach-Object {$_.Trim()}
    
    if ($tableList -contains "users" -and $tableList -contains "loan_products" -and $tableList -contains "matches") {
        Write-Host "✓ All required tables found: $($tableList -join ', ')" -ForegroundColor Green
    } else {
        Write-Host "✗ Missing tables. Expected: users, loan_products, matches. Found: $($tableList -join ', ')" -ForegroundColor Red
        Write-Host "  Run: psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE -f backend/db/schema.sql" -ForegroundColor Yellow
    }
    
    Remove-Item Env:\PGPASSWORD
}

# Check 3: AWS SES Verification
Write-Host "`n[3] Checking SES configuration..." -ForegroundColor Yellow
$sesIdentities = aws ses list-identities --region $AWS_REGION --output text 2>&1
if ($LASTEXITCODE -eq 0 -and $sesIdentities) {
    Write-Host "✓ SES identities found: $sesIdentities" -ForegroundColor Green
} else {
    Write-Host "⚠ No SES identities verified. You need to verify a sender email in SES (AWS Console → SES → Verified identities)." -ForegroundColor Yellow
}

# Check 4: n8n Connectivity (if provided)
if ($N8N_URL) {
    Write-Host "`n[4] Testing n8n connectivity..." -ForegroundColor Yellow
    $n8nHealth = Invoke-WebRequest -Uri "$N8N_URL/api/v1/health" -ErrorAction SilentlyContinue 2>&1
    if ($n8nHealth.StatusCode -eq 200) {
        Write-Host "✓ n8n instance is healthy" -ForegroundColor Green
    } else {
        Write-Host "✗ n8n not responding. Check URL: $N8N_URL" -ForegroundColor Red
    }
} else {
    Write-Host "`n[4] Skipping n8n check (provide -N8N_URL to enable)" -ForegroundColor Gray
}

# Check 5: Lambda Deployment
Write-Host "`n[5] Checking Lambda deployment..." -ForegroundColor Yellow
$lambdas = aws lambda list-functions --region $AWS_REGION --query "Functions[?contains(FunctionName, 'loan-eligibility')].FunctionName" --output text 2>&1
if ($lambdas) {
    Write-Host "✓ Lambda functions found: $lambdas" -ForegroundColor Green
} else {
    Write-Host "✗ No Lambda functions found. Run: cd backend && serverless deploy" -ForegroundColor Red
}

Write-Host "`n=== Checks Complete ===" -ForegroundColor Cyan
Write-Host "Next: Follow the deployment checklist in DEPLOYMENT_CHECKLIST.md" -ForegroundColor Gray
