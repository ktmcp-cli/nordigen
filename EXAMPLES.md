# Nordigen CLI - Usage Examples

Practical examples for common use cases.

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Institution Discovery](#institution-discovery)
3. [Connecting Bank Accounts](#connecting-bank-accounts)
4. [Retrieving Account Data](#retrieving-account-data)
5. [Transaction Analysis](#transaction-analysis)
6. [Scripting and Automation](#scripting-and-automation)
7. [Error Handling](#error-handling)
8. [Advanced Use Cases](#advanced-use-cases)

## Initial Setup

### First-time authentication

```bash
# Get your API credentials from https://nordigen.com
export NORDIGEN_SECRET_ID="your-secret-id"
export NORDIGEN_SECRET_KEY="your-secret-key"

# Login
nordigen auth login \
  --secret-id "$NORDIGEN_SECRET_ID" \
  --secret-key "$NORDIGEN_SECRET_KEY"

# Verify authentication
nordigen auth status
```

### Check stored configuration

```bash
# View all config (secrets redacted)
nordigen config show

# View config with secrets visible (be careful!)
nordigen config show --show-secrets

# Get specific config value
nordigen config get auth.secret_id
```

## Institution Discovery

### List all banks in a country

```bash
# List all UK banks
nordigen institutions list --country GB

# List German banks with JSON output
nordigen institutions list --country GB --json

# List only banks that support payments
nordigen institutions list --country GB --payments
```

### Search for specific banks

```bash
# Search for Barclays in UK
nordigen institutions search "Barclays" --country GB

# Search for multiple countries
for country in GB DE FR; do
  echo "=== Banks in $country ==="
  nordigen institutions search "N26" --country $country
done
```

### Get detailed bank information

```bash
# Get full details for a specific institution
nordigen institutions get BARCLAYS_BARCGB22

# Get details as JSON
nordigen institutions get BARCLAYS_BARCGB22 --json

# Extract specific field with jq
nordigen institutions get BARCLAYS_BARCGB22 --json | jq '.transaction_total_days'
```

## Connecting Bank Accounts

### Complete connection flow

```bash
# Step 1: Find your bank
nordigen institutions search "Barclays" --country GB --json | jq '.[0].id'
INST_ID="BARCLAYS_BARCGB22"

# Step 2: Create end user agreement
AGREEMENT=$(nordigen agreements create \
  --institution-id "$INST_ID" \
  --max-days 90 \
  --valid-days 90 \
  --json | jq -r '.id')

echo "Created agreement: $AGREEMENT"

# Step 3: Create requisition
REQUISITION=$(nordigen requisitions create \
  --institution-id "$INST_ID" \
  --redirect "https://yourapp.com/callback" \
  --agreement "$AGREEMENT" \
  --json)

# Extract auth link
AUTH_LINK=$(echo "$REQUISITION" | jq -r '.link')
REQ_ID=$(echo "$REQUISITION" | jq -r '.id')

echo "Send this link to user: $AUTH_LINK"
echo "Requisition ID: $REQ_ID"

# Step 4: After user authenticates, get account IDs
sleep 10  # Wait for user authentication
nordigen requisitions get "$REQ_ID" --json | jq '.accounts[]'
```

### Quick connection (one-liner)

```bash
# Create agreement and requisition in one go
nordigen agreements create --institution-id BARCLAYS_BARCGB22 --max-days 90 --json | \
  jq -r '.id' | \
  xargs -I {} nordigen requisitions create \
    --institution-id BARCLAYS_BARCGB22 \
    --redirect "https://app.example.com/callback" \
    --agreement {} \
    --json | \
  jq -r '.link'
```

## Retrieving Account Data

### Get account balances

```bash
# Simple balance check
nordigen accounts balances abc-123-def-456

# JSON output
nordigen accounts balances abc-123-def-456 --json

# Extract specific balance type
nordigen accounts balances abc-123-def-456 --json | \
  jq '.balances[] | select(.balanceType == "expected") | .balanceAmount'
```

### Get account details

```bash
# Get IBAN and account details
nordigen accounts details abc-123-def-456

# Extract IBAN only
nordigen accounts details abc-123-def-456 --json | jq -r '.account.iban'
```

### Check multiple accounts

```bash
# Get balances for all accounts in a requisition
REQ_ID="your-requisition-id"
nordigen requisitions get "$REQ_ID" --json | \
  jq -r '.accounts[]' | \
  while read account_id; do
    echo "=== Account: $account_id ==="
    nordigen accounts balances "$account_id"
    echo
  done
```

## Transaction Analysis

### Get recent transactions

```bash
# Last 30 days
nordigen accounts transactions abc-123-def-456 \
  --from 2024-01-01 \
  --to 2024-01-31

# Last month with JSON
nordigen accounts transactions abc-123-def-456 \
  --from $(date -d '1 month ago' +%Y-%m-%d) \
  --to $(date +%Y-%m-%d) \
  --json
```

### Analyze spending

```bash
# Get all transactions and sum amounts
nordigen accounts transactions abc-123-def-456 \
  --from 2024-01-01 \
  --to 2024-01-31 \
  --json | \
  jq '.transactions.booked[] | .transactionAmount.amount' | \
  awk '{sum+=$1} END {print "Total:", sum}'

# Count transactions by type
nordigen accounts transactions abc-123-def-456 \
  --from 2024-01-01 \
  --to 2024-01-31 \
  --json | \
  jq '.transactions.booked[] | .transactionAmount.amount' | \
  awk '{if ($1 < 0) debit++; else credit++} END {print "Debits:", debit, "Credits:", credit}'
```

### Export transactions to CSV

```bash
# Convert JSON to CSV
nordigen accounts transactions abc-123-def-456 \
  --from 2024-01-01 \
  --to 2024-12-31 \
  --json | \
  jq -r '.transactions.booked[] |
    [.bookingDate, .transactionAmount.amount, .transactionAmount.currency, .remittanceInformationUnstructured] |
    @csv' > transactions.csv

# Add headers
echo "date,amount,currency,description" | cat - transactions.csv > transactions_final.csv
```

### Find largest transactions

```bash
# Top 10 expenses
nordigen accounts transactions abc-123-def-456 \
  --from 2024-01-01 \
  --to 2024-12-31 \
  --json | \
  jq '.transactions.booked[] |
    select(.transactionAmount.amount | tonumber < 0) |
    {date: .bookingDate, amount: .transactionAmount.amount, description: .remittanceInformationUnstructured}' | \
  jq -s 'sort_by(.amount | tonumber) | .[0:10]'
```

## Scripting and Automation

### Daily balance check script

```bash
#!/bin/bash
# daily-balance.sh

ACCOUNTS=(
  "account-id-1"
  "account-id-2"
  "account-id-3"
)

echo "Daily Balance Report - $(date)"
echo "================================"

for account in "${ACCOUNTS[@]}"; do
  echo
  echo "Account: $account"

  balance=$(nordigen accounts balances "$account" --json | \
    jq -r '.balances[] | select(.balanceType == "expected") | .balanceAmount.amount')

  currency=$(nordigen accounts balances "$account" --json | \
    jq -r '.balances[] | select(.balanceType == "expected") | .balanceAmount.currency')

  echo "Balance: $balance $currency"
done
```

### Weekly transaction summary

```bash
#!/bin/bash
# weekly-summary.sh

ACCOUNT_ID="your-account-id"
FROM_DATE=$(date -d '7 days ago' +%Y-%m-%d)
TO_DATE=$(date +%Y-%m-%d)

echo "Weekly Transaction Summary"
echo "Period: $FROM_DATE to $TO_DATE"
echo "================================"

# Get transactions
TRANSACTIONS=$(nordigen accounts transactions "$ACCOUNT_ID" \
  --from "$FROM_DATE" \
  --to "$TO_DATE" \
  --json)

# Count and sum
total_transactions=$(echo "$TRANSACTIONS" | jq '.transactions.booked | length')
total_spent=$(echo "$TRANSACTIONS" | jq '.transactions.booked[] | select(.transactionAmount.amount | tonumber < 0) | .transactionAmount.amount | tonumber' | awk '{sum+=$1} END {print sum}')
total_income=$(echo "$TRANSACTIONS" | jq '.transactions.booked[] | select(.transactionAmount.amount | tonumber > 0) | .transactionAmount.amount | tonumber' | awk '{sum+=$1} END {print sum}')

echo "Total transactions: $total_transactions"
echo "Total spent: $(printf '%.2f' $total_spent)"
echo "Total income: $(printf '%.2f' $total_income)"
echo "Net: $(printf '%.2f' $(echo "$total_income + $total_spent" | bc))"
```

### Monitor for large transactions

```bash
#!/bin/bash
# monitor-large-transactions.sh

ACCOUNT_ID="your-account-id"
THRESHOLD=1000  # Alert if transaction > 1000

FROM_DATE=$(date -d '1 day ago' +%Y-%m-%d)
TO_DATE=$(date +%Y-%m-%d)

nordigen accounts transactions "$ACCOUNT_ID" \
  --from "$FROM_DATE" \
  --to "$TO_DATE" \
  --json | \
  jq -r ".transactions.booked[] |
    select((.transactionAmount.amount | tonumber | abs) > $THRESHOLD) |
    \"ALERT: Large transaction on \\(.bookingDate): \\(.transactionAmount.amount) \\(.transactionAmount.currency) - \\(.remittanceInformationUnstructured)\""
```

### Sync all accounts to database

```bash
#!/bin/bash
# sync-to-db.sh

# Get all active requisitions
REQUISITIONS=$(nordigen requisitions list --json | jq -r '.results[].id')

for req_id in $REQUISITIONS; do
  # Get accounts for this requisition
  ACCOUNTS=$(nordigen requisitions get "$req_id" --json | jq -r '.accounts[]')

  for account_id in $ACCOUNTS; do
    echo "Syncing account: $account_id"

    # Get latest transactions
    TRANSACTIONS=$(nordigen accounts transactions "$account_id" \
      --from $(date -d '30 days ago' +%Y-%m-%d) \
      --json)

    # Save to database (example with PostgreSQL)
    echo "$TRANSACTIONS" | \
      jq -r '.transactions.booked[] |
        "INSERT INTO transactions (account_id, date, amount, currency, description) VALUES (\(env.account_id), \(.bookingDate), \(.transactionAmount.amount), \(.transactionAmount.currency), \(.remittanceInformationUnstructured));"' | \
      psql -d mydb
  done
done
```

## Error Handling

### Check authentication before commands

```bash
#!/bin/bash

# Function to ensure authentication
ensure_auth() {
  if ! nordigen auth status 2>/dev/null | grep -q "Authenticated"; then
    echo "Not authenticated. Logging in..."
    nordigen auth login \
      --secret-id "$NORDIGEN_SECRET_ID" \
      --secret-key "$NORDIGEN_SECRET_KEY"
  fi
}

# Use in scripts
ensure_auth
nordigen accounts balances abc-123-def-456
```

### Retry on failure

```bash
#!/bin/bash

# Function to retry command with backoff
retry_command() {
  local max_attempts=3
  local attempt=1
  local delay=5

  while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt of $max_attempts..."

    if eval "$@"; then
      return 0
    fi

    echo "Failed. Retrying in ${delay}s..."
    sleep $delay
    delay=$((delay * 2))
    attempt=$((attempt + 1))
  done

  echo "Command failed after $max_attempts attempts"
  return 1
}

# Use it
retry_command nordigen accounts balances abc-123-def-456
```

### Handle rate limiting

```bash
#!/bin/bash

# Process accounts with rate limit handling
process_accounts() {
  local accounts=("$@")

  for account in "${accounts[@]}"; do
    if ! nordigen accounts balances "$account" 2>/dev/null; then
      error=$(nordigen accounts balances "$account" 2>&1 >/dev/null)

      if echo "$error" | grep -q "Rate limit"; then
        echo "Rate limited. Waiting 60 seconds..."
        sleep 60
        # Retry
        nordigen accounts balances "$account"
      else
        echo "Error: $error"
      fi
    fi
  done
}
```

## Advanced Use Cases

### Multi-country account aggregation

```bash
#!/bin/bash
# aggregate-accounts.sh

# Countries and their institutions
declare -A COUNTRIES=(
  ["GB"]="BARCLAYS_BARCGB22 LLOYDS_LOYDGB21"
  ["DE"]="DEUTSCHE_DEUTDEFF COMMERZBANK_COBADEFF"
  ["FR"]="BNP_BNPAFRPP CREDIT_AGRICOLE_AGRIFRPP"
)

for country in "${!COUNTRIES[@]}"; do
  echo "=== $country ==="

  for institution in ${COUNTRIES[$country]}; do
    echo "  Institution: $institution"
    nordigen institutions get "$institution" --json | jq '{name, bic, countries}'
  done
done
```

### Transaction categorization

```bash
#!/bin/bash
# categorize-transactions.sh

ACCOUNT_ID="your-account-id"

# Get transactions
TRANSACTIONS=$(nordigen accounts transactions "$ACCOUNT_ID" \
  --from 2024-01-01 \
  --to 2024-12-31 \
  --json)

# Categorize
echo "$TRANSACTIONS" | jq -r '.transactions.booked[] |
  .description = .remittanceInformationUnstructured |
  .category = (
    if (.description | test("supermarket|tesco|sainsbury"; "i")) then "groceries"
    elif (.description | test("restaurant|cafe|pizza"; "i")) then "dining"
    elif (.description | test("uber|taxi|transport"; "i")) then "transport"
    elif (.description | test("amazon|ebay|shop"; "i")) then "shopping"
    else "other"
    end
  ) |
  {date: .bookingDate, amount: .transactionAmount.amount, category, description}' | \
  jq -s 'group_by(.category) |
    map({category: .[0].category, count: length, total: (map(.amount | tonumber) | add)})' | \
  jq -r '.[] | "\(.category): \(.count) transactions, total: \(.total)"'
```

### Budget tracking

```bash
#!/bin/bash
# budget-tracker.sh

ACCOUNT_ID="your-account-id"
BUDGET=2000  # Monthly budget

# Get this month's transactions
FROM_DATE=$(date +%Y-%m-01)
TO_DATE=$(date +%Y-%m-%d)

SPENT=$(nordigen accounts transactions "$ACCOUNT_ID" \
  --from "$FROM_DATE" \
  --to "$TO_DATE" \
  --json | \
  jq '.transactions.booked[] |
    select(.transactionAmount.amount | tonumber < 0) |
    .transactionAmount.amount | tonumber' | \
  awk '{sum+=$1} END {print sum}')

SPENT=${SPENT#-}  # Remove negative sign
REMAINING=$(echo "$BUDGET - $SPENT" | bc)
PERCENTAGE=$(echo "scale=2; ($SPENT / $BUDGET) * 100" | bc)

echo "Budget Tracker"
echo "=============="
echo "Budget: $BUDGET"
echo "Spent: $SPENT"
echo "Remaining: $REMAINING"
echo "Used: ${PERCENTAGE}%"

if (( $(echo "$PERCENTAGE > 80" | bc -l) )); then
  echo "WARNING: You've used more than 80% of your budget!"
fi
```

## Testing and Development

### Dry run mode

```bash
# Test commands without executing
DRY_RUN=1 ./your-script.sh

# In script:
if [ "$DRY_RUN" = "1" ]; then
  echo "[DRY RUN] Would execute: nordigen accounts balances $ACCOUNT_ID"
else
  nordigen accounts balances "$ACCOUNT_ID"
fi
```

### Debug mode

```bash
# Enable debug output
DEBUG=1 nordigen accounts balances abc-123-def-456

# With verbose bash
set -x
nordigen accounts balances abc-123-def-456
set +x
```

These examples should cover most common use cases. Combine and modify them based on your specific needs!
