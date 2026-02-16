# Nordigen CLI - AI Agent Integration Guide

This guide shows how AI agents can effectively use the Nordigen CLI to access open banking data.

## Agent Capabilities

The Nordigen CLI enables AI agents to:

1. Browse and search financial institutions across Europe
2. Create and manage end user agreements
3. Initiate bank account connections
4. Retrieve account balances and details
5. Fetch and analyze transaction history
6. Process payment information

## Basic Agent Patterns

### Pattern 1: Institution Discovery

```javascript
// Agent discovers banks in a specific country
async function findInstitutions(country, query = null) {
  if (query) {
    // Search for specific institution
    const result = await exec(`nordigen institutions search "${query}" --country ${country} --json`);
    return JSON.parse(result.stdout);
  } else {
    // List all institutions
    const result = await exec(`nordigen institutions list --country ${country} --json`);
    return JSON.parse(result.stdout);
  }
}

// Usage
const banks = await findInstitutions('GB', 'Barclays');
```

### Pattern 2: Account Connection Flow

```javascript
// Agent guides user through bank connection
async function connectBankAccount(institutionId, redirectUrl) {
  // 1. Create end user agreement
  const agreementCmd = `nordigen agreements create --institution-id ${institutionId} --max-days 90 --json`;
  const agreement = JSON.parse((await exec(agreementCmd)).stdout);

  // 2. Create requisition
  const reqCmd = `nordigen requisitions create --institution-id ${institutionId} --redirect ${redirectUrl} --agreement ${agreement.id} --json`;
  const requisition = JSON.parse((await exec(reqCmd)).stdout);

  // 3. Return authentication link for user
  return {
    requisitionId: requisition.id,
    authLink: requisition.link,
    status: requisition.status
  };
}
```

### Pattern 3: Transaction Analysis

```javascript
// Agent retrieves and analyzes transactions
async function analyzeTransactions(accountId, dateFrom, dateTo) {
  const cmd = `nordigen accounts transactions ${accountId} --from ${dateFrom} --to ${dateTo} --json`;
  const result = await exec(cmd);
  const data = JSON.parse(result.stdout);

  const transactions = data.transactions.booked || [];

  // Analyze spending patterns
  const analysis = {
    totalSpent: 0,
    totalIncome: 0,
    categories: {},
    transactionCount: transactions.length
  };

  transactions.forEach(tx => {
    const amount = parseFloat(tx.transactionAmount.amount);
    if (amount < 0) {
      analysis.totalSpent += Math.abs(amount);
    } else {
      analysis.totalIncome += amount;
    }
  });

  return analysis;
}
```

### Pattern 4: Multi-Account Balance Check

```javascript
// Agent checks balances across multiple accounts
async function checkAllBalances(accountIds) {
  const balances = await Promise.all(
    accountIds.map(async (accountId) => {
      try {
        const cmd = `nordigen accounts balances ${accountId} --json`;
        const result = await exec(cmd);
        const data = JSON.parse(result.stdout);

        return {
          accountId,
          balances: data.balances,
          success: true
        };
      } catch (error) {
        return {
          accountId,
          error: error.message,
          success: false
        };
      }
    })
  );

  return balances;
}
```

## Advanced Agent Workflows

### Workflow 1: Automated Financial Health Check

```javascript
async function financialHealthCheck(userId) {
  // 1. Get all user's requisitions
  const reqList = await exec('nordigen requisitions list --json');
  const requisitions = JSON.parse(reqList.stdout).results;

  // 2. Extract all account IDs
  const accountIds = requisitions.flatMap(req => req.accounts);

  // 3. Check balances
  const balances = await checkAllBalances(accountIds);

  // 4. Get recent transactions (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  const transactionAnalysis = await Promise.all(
    accountIds.map(id => analyzeTransactions(id, thirtyDaysAgo, today))
  );

  // 5. Generate report
  return {
    totalAccounts: accountIds.length,
    totalBalance: balances.reduce((sum, b) => {
      const balance = b.balances?.find(bal => bal.balanceType === 'expected')?.balanceAmount?.amount || 0;
      return sum + parseFloat(balance);
    }, 0),
    monthlySpending: transactionAnalysis.reduce((sum, a) => sum + a.totalSpent, 0),
    monthlyIncome: transactionAnalysis.reduce((sum, a) => sum + a.totalIncome, 0)
  };
}
```

### Workflow 2: Smart Institution Recommendation

```javascript
async function recommendInstitution(country, requirements) {
  // Get all institutions
  const cmd = `nordigen institutions list --country ${country} --json`;
  const institutions = JSON.parse((await exec(cmd)).stdout);

  // Score institutions based on requirements
  const scored = institutions.map(inst => {
    let score = 0;

    // Prefer institutions with longer transaction history
    if (inst.transaction_total_days >= 730) score += 3;
    else if (inst.transaction_total_days >= 365) score += 2;
    else if (inst.transaction_total_days >= 90) score += 1;

    // Check payment support if required
    if (requirements.payments && inst.payments_enabled) score += 2;

    // Check account selection if required
    if (requirements.accountSelection && inst.account_selection_supported) score += 1;

    return { ...inst, score };
  });

  // Sort by score and return top recommendations
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
```

### Workflow 3: Transaction Categorization

```javascript
async function categorizeTransactions(accountId, dateFrom, dateTo) {
  const cmd = `nordigen accounts transactions ${accountId} --from ${dateFrom} --to ${dateTo} --json`;
  const result = await exec(cmd);
  const data = JSON.parse(result.stdout);

  const transactions = data.transactions.booked || [];

  // Simple rule-based categorization
  const categories = {
    groceries: /tesco|sainsbury|asda|morrisons|aldi|lidl/i,
    transport: /uber|lyft|tfl|national rail|trainline/i,
    utilities: /electricity|gas|water|internet|broadband/i,
    entertainment: /netflix|spotify|amazon prime|cinema/i,
    restaurants: /restaurant|cafe|pizza|burger|mcdonald/i
  };

  const categorized = transactions.map(tx => {
    const description = tx.remittanceInformationUnstructured || '';
    let category = 'other';

    for (const [cat, pattern] of Object.entries(categories)) {
      if (pattern.test(description)) {
        category = cat;
        break;
      }
    }

    return {
      ...tx,
      category,
      amount: parseFloat(tx.transactionAmount.amount)
    };
  });

  // Summarize by category
  const summary = {};
  categorized.forEach(tx => {
    if (!summary[tx.category]) {
      summary[tx.category] = { count: 0, total: 0 };
    }
    summary[tx.category].count++;
    summary[tx.category].total += Math.abs(tx.amount);
  });

  return { transactions: categorized, summary };
}
```

## Natural Language Interface

### Example: Agent Conversation Flow

```
User: "Connect my Barclays account"

Agent Analysis:
1. User wants to connect a bank account
2. Bank name: "Barclays"
3. Need to determine country (ask or infer from context)

Agent Response:
"I'll help you connect your Barclays account. Which country is your Barclays account in? (UK, Germany, etc.)"

User: "UK"

Agent Actions:
1. nordigen institutions search "Barclays" --country GB --json
2. Select appropriate institution ID
3. nordigen agreements create --institution-id BARCLAYS_BARCGB22 --max-days 90 --json
4. nordigen requisitions create --institution-id BARCLAYS_BARCGB22 --redirect https://app.example.com/callback --agreement <ID> --json

Agent Response:
"I've created a secure connection request. Please visit this link to authorize access to your Barclays account: [AUTH_LINK]"
```

### Example: Transaction Query

```
User: "How much did I spend on groceries last month?"

Agent Actions:
1. Calculate date range (last month)
2. Get user's account IDs from stored requisitions
3. For each account:
   - nordigen accounts transactions <ID> --from 2024-01-01 --to 2024-01-31 --json
4. Categorize transactions
5. Sum amounts in "groceries" category

Agent Response:
"You spent £342.67 on groceries last month across 23 transactions. The main stores were Tesco (£178.42), Sainsbury's (£121.30), and Aldi (£42.95)."
```

## Error Handling for Agents

```javascript
async function safeExecute(command) {
  try {
    const result = await exec(command);
    return { success: true, data: JSON.parse(result.stdout) };
  } catch (error) {
    // Parse error message
    const errorData = {
      success: false,
      command: command,
      exitCode: error.code
    };

    // Check for common errors
    if (error.stderr.includes('Not authenticated')) {
      errorData.type = 'AUTH_REQUIRED';
      errorData.message = 'User needs to authenticate first';
      errorData.action = 'Please run: nordigen auth login --secret-id <id> --secret-key <key>';
    } else if (error.stderr.includes('Token is invalid or expired')) {
      errorData.type = 'TOKEN_EXPIRED';
      errorData.message = 'Authentication token expired';
      errorData.action = 'Re-authenticating automatically...';
    } else if (error.stderr.includes('Rate limit')) {
      errorData.type = 'RATE_LIMIT';
      errorData.message = 'API rate limit exceeded';
      errorData.action = 'Waiting before retry...';
    } else {
      errorData.type = 'UNKNOWN';
      errorData.message = error.stderr;
    }

    return errorData;
  }
}
```

## Security Best Practices

1. **Never log sensitive data**: Avoid logging full API responses that may contain IBANs or account details
2. **Use environment variables**: Store credentials in env vars, not code
3. **Implement access controls**: Ensure agents can only access data for authorized users
4. **Audit agent actions**: Log all CLI commands executed by agents
5. **Time-limited access**: Regularly refresh agreements with minimal access duration

## Agent State Management

```javascript
class NordigenAgent {
  constructor(userId) {
    this.userId = userId;
    this.state = {
      authenticated: false,
      activeRequisitions: [],
      accountIds: [],
      lastSync: null
    };
  }

  async initialize() {
    // Check authentication
    const authStatus = await exec('nordigen auth status --json');
    this.state.authenticated = JSON.parse(authStatus.stdout).authenticated;

    if (this.state.authenticated) {
      await this.syncRequisitions();
    }
  }

  async syncRequisitions() {
    const result = await exec('nordigen requisitions list --json');
    const data = JSON.parse(result.stdout);
    this.state.activeRequisitions = data.results;
    this.state.accountIds = data.results.flatMap(r => r.accounts);
    this.state.lastSync = new Date().toISOString();
  }

  async handleQuery(userInput) {
    // Parse user intent
    const intent = this.parseIntent(userInput);

    switch (intent.type) {
      case 'GET_BALANCE':
        return await this.getBalances();
      case 'GET_TRANSACTIONS':
        return await this.getTransactions(intent.params);
      case 'CONNECT_ACCOUNT':
        return await this.connectAccount(intent.params);
      default:
        return { error: 'Unknown intent' };
    }
  }
}
```

## Performance Optimization

1. **Cache institution lists**: Store institution data locally, refresh periodically
2. **Batch operations**: Use Promise.all() for parallel account queries
3. **Pagination**: Use --limit and --offset for large result sets
4. **Conditional fetching**: Only fetch data when needed, not proactively

## Testing Agent Integration

```javascript
// Mock CLI responses for testing
const mockCLI = {
  'nordigen auth status': { authenticated: true },
  'nordigen institutions list --country GB --json': [
    { id: 'BARCLAYS_BARCGB22', name: 'Barclays' }
  ]
};

async function testAgentFlow() {
  // Test institution discovery
  const banks = await findInstitutions('GB', 'Barclays');
  assert(banks.length > 0);

  // Test error handling
  const result = await safeExecute('nordigen accounts get invalid-id --json');
  assert(result.success === false);

  // Test transaction analysis
  const analysis = await analyzeTransactions('test-account', '2024-01-01', '2024-01-31');
  assert(analysis.transactionCount >= 0);
}
```

## Example: Claude/GPT Integration

```python
import subprocess
import json

def run_nordigen_command(command):
    """Execute Nordigen CLI command and return JSON output."""
    result = subprocess.run(
        command,
        shell=True,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        raise Exception(f"Command failed: {result.stderr}")

    return json.loads(result.stdout)

# Agent function
def get_account_summary(account_id):
    """Get comprehensive account summary."""

    # Get balances
    balances = run_nordigen_command(
        f"nordigen accounts balances {account_id} --json"
    )

    # Get transactions (last 30 days)
    from datetime import datetime, timedelta
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

    transactions = run_nordigen_command(
        f"nordigen accounts transactions {account_id} --from {start_date} --to {end_date} --json"
    )

    # Format for LLM context
    return {
        "account_id": account_id,
        "balances": balances["balances"],
        "recent_transactions": len(transactions["transactions"]["booked"]),
        "transaction_data": transactions
    }

# Use in prompt
account_summary = get_account_summary("abc-123")
prompt = f"""
Analyze this bank account and provide insights:

{json.dumps(account_summary, indent=2)}

Please provide:
1. Current financial position
2. Spending patterns
3. Recommendations
"""
```

## Conclusion

The Nordigen CLI provides a powerful, simple interface for AI agents to interact with open banking APIs. By following these patterns and best practices, agents can provide sophisticated financial analysis and account management capabilities.
