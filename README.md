# Nordigen CLI

Production-ready command-line interface for the Nordigen Account Information Services API (Open Banking).

## Features

- Complete coverage of Nordigen API v2
- JWT authentication with automatic token refresh
- Secure credential storage
- Rich terminal output with colors and formatting
- JSON output for scripting and automation
- Comprehensive error handling
- Support for all major operations:
  - Account information (balances, details, transactions)
  - Institution browsing and search
  - End User Agreements (EUA) management
  - Requisition creation and management
  - Payment operations

## Installation

### From Source

```bash
cd /workspace/group/ktmcp/workspace/nordigen
npm install
chmod +x bin/nordigen.js
npm link  # or add to PATH
```

### From NPM (when published)

```bash
npm install -g @ktmcp-cli/nordigen
```

## Quick Start

### 1. Authentication

First, obtain your API credentials from the Nordigen dashboard at https://nordigen.com

```bash
# Login with your credentials
nordigen auth login --secret-id YOUR_SECRET_ID --secret-key YOUR_SECRET_KEY

# Check authentication status
nordigen auth status
```

### 2. Browse Institutions

```bash
# List banks in Great Britain
nordigen institutions list --country GB

# Search for a specific bank
nordigen institutions search "Barclays" --country GB

# Get details for a specific institution
nordigen institutions get BARCLAYS_BARCGB22
```

### 3. Create End User Agreement

```bash
# Create an agreement for accessing account data
nordigen agreements create \
  --institution-id BARCLAYS_BARCGB22 \
  --max-days 90 \
  --valid-days 90
```

### 4. Create Requisition

```bash
# Create a requisition to connect a bank account
nordigen requisitions create \
  --institution-id BARCLAYS_BARCGB22 \
  --redirect https://yourapp.com/callback \
  --agreement <AGREEMENT_ID>

# The command will return an authentication link
# Send this link to the end user to authorize access
```

### 5. Access Account Data

```bash
# Get account metadata
nordigen accounts get <ACCOUNT_ID>

# Get account balances
nordigen accounts balances <ACCOUNT_ID>

# Get account transactions
nordigen accounts transactions <ACCOUNT_ID>

# Get transactions for a date range
nordigen accounts transactions <ACCOUNT_ID> \
  --from 2024-01-01 \
  --to 2024-12-31
```

## Command Reference

### Authentication

```bash
# Login
nordigen auth login --secret-id <id> --secret-key <key>

# Check status
nordigen auth status

# Logout
nordigen auth logout
```

### Institutions

```bash
# List institutions
nordigen institutions list --country <CODE>
nordigen institutions list --country GB --payments

# Search institutions
nordigen institutions search <query> --country <CODE>

# Get institution details
nordigen institutions get <INSTITUTION_ID>
```

### End User Agreements

```bash
# List agreements
nordigen agreements list

# Create agreement
nordigen agreements create \
  --institution-id <ID> \
  --max-days 90 \
  --valid-days 90 \
  --scope balances details transactions

# Get agreement
nordigen agreements get <AGREEMENT_ID>

# Delete agreement
nordigen agreements delete <AGREEMENT_ID> --yes

# Accept agreement (programmatically)
nordigen agreements accept <AGREEMENT_ID> \
  --user-agent "Mozilla/5.0..." \
  --ip "192.168.1.1"
```

### Requisitions

```bash
# List requisitions
nordigen requisitions list

# Create requisition
nordigen requisitions create \
  --institution-id <ID> \
  --redirect <URL> \
  --reference "my-ref" \
  --agreement <AGREEMENT_ID>

# Get requisition
nordigen requisitions get <REQUISITION_ID>

# Delete requisition
nordigen requisitions delete <REQUISITION_ID> --yes
```

### Accounts

```bash
# Get account metadata
nordigen accounts get <ACCOUNT_ID>

# Get balances
nordigen accounts balances <ACCOUNT_ID>

# Get account details
nordigen accounts details <ACCOUNT_ID>

# Get transactions
nordigen accounts transactions <ACCOUNT_ID>
nordigen accounts transactions <ACCOUNT_ID> --from 2024-01-01 --to 2024-12-31

# Premium transactions (with country-specific data)
nordigen accounts transactions <ACCOUNT_ID> --premium --country GB
```

### Payments

```bash
# List payments
nordigen payments list

# Get payment details
nordigen payments get <PAYMENT_ID>

# Delete payment
nordigen payments delete <PAYMENT_ID> --yes

# List creditors
nordigen payments creditors

# Get required payment fields for institution
nordigen payments fields <INSTITUTION_ID>
```

### Configuration

```bash
# Show configuration
nordigen config show
nordigen config show --show-secrets  # WARNING: displays sensitive data

# Get specific value
nordigen config get auth.secret_id

# Set value
nordigen config set defaults.country GB

# Set default country
nordigen config set-country GB

# Clear all configuration
nordigen config clear --yes
```

## JSON Output

All commands support `--json` or `-j` flag for machine-readable output:

```bash
# Get account as JSON
nordigen accounts get <ACCOUNT_ID> --json

# Pipe to jq for processing
nordigen institutions list --country GB --json | jq '.[].name'
```

## Environment Variables

- `DEBUG=1` - Enable debug output with stack traces
- `NORDIGEN_SECRET_ID` - Alternative to storing secret ID in config
- `NORDIGEN_SECRET_KEY` - Alternative to storing secret key in config

## Configuration Storage

Configuration is stored securely in:

- **Linux/macOS**: `~/.config/nordigen-cli/config.json`
- **Windows**: `%APPDATA%\nordigen-cli\config.json`

The config file has permissions set to `0600` (read/write for owner only).

## Error Handling

The CLI provides detailed error messages with exit codes:

- `0` - Success
- `1` - General error
- `400` - Bad request / validation error
- `401` - Authentication error
- `403` - Permission denied
- `404` - Resource not found
- `429` - Rate limit exceeded
- `500` - Server error

Enable debug output for detailed stack traces:

```bash
DEBUG=1 nordigen accounts get <ACCOUNT_ID>
```

## Common Workflows

### Complete Bank Connection Flow

```bash
# 1. Find the institution
nordigen institutions search "Your Bank" --country GB

# 2. Create end user agreement
nordigen agreements create --institution-id <INST_ID> --max-days 90

# 3. Create requisition
nordigen requisitions create \
  --institution-id <INST_ID> \
  --redirect https://yourapp.com/callback \
  --agreement <AGREEMENT_ID>

# 4. Send the returned link to your user for authentication

# 5. After user authenticates, retrieve accounts
nordigen requisitions get <REQUISITION_ID>

# 6. Access account data
nordigen accounts balances <ACCOUNT_ID>
nordigen accounts transactions <ACCOUNT_ID>
```

### Batch Processing Accounts

```bash
# Get all requisitions as JSON
nordigen requisitions list --json > requisitions.json

# Extract account IDs and fetch transactions
cat requisitions.json | jq -r '.results[].accounts[]' | while read account; do
  echo "Fetching transactions for $account"
  nordigen accounts transactions $account --json > "transactions_${account}.json"
done
```

## Why CLI > MCP?

### Performance
- **CLI**: Direct execution, no protocol overhead, instant responses
- **MCP**: Additional network/IPC layer, serialization overhead, slower responses

### Simplicity
- **CLI**: Simple command invocation, standard UNIX patterns, easy to compose
- **MCP**: Requires server setup, protocol understanding, more moving parts

### Debugging
- **CLI**: Standard stdout/stderr, easy to debug with DEBUG flag
- **MCP**: Protocol messages, requires MCP-specific debugging tools

### Integration
- **CLI**: Works with any language via subprocess, easy shell scripting
- **MCP**: Requires MCP client library, limited language support

### Portability
- **CLI**: Single binary/script, runs anywhere with Node.js
- **MCP**: Requires MCP server runtime, more dependencies

### Use Cases

**Use CLI when:**
- Building scripts and automation
- One-off data retrieval tasks
- Integrating with existing shell workflows
- Debugging API responses
- Human interaction needed

**Use MCP when:**
- Building persistent AI agent applications
- Need stateful server connections
- Multiple AI tools need shared context
- Protocol-level features required

## Troubleshooting

### Token Expired

```bash
# Check authentication status
nordigen auth status

# Re-login if needed
nordigen auth login --secret-id <id> --secret-key <key>
```

### Rate Limiting

If you hit rate limits, the API will return a 429 error. Wait and retry, or implement exponential backoff in your scripts.

### Account Access Errors

Ensure:
1. Valid End User Agreement exists
2. Agreement has correct access scope
3. User has completed authentication flow
4. Access period hasn't expired

## API Documentation

For complete API reference, see:
- Official Nordigen Docs: https://nordigen.com/en/docs/
- OpenAPI Spec: https://ob.nordigen.com/api/swagger/

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Lint code
npm run lint

# Make executable
chmod +x bin/nordigen.js
```

## License

MIT

## Support

- GitHub Issues: https://github.com/ktmcp/nordigen-cli/issues
- Email: support@ktmcp.com

## Related Documentation

- [AGENT.md](./AGENT.md) - AI agent integration patterns
- [OPENCLAW.md](./OPENCLAW.md) - OpenClaw integration guide
