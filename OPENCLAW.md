# Nordigen CLI - OpenClaw Integration Guide

Integration guide for using the Nordigen CLI with OpenClaw (the open-source MCP alternative for Claude).

## What is OpenClaw?

OpenClaw is a lightweight, open-source protocol for integrating tools with Claude and other AI assistants. Unlike MCP (Model Context Protocol), OpenClaw emphasizes:

- Simplicity over complexity
- CLI-first design
- Zero protocol overhead
- Direct tool invocation

## Why Nordigen CLI + OpenClaw?

The Nordigen CLI is designed to work seamlessly with OpenClaw because:

1. **Native CLI interface** - No protocol translation needed
2. **JSON output** - All commands support `--json` for structured data
3. **Consistent error handling** - Exit codes and stderr for errors
4. **Composable commands** - UNIX philosophy for piping and chaining
5. **Stateless by default** - Each command is independent

## OpenClaw Tool Definition

Create a tool definition for OpenClaw to expose Nordigen CLI capabilities:

```yaml
# openclaw-tools/nordigen.yaml
name: nordigen
description: Access open banking data via Nordigen API
version: 1.0.0

tools:
  - name: list_institutions
    description: List supported financial institutions
    command: nordigen institutions list --country {country} --json
    parameters:
      - name: country
        type: string
        required: true
        description: ISO 3166 country code (GB, DE, FR, etc.)
      - name: payments
        type: boolean
        required: false
        description: Filter institutions supporting payments
    output: json

  - name: search_institutions
    description: Search for institutions by name
    command: nordigen institutions search "{query}" --country {country} --json
    parameters:
      - name: query
        type: string
        required: true
        description: Search query
      - name: country
        type: string
        required: true
        description: ISO 3166 country code

  - name: get_account_balances
    description: Get account balances
    command: nordigen accounts balances {account_id} --json
    parameters:
      - name: account_id
        type: string
        required: true
        description: Account UUID

  - name: get_account_transactions
    description: Get account transactions
    command: nordigen accounts transactions {account_id} --from {date_from} --to {date_to} --json
    parameters:
      - name: account_id
        type: string
        required: true
        description: Account UUID
      - name: date_from
        type: string
        required: false
        description: Start date (YYYY-MM-DD)
      - name: date_to
        type: string
        required: false
        description: End date (YYYY-MM-DD)

  - name: create_requisition
    description: Create bank account connection requisition
    command: nordigen requisitions create --institution-id {institution_id} --redirect {redirect_url} --json
    parameters:
      - name: institution_id
        type: string
        required: true
        description: Institution ID
      - name: redirect_url
        type: string
        required: true
        description: Redirect URL after authentication

  - name: list_requisitions
    description: List all requisitions
    command: nordigen requisitions list --json

  - name: get_requisition
    description: Get requisition details
    command: nordigen requisitions get {requisition_id} --json
    parameters:
      - name: requisition_id
        type: string
        required: true
        description: Requisition UUID
```

## Usage with Claude

### Example 1: Finding a Bank

```
User: "Find banks in Germany that support payments"

Claude (using OpenClaw):
<tool_use>
  <tool>nordigen.list_institutions</tool>
  <parameters>
    <country>DE</country>
    <payments>true</payments>
  </parameters>
</tool_use>

[Tool returns JSON list of German banks with payment support]

Claude response:
"I found 47 banks in Germany that support payments. The most popular ones include:
1. Deutsche Bank (DEUTSCHE_DEUTDEFF)
2. Commerzbank (COMMERZBANK_COBADEFF)
3. N26 (N26_NTSBDEB1)
..."
```

### Example 2: Analyzing Transactions

```
User: "Show me my spending on restaurants last month"

Claude (using OpenClaw):
<tool_use>
  <tool>nordigen.get_account_transactions</tool>
  <parameters>
    <account_id>abc-123-def-456</account_id>
    <date_from>2024-01-01</date_from>
    <date_to>2024-01-31</date_to>
  </parameters>
</tool_use>

[Tool returns transaction JSON]

Claude analyzes and responds:
"Based on your January transactions, you spent £287.50 at restaurants:
- Pizza Express: £42.50 (Jan 5)
- Nando's: £38.20 (Jan 12)
- Local Italian: £67.80 (Jan 18)
..."
```

## Advanced OpenClaw Patterns

### Pattern 1: Composite Tools

Create higher-level tools that combine multiple CLI commands:

```yaml
# openclaw-tools/nordigen-advanced.yaml
tools:
  - name: complete_bank_connection
    description: Complete flow to connect a bank account
    type: composite
    steps:
      - tool: nordigen.search_institutions
        save_as: institutions
      - tool: nordigen.create_agreement
        params:
          institution_id: "{institutions[0].id}"
        save_as: agreement
      - tool: nordigen.create_requisition
        params:
          institution_id: "{institutions[0].id}"
          agreement: "{agreement.id}"

  - name: financial_health_check
    description: Complete financial health analysis
    type: composite
    steps:
      - tool: nordigen.list_requisitions
        save_as: reqs
      - tool: nordigen.get_account_balances
        for_each: "{reqs.results[].accounts[]}"
        save_as: balances
      - tool: nordigen.get_account_transactions
        for_each: "{reqs.results[].accounts[]}"
        params:
          date_from: "-30d"  # Special syntax for relative dates
        save_as: transactions
```

### Pattern 2: Cached Responses

```yaml
tools:
  - name: list_institutions
    command: nordigen institutions list --country {country} --json
    cache:
      ttl: 86400  # 24 hours
      key: "institutions:{country}"
      # Institution lists rarely change, safe to cache
```

### Pattern 3: Error Recovery

```yaml
tools:
  - name: get_account_balances
    command: nordigen accounts balances {account_id} --json
    error_handling:
      - on: "Not authenticated"
        retry_with: nordigen auth login --secret-id $NORDIGEN_SECRET_ID --secret-key $NORDIGEN_SECRET_KEY
      - on: "Token is invalid or expired"
        retry_with: nordigen auth status && nordigen accounts balances {account_id} --json
```

## OpenClaw Server Setup

If you want to run Nordigen CLI as an OpenClaw server:

```javascript
// openclaw-server.js
import { spawn } from 'child_process';
import express from 'express';

const app = express();
app.use(express.json());

app.post('/tools/nordigen/:command', async (req, res) => {
  const { command } = req.params;
  const { params } = req.body;

  // Build CLI command
  let cmd = `nordigen ${command}`;

  // Add parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'boolean' && value) {
        cmd += ` --${key}`;
      } else if (value) {
        cmd += ` --${key} ${JSON.stringify(value)}`;
      }
    });
  }

  cmd += ' --json';

  // Execute
  const child = spawn('sh', ['-c', cmd]);
  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (data) => { stdout += data; });
  child.stderr.on('data', (data) => { stderr += data; });

  child.on('close', (code) => {
    if (code === 0) {
      res.json({ success: true, data: JSON.parse(stdout) });
    } else {
      res.status(500).json({ success: false, error: stderr });
    }
  });
});

app.listen(3000, () => {
  console.log('OpenClaw Nordigen server running on port 3000');
});
```

Run the server:

```bash
node openclaw-server.js
```

Now Claude can call:

```http
POST /tools/nordigen/institutions
{
  "params": {
    "command": "list",
    "country": "GB"
  }
}
```

## Environment Configuration

OpenClaw can manage Nordigen CLI configuration via environment:

```bash
# .env
NORDIGEN_SECRET_ID=your_secret_id
NORDIGEN_SECRET_KEY=your_secret_key
NORDIGEN_DEFAULT_COUNTRY=GB
```

Update tool definitions to use env vars:

```yaml
tools:
  - name: auto_auth
    description: Automatically authenticate if needed
    command: |
      if ! nordigen auth status 2>/dev/null; then
        nordigen auth login \
          --secret-id $NORDIGEN_SECRET_ID \
          --secret-key $NORDIGEN_SECRET_KEY
      fi
```

## Security Considerations

### 1. Credential Isolation

Use separate config profiles for different Claude contexts:

```yaml
tools:
  - name: list_institutions_user
    command: XDG_CONFIG_HOME=/home/user/.config-{user_id} nordigen institutions list --country {country} --json
```

### 2. Rate Limiting

Implement rate limiting at the OpenClaw level:

```yaml
tools:
  - name: get_account_transactions
    command: nordigen accounts transactions {account_id} --json
    rate_limit:
      max_calls: 10
      per_seconds: 60
```

### 3. Access Control

Restrict which commands Claude can execute:

```yaml
# Only allow read operations
allowed_commands:
  - nordigen institutions list
  - nordigen institutions search
  - nordigen institutions get
  - nordigen accounts get
  - nordigen accounts balances
  - nordigen accounts transactions
  - nordigen requisitions list
  - nordigen requisitions get

# Deny destructive operations
denied_commands:
  - nordigen requisitions delete
  - nordigen agreements delete
  - nordigen auth logout
  - nordigen config clear
```

## Monitoring and Logging

### Command Logging

```javascript
// Log all CLI commands executed by Claude
function logCommand(command, user, timestamp) {
  const log = {
    timestamp,
    user,
    command,
    tool: 'nordigen'
  };

  fs.appendFileSync('openclaw-audit.log', JSON.stringify(log) + '\n');
}
```

### Performance Metrics

```javascript
// Track command execution time
async function executeWithMetrics(command) {
  const start = Date.now();

  try {
    const result = await exec(command);
    const duration = Date.now() - start;

    metrics.record('nordigen.command.success', duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    metrics.record('nordigen.command.error', duration);
    throw error;
  }
}
```

## Testing OpenClaw Integration

```javascript
// test-openclaw.js
import { execSync } from 'child_process';

function testTool(toolName, params) {
  const command = buildCommand(toolName, params);
  console.log(`Testing: ${command}`);

  try {
    const result = execSync(command, { encoding: 'utf-8' });
    const data = JSON.parse(result);
    console.log('✓ Success:', data);
    return { success: true, data };
  } catch (error) {
    console.log('✗ Failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run tests
testTool('list_institutions', { country: 'GB' });
testTool('search_institutions', { query: 'Barclays', country: 'GB' });
```

## Best Practices

1. **Always use --json flag**: Ensures structured output for parsing
2. **Handle errors gracefully**: Check exit codes and parse stderr
3. **Cache institution lists**: They change infrequently
4. **Use environment variables**: For credentials and defaults
5. **Implement timeouts**: Prevent hanging on slow API calls
6. **Log all operations**: For audit and debugging
7. **Validate inputs**: Before passing to CLI commands

## Comparison: CLI + OpenClaw vs MCP

| Aspect | CLI + OpenClaw | MCP |
|--------|----------------|-----|
| Setup | Install CLI, define YAML | Implement MCP protocol |
| Latency | ~50ms | ~200ms (protocol overhead) |
| Debugging | Standard tools (strace, etc.) | MCP-specific tools |
| Language Support | Any (subprocess) | Limited to MCP clients |
| State Management | Stateless (file-based config) | Stateful server |
| Resource Usage | Minimal | Higher (persistent server) |
| Learning Curve | Low (standard CLI) | Higher (new protocol) |

## Conclusion

The Nordigen CLI + OpenClaw integration provides a simple, performant, and flexible way to give Claude access to open banking data. By leveraging standard CLI patterns and JSON output, you avoid protocol complexity while maintaining full functionality.

For most use cases, this approach is simpler and more maintainable than MCP, while providing equivalent or better performance.
