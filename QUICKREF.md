# Nordigen CLI - Quick Reference

Essential commands at a glance.

## Installation

```bash
npm install -g @ktmcp-cli/nordigen
# or
cd nordigen-cli && npm link
```

## Authentication

```bash
# Login
nordigen auth login --secret-id <ID> --secret-key <KEY>

# Check status
nordigen auth status

# Logout
nordigen auth logout
```

## Institutions

```bash
# List banks in a country
nordigen institutions list --country GB

# Search for a bank
nordigen institutions search "Barclays" --country GB

# Get bank details
nordigen institutions get BARCLAYS_BARCGB22
```

## Account Connection

```bash
# 1. Create agreement
nordigen agreements create --institution-id <ID> --max-days 90

# 2. Create requisition (returns auth link)
nordigen requisitions create \
  --institution-id <ID> \
  --redirect https://yourapp.com/callback \
  --agreement <AGREEMENT_ID>

# 3. Check requisition (after user auth)
nordigen requisitions get <REQ_ID>
```

## Account Data

```bash
# Get account info
nordigen accounts get <ACCOUNT_ID>

# Check balances
nordigen accounts balances <ACCOUNT_ID>

# Get details
nordigen accounts details <ACCOUNT_ID>

# Fetch transactions
nordigen accounts transactions <ACCOUNT_ID>

# Transactions with date range
nordigen accounts transactions <ACCOUNT_ID> \
  --from 2024-01-01 \
  --to 2024-12-31
```

## Common Options

```bash
# JSON output
--json, -j

# Help
--help, -h

# Version
--version, -V
```

## Useful Aliases

```bash
# Command aliases
acc       → accounts
inst      → institutions
eua       → agreements
req       → requisitions
pay       → payments
```

## Scripting

```bash
# Get all account IDs from a requisition
nordigen requisitions get <REQ_ID> --json | jq -r '.accounts[]'

# Check balance and format
nordigen accounts balances <ID> --json | \
  jq -r '.balances[] | select(.balanceType=="expected") | .balanceAmount.amount'

# Export transactions to CSV
nordigen accounts transactions <ID> --from 2024-01-01 --json | \
  jq -r '.transactions.booked[] |
    [.bookingDate, .transactionAmount.amount, .remittanceInformationUnstructured] |
    @csv'
```

## Environment Variables

```bash
export NORDIGEN_SECRET_ID="your-secret-id"
export NORDIGEN_SECRET_KEY="your-secret-key"
export DEBUG=1  # Enable debug mode
```

## Config Management

```bash
# Show config
nordigen config show

# Set default country
nordigen config set-country GB

# Get specific value
nordigen config get auth.secret_id

# Clear all config
nordigen config clear --yes
```

## Error Handling

```bash
# Enable debug output
DEBUG=1 nordigen accounts get <ID>

# Check exit code
nordigen auth status
echo $?  # 0 = success, 1 = error
```

## Common Workflows

### Connect New Bank

```bash
INST_ID=$(nordigen institutions search "MyBank" --country GB --json | jq -r '.[0].id')
AGREEMENT=$(nordigen agreements create --institution-id $INST_ID --max-days 90 --json | jq -r '.id')
nordigen requisitions create --institution-id $INST_ID --redirect https://app.com/callback --agreement $AGREEMENT
```

### Daily Balance Check

```bash
for account in $(nordigen requisitions list --json | jq -r '.results[].accounts[]'); do
  echo "Account: $account"
  nordigen accounts balances $account --json | \
    jq -r '.balances[] | select(.balanceType=="expected") |
      "\(.balanceAmount.amount) \(.balanceAmount.currency)"'
done
```

### Transaction Analysis

```bash
nordigen accounts transactions <ID> \
  --from $(date -d '30 days ago' +%Y-%m-%d) \
  --to $(date +%Y-%m-%d) \
  --json | \
  jq '.transactions.booked |
    group_by(.transactionAmount.amount < "0") |
    map({type: (if .[0].transactionAmount.amount < "0" then "debit" else "credit" end),
         count: length,
         total: (map(.transactionAmount.amount | tonumber) | add)})'
```

## Country Codes

Common ISO 3166 codes:

```
GB - United Kingdom    DE - Germany      FR - France
ES - Spain            IT - Italy        NL - Netherlands
SE - Sweden           DK - Denmark      NO - Norway
FI - Finland          BE - Belgium      IE - Ireland
PL - Poland           AT - Austria      CH - Switzerland
```

## Exit Codes

```
0   - Success
1   - General error
400 - Bad request
401 - Authentication error
403 - Permission denied
404 - Not found
429 - Rate limit exceeded
500 - Server error
```

## Tips

1. Always use `--json` for scripts and automation
2. Store credentials in env vars, not in scripts
3. Check auth status before running batch operations
4. Use pagination for large result sets
5. Enable DEBUG for troubleshooting
6. Cache institution lists (they rarely change)

## Documentation

- Full guide: `README.md`
- Examples: `EXAMPLES.md`
- AI integration: `AGENT.md`
- OpenClaw: `OPENCLAW.md`

## Support

- Issues: https://github.com/ktmcp/nordigen-cli/issues
- API Docs: https://nordigen.com/en/docs/
