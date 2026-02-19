> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# Nordigen CLI

A production-ready command-line interface for the [Nordigen](https://nordigen.com) Account Information Services API. Access bank account data, transactions, balances, and manage open banking connections directly from your terminal.

> **Disclaimer**: This is an unofficial CLI tool and is not affiliated with, endorsed by, or supported by Nordigen or GoCardless.

## Features

- **Institutions** — Browse and search banks across 31 European countries
- **Agreements** — Create and manage end user agreements for account access
- **Requisitions** — Initiate bank connections and retrieve authorization links
- **Accounts** — Access account metadata, balances, details, and transactions
- **JWT Authentication** — Secure authentication with automatic token refresh
- **JSON output** — All commands support `--json` for scripting and piping
- **Colorized output** — Clean, readable terminal output with chalk

## Why CLI > MCP

MCP servers are complex, stateful, and require a running server process. A CLI is:

- **Simpler** — Just a binary you call directly
- **Composable** — Pipe output to `jq`, `grep`, `awk`, and other tools
- **Scriptable** — Use in shell scripts, CI/CD pipelines, cron jobs
- **Debuggable** — See exactly what's happening with `--json` flag
- **AI-friendly** — AI agents can call CLIs just as easily as MCPs, with less overhead

## Installation

```bash
npm install -g @ktmcp-cli/nordigencom
```

## Authentication Setup

Nordigen uses JWT authentication. You'll need to create a Nordigen account and obtain API credentials.

### 1. Create a Nordigen Account

1. Go to [nordigen.com](https://nordigen.com) or [ob.nordigen.com/account/login/](https://ob.nordigen.com/account/login/)
2. Sign up for a free or paid account
3. Navigate to **User Secrets** in the dashboard
4. Copy your **Secret ID** and **Secret Key**

### 2. Configure the CLI

```bash
nordigencom config set --secret-id YOUR_SECRET_ID --secret-key YOUR_SECRET_KEY
```

### 3. Login

```bash
nordigencom auth login
```

This will obtain a JWT access token that's valid for 24 hours and automatically refresh it when needed.

### 4. Verify

```bash
nordigencom auth status
```

## Commands

### Configuration

```bash
# Set credentials
nordigencom config set --secret-id <id> --secret-key <key>

# Show current config
nordigencom config show
```

### Authentication

```bash
# Login and obtain JWT token
nordigencom auth login

# Check auth status
nordigencom auth status
```

### Institutions

```bash
# List all institutions
nordigencom institutions list

# Filter by country
nordigencom institutions list --country GB
nordigencom institutions list --country DE

# Get institution details
nordigencom institutions get <institution-id>
```

### Agreements

End user agreements define what data you can access and for how long.

```bash
# List all agreements
nordigencom agreements list

# Get specific agreement
nordigencom agreements get <agreement-id>

# Create new agreement
nordigencom agreements create \
  --institution-id <institution-id> \
  --max-historical-days 90 \
  --access-valid-for-days 90

# Create agreement with limited scope
nordigencom agreements create \
  --institution-id <institution-id> \
  --access-scope balances,transactions

# Delete agreement
nordigencom agreements delete <agreement-id>
```

### Requisitions

Requisitions are bank connection requests that users authorize.

```bash
# List all requisitions
nordigencom requisitions list

# Get specific requisition
nordigencom requisitions get <requisition-id>

# Create new requisition
nordigencom requisitions create \
  --institution-id <institution-id> \
  --redirect https://yourapp.com/callback \
  --reference user-123 \
  --agreement-id <agreement-id>

# Delete requisition
nordigencom requisitions delete <requisition-id>
```

### Accounts

Access account data after a requisition is authorized.

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

All commands support `--json` for machine-readable output:

```bash
# Get all institutions as JSON
nordigencom institutions list --json

# Pipe to jq for filtering
nordigencom institutions list --country GB --json | jq '.[] | {id, name, bic}'

# Get transactions as JSON
nordigencom accounts transactions <account-id> --json
```

## Examples

### Connect a bank account (full workflow)

```bash
# Step 1: Find the bank institution
nordigencom institutions list --country GB
# Note the institution_id

# Step 2: Create an agreement
nordigencom agreements create \
  --institution-id SANDBOXFINANCE_SFIN0000 \
  --max-historical-days 90 \
  --access-valid-for-days 90
# Note the agreement_id

# Step 3: Create a requisition
nordigencom requisitions create \
  --institution-id SANDBOXFINANCE_SFIN0000 \
  --redirect https://myapp.com/callback \
  --reference user-123 \
  --agreement-id <agreement-id>
# Note the link URL and send it to the user

# Step 4: After user authorizes, get the requisition
nordigencom requisitions get <requisition-id>
# Note the account IDs in the response

# Step 5: Access account data
nordigencom accounts balances <account-id>
nordigencom accounts transactions <account-id>
```

### Monitor account transactions

```bash
# Get all transactions for an account
nordigencom accounts transactions <account-id> --json | jq '.transactions.booked[] | {date: .bookingDate, amount: .transactionAmount.amount, description: .remittanceInformationUnstructured}'
```

## Contributing

Issues and pull requests are welcome at [github.com/ktmcp-cli/nordigencom](https://github.com/ktmcp-cli/nordigencom).

## License

MIT — see [LICENSE](LICENSE) for details.

---

Part of the [KTMCP CLI](https://killthemcp.com) project — replacing MCPs with simple, composable CLIs.
