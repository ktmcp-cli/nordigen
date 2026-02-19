# AGENT.md — Nordigen CLI for AI Agents

This document explains how to use the Nordigen CLI as an AI agent.

## Overview

The `nordigencom` CLI provides access to the Nordigen Account Information Services API. Use it to access bank account data, transactions, balances, and manage open banking connections on behalf of users.

## Prerequisites

The CLI must be authenticated before use. Check status with:

```bash
nordigencom auth status
```

If not authenticated, the user must run:
```bash
nordigencom config set --secret-id <id> --secret-key <key>
nordigencom auth login
```

## All Commands

### Config

```bash
nordigencom config set --secret-id <id> --secret-key <key>
nordigencom config show
```

### Auth

```bash
nordigencom auth login           # Obtain JWT token
nordigencom auth status          # Check if authenticated
```

### Institutions

```bash
# List institutions
nordigencom institutions list
nordigencom institutions list --country GB
nordigencom institutions list --country DE
nordigencom institutions list --country FR

# Get single institution
nordigencom institutions get <institution-id>
```

Country codes: GB, DE, FR, ES, IT, NL, BE, AT, SE, DK, NO, FI, IE, PT, PL, CZ, EE, LV, LT, LU, SI, SK, MT, CY, BG, RO, HR, GR

### Agreements

```bash
# List agreements
nordigencom agreements list
nordigencom agreements list --limit 50 --offset 0

# Get single agreement
nordigencom agreements get <agreement-id>

# Create agreement
nordigencom agreements create \
  --institution-id <institution-id> \
  --max-historical-days 90 \
  --access-valid-for-days 90 \
  --access-scope balances,details,transactions

# Delete agreement
nordigencom agreements delete <agreement-id>
```

Access scopes: `balances`, `details`, `transactions`

### Requisitions

```bash
# List requisitions
nordigencom requisitions list
nordigencom requisitions list --limit 50 --offset 0

# Get single requisition
nordigencom requisitions get <requisition-id>

# Create requisition
nordigencom requisitions create \
  --institution-id <institution-id> \
  --redirect <callback-url> \
  --reference <unique-reference> \
  --agreement-id <agreement-id> \
  --user-language EN

# Delete requisition
nordigencom requisitions delete <requisition-id>
```

User languages: EN, DE, FR, ES, IT, NL, etc.

### Accounts

```bash
# Get account metadata
nordigencom accounts get <account-id>

# Get account balances
nordigencom accounts balances <account-id>

# Get account details
nordigencom accounts details <account-id>

# Get account transactions
nordigencom accounts transactions <account-id>
```

## JSON Output

All list and get commands support `--json` for structured output. Always use `--json` when parsing results programmatically:

```bash
nordigencom institutions list --json
nordigencom agreements list --json
nordigencom requisitions list --json
nordigencom accounts transactions <account-id> --json
```

## Example Workflows

### Connect a new bank account

```bash
# Step 1: Find the institution
nordigencom institutions list --country GB --json | jq '.[] | select(.name | contains("Revolut"))'

# Step 2: Create an agreement
nordigencom agreements create \
  --institution-id REVOLUT_REVOGB21 \
  --max-historical-days 90 \
  --access-valid-for-days 90 \
  --json

# Step 3: Create a requisition (use agreement ID from step 2)
nordigencom requisitions create \
  --institution-id REVOLUT_REVOGB21 \
  --redirect https://myapp.com/callback \
  --reference user-123 \
  --agreement-id <agreement-id> \
  --json

# Step 4: Send the "link" URL to the user for authorization
# After authorization, get the requisition to see account IDs

nordigencom requisitions get <requisition-id> --json
```

### Retrieve account transactions

```bash
# Get all booked transactions as JSON
nordigencom accounts transactions <account-id> --json | jq '.transactions.booked'

# Filter transactions by amount
nordigencom accounts transactions <account-id> --json | jq '.transactions.booked[] | select(.transactionAmount.amount | tonumber > 100)'
```

### Monitor account balances

```bash
# Get current balance
nordigencom accounts balances <account-id> --json | jq '.balances[] | select(.balanceType == "interimAvailable")'
```

## Requisition Flow

The typical flow for connecting a bank account:

1. **Create Agreement** — Define what data you need and for how long
2. **Create Requisition** — Generate an authorization link
3. **User Authorizes** — User clicks the link and authenticates with their bank
4. **Retrieve Accounts** — After authorization, get account IDs from the requisition
5. **Access Data** — Use account IDs to fetch balances, details, and transactions

## Error Handling

The CLI exits with code 1 on error and prints an error message to stderr. Common errors:

- `Authentication failed` — Run `nordigencom auth login`
- `Resource not found` — Check the ID is correct
- `Rate limit exceeded` — Wait before retrying

## Tips for Agents

1. Always use `--json` when you need to extract specific fields
2. When creating requisitions, always provide a unique reference (e.g., user ID)
3. Store agreement IDs and requisition IDs for later use
4. The authorization link expires after a period, so create new requisitions as needed
5. JWT tokens are automatically refreshed — no need to re-authenticate unless credentials expire
6. Use country codes to filter institutions for better UX
