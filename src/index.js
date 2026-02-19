import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured } from './config.js';
import {
  listInstitutions,
  getInstitution,
  listAgreements,
  getAgreement,
  createAgreement,
  deleteAgreement,
  acceptAgreement,
  listRequisitions,
  getRequisition,
  createRequisition,
  deleteRequisition,
  getAccountMetadata,
  getAccountBalances,
  getAccountDetails,
  getAccountTransactions
} from './api.js';

const program = new Command();

// ============================================================
// Helpers
// ============================================================

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printTable(data, columns) {
  if (!data || data.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }

  const widths = {};
  columns.forEach(col => {
    widths[col.key] = col.label.length;
    data.forEach(row => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      if (val.length > widths[col.key]) widths[col.key] = val.length;
    });
    widths[col.key] = Math.min(widths[col.key], 50);
  });

  const header = columns.map(col => col.label.padEnd(widths[col.key])).join('  ');
  console.log(chalk.bold(chalk.cyan(header)));
  console.log(chalk.dim('─'.repeat(header.length)));

  data.forEach(row => {
    const line = columns.map(col => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      return val.substring(0, widths[col.key]).padEnd(widths[col.key]);
    }).join('  ');
    console.log(line);
  });

  console.log(chalk.dim(`\n${data.length} result(s)`));
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function requireAuth() {
  if (!isConfigured()) {
    printError('Nordigen credentials not configured.');
    console.log('\nRun the following to configure:');
    console.log(chalk.cyan('  nordigencom config set --secret-id <id> --secret-key <key>'));
    console.log(chalk.cyan('  nordigencom auth login'));
    process.exit(1);
  }
}

// ============================================================
// Program metadata
// ============================================================

program
  .name('nordigencom')
  .description(chalk.bold('Nordigen CLI') + ' - Account Information Services from your terminal')
  .version('1.0.0');

// ============================================================
// CONFIG
// ============================================================

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--secret-id <id>', 'Nordigen Secret ID')
  .option('--secret-key <key>', 'Nordigen Secret Key')
  .action((options) => {
    if (options.secretId) {
      setConfig('secretId', options.secretId);
      printSuccess(`Secret ID set`);
    }
    if (options.secretKey) {
      setConfig('secretKey', options.secretKey);
      printSuccess(`Secret Key set`);
    }
    if (!options.secretId && !options.secretKey) {
      printError('No options provided. Use --secret-id or --secret-key');
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const secretId = getConfig('secretId');
    const secretKey = getConfig('secretKey');
    const hasToken = !!getConfig('accessToken');
    const tokenExpiry = getConfig('tokenExpiry');

    console.log(chalk.bold('\nNordigen CLI Configuration\n'));
    console.log('Secret ID:     ', secretId ? chalk.green(secretId) : chalk.red('not set'));
    console.log('Secret Key:    ', secretKey ? chalk.green('*'.repeat(8)) : chalk.red('not set'));
    console.log('Access Token:  ', hasToken ? chalk.green('set') : chalk.red('not set'));
    if (tokenExpiry) {
      const expiry = new Date(tokenExpiry);
      const isValid = tokenExpiry > Date.now();
      console.log('Token Expiry:  ', isValid ? chalk.green(expiry.toLocaleString()) : chalk.red(`expired (${expiry.toLocaleString()})`));
    }
    console.log('');
  });

// ============================================================
// AUTH
// ============================================================

const authCmd = program.command('auth').description('Manage authentication');

authCmd
  .command('login')
  .description('Authenticate with Nordigen and obtain JWT token')
  .action(async () => {
    if (!isConfigured()) {
      printError('Please configure your credentials first:');
      console.log(chalk.cyan('  nordigencom config set --secret-id <id> --secret-key <key>'));
      process.exit(1);
    }

    try {
      // Import the obtainAccessToken logic directly
      const { obtainAccessToken } = await import('./api.js');
      await withSpinner('Obtaining access token...', async () => {
        // Trigger token fetch by calling an API endpoint
        const institutions = await listInstitutions({ country: 'GB' });
        return institutions;
      });
      printSuccess('Successfully authenticated with Nordigen');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

authCmd
  .command('status')
  .description('Check authentication status')
  .action(() => {
    const hasToken = !!getConfig('accessToken');
    const tokenExpiry = getConfig('tokenExpiry');

    if (!hasToken) {
      printError('Not authenticated. Run: nordigencom auth login');
      process.exit(1);
    }

    const isValid = tokenExpiry > Date.now();
    if (isValid) {
      printSuccess('Authenticated with Nordigen');
      console.log('Token expires:', new Date(tokenExpiry).toLocaleString());
    } else {
      printError('Token expired. Run: nordigencom auth login');
      process.exit(1);
    }
  });

// ============================================================
// INSTITUTIONS
// ============================================================

const institutionsCmd = program.command('institutions').description('Manage financial institutions');

institutionsCmd
  .command('list')
  .description('List all available institutions')
  .option('--country <code>', 'Filter by country code (e.g., GB, DE, FR)')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const institutions = await withSpinner('Fetching institutions...', () =>
        listInstitutions({ country: options.country })
      );

      if (options.json) {
        printJson(institutions);
        return;
      }

      printTable(institutions, [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'bic', label: 'BIC' },
        { key: 'transaction_total_days', label: 'Transaction Days' },
        { key: 'countries', label: 'Countries', format: (v) => Array.isArray(v) ? v.join(', ') : v }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

institutionsCmd
  .command('get <institution-id>')
  .description('Get details about a specific institution')
  .option('--json', 'Output as JSON')
  .action(async (institutionId, options) => {
    requireAuth();
    try {
      const institution = await withSpinner('Fetching institution...', () => getInstitution(institutionId));

      if (options.json) {
        printJson(institution);
        return;
      }

      console.log(chalk.bold('\nInstitution Details\n'));
      console.log('ID:                   ', chalk.cyan(institution.id));
      console.log('Name:                 ', chalk.bold(institution.name));
      console.log('BIC:                  ', institution.bic || 'N/A');
      console.log('Transaction Days:     ', institution.transaction_total_days || 'N/A');
      console.log('Countries:            ', Array.isArray(institution.countries) ? institution.countries.join(', ') : 'N/A');
      console.log('Logo:                 ', institution.logo || 'N/A');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// AGREEMENTS
// ============================================================

const agreementsCmd = program.command('agreements').description('Manage end user agreements');

agreementsCmd
  .command('list')
  .description('List all agreements')
  .option('--limit <n>', 'Maximum number of results', '100')
  .option('--offset <n>', 'Offset for pagination', '0')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const agreements = await withSpinner('Fetching agreements...', () =>
        listAgreements({ limit: parseInt(options.limit), offset: parseInt(options.offset) })
      );

      if (options.json) {
        printJson(agreements);
        return;
      }

      printTable(agreements, [
        { key: 'id', label: 'ID', format: (v) => v?.substring(0, 8) + '...' },
        { key: 'institution_id', label: 'Institution' },
        { key: 'created', label: 'Created', format: (v) => v ? new Date(v).toLocaleDateString() : '' },
        { key: 'max_historical_days', label: 'Historical Days' },
        { key: 'access_valid_for_days', label: 'Valid For Days' },
        { key: 'accepted', label: 'Accepted', format: (v) => v ? new Date(v).toLocaleDateString() : 'No' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

agreementsCmd
  .command('get <agreement-id>')
  .description('Get a specific agreement')
  .option('--json', 'Output as JSON')
  .action(async (agreementId, options) => {
    requireAuth();
    try {
      const agreement = await withSpinner('Fetching agreement...', () => getAgreement(agreementId));

      if (options.json) {
        printJson(agreement);
        return;
      }

      console.log(chalk.bold('\nAgreement Details\n'));
      console.log('ID:                   ', chalk.cyan(agreement.id));
      console.log('Institution ID:       ', agreement.institution_id);
      console.log('Created:              ', new Date(agreement.created).toLocaleString());
      console.log('Max Historical Days:  ', agreement.max_historical_days);
      console.log('Valid For Days:       ', agreement.access_valid_for_days);
      console.log('Accepted:             ', agreement.accepted ? new Date(agreement.accepted).toLocaleString() : chalk.yellow('Not accepted'));
      console.log('Access Scope:         ', Array.isArray(agreement.access_scope) ? agreement.access_scope.join(', ') : 'All');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

agreementsCmd
  .command('create')
  .description('Create a new end user agreement')
  .requiredOption('--institution-id <id>', 'Institution ID')
  .option('--max-historical-days <n>', 'Maximum historical days', '90')
  .option('--access-valid-for-days <n>', 'Access valid for days', '90')
  .option('--access-scope <scopes>', 'Comma-separated access scopes (balances,details,transactions)')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    const accessScope = options.accessScope ? options.accessScope.split(',') : [];

    try {
      const agreement = await withSpinner('Creating agreement...', () =>
        createAgreement({
          institutionId: options.institutionId,
          maxHistoricalDays: parseInt(options.maxHistoricalDays),
          accessValidForDays: parseInt(options.accessValidForDays),
          accessScope
        })
      );

      if (options.json) {
        printJson(agreement);
        return;
      }

      printSuccess(`Agreement created: ${chalk.bold(agreement.id)}`);
      console.log('Institution ID:', agreement.institution_id);
      console.log('Created:       ', new Date(agreement.created).toLocaleString());
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

agreementsCmd
  .command('delete <agreement-id>')
  .description('Delete an agreement')
  .action(async (agreementId) => {
    requireAuth();
    try {
      await withSpinner('Deleting agreement...', () => deleteAgreement(agreementId));
      printSuccess(`Agreement ${agreementId} deleted`);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// REQUISITIONS
// ============================================================

const requisitionsCmd = program.command('requisitions').description('Manage requisitions (bank connections)');

requisitionsCmd
  .command('list')
  .description('List all requisitions')
  .option('--limit <n>', 'Maximum number of results', '100')
  .option('--offset <n>', 'Offset for pagination', '0')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const requisitions = await withSpinner('Fetching requisitions...', () =>
        listRequisitions({ limit: parseInt(options.limit), offset: parseInt(options.offset) })
      );

      if (options.json) {
        printJson(requisitions);
        return;
      }

      printTable(requisitions, [
        { key: 'id', label: 'ID', format: (v) => v?.substring(0, 8) + '...' },
        { key: 'reference', label: 'Reference' },
        { key: 'status', label: 'Status' },
        { key: 'institution_id', label: 'Institution' },
        { key: 'created', label: 'Created', format: (v) => v ? new Date(v).toLocaleDateString() : '' },
        { key: 'accounts', label: 'Accounts', format: (v) => Array.isArray(v) ? v.length : 0 }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

requisitionsCmd
  .command('get <requisition-id>')
  .description('Get a specific requisition')
  .option('--json', 'Output as JSON')
  .action(async (requisitionId, options) => {
    requireAuth();
    try {
      const requisition = await withSpinner('Fetching requisition...', () => getRequisition(requisitionId));

      if (options.json) {
        printJson(requisition);
        return;
      }

      console.log(chalk.bold('\nRequisition Details\n'));
      console.log('ID:            ', chalk.cyan(requisition.id));
      console.log('Reference:     ', requisition.reference);
      console.log('Status:        ', chalk.bold(requisition.status));
      console.log('Institution:   ', requisition.institution_id);
      console.log('Created:       ', new Date(requisition.created).toLocaleString());
      console.log('Link:          ', requisition.link || 'N/A');
      console.log('Accounts:      ', Array.isArray(requisition.accounts) ? requisition.accounts.join(', ') : 'None');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

requisitionsCmd
  .command('create')
  .description('Create a new requisition')
  .requiredOption('--institution-id <id>', 'Institution ID')
  .requiredOption('--redirect <url>', 'Redirect URL after authentication')
  .requiredOption('--reference <ref>', 'Unique reference for this requisition')
  .option('--agreement-id <id>', 'End user agreement ID')
  .option('--user-language <lang>', 'User language (EN, DE, FR, etc.)', 'EN')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const requisition = await withSpinner('Creating requisition...', () =>
        createRequisition({
          institutionId: options.institutionId,
          redirect: options.redirect,
          reference: options.reference,
          agreementId: options.agreementId,
          userLanguage: options.userLanguage
        })
      );

      if (options.json) {
        printJson(requisition);
        return;
      }

      printSuccess(`Requisition created: ${chalk.bold(requisition.id)}`);
      console.log('Reference:  ', requisition.reference);
      console.log('Status:     ', requisition.status);
      console.log('Link:       ', chalk.cyan(requisition.link));
      console.log('\nSend this link to the user to authorize bank access.');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

requisitionsCmd
  .command('delete <requisition-id>')
  .description('Delete a requisition')
  .action(async (requisitionId) => {
    requireAuth();
    try {
      await withSpinner('Deleting requisition...', () => deleteRequisition(requisitionId));
      printSuccess(`Requisition ${requisitionId} deleted`);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// ACCOUNTS
// ============================================================

const accountsCmd = program.command('accounts').description('Access account information');

accountsCmd
  .command('get <account-id>')
  .description('Get account metadata')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    requireAuth();
    try {
      const account = await withSpinner('Fetching account metadata...', () => getAccountMetadata(accountId));

      if (options.json) {
        printJson(account);
        return;
      }

      console.log(chalk.bold('\nAccount Metadata\n'));
      console.log('Account ID:    ', chalk.cyan(account.id));
      console.log('IBAN:          ', account.iban || 'N/A');
      console.log('Institution:   ', account.institution_id);
      console.log('Created:       ', new Date(account.created).toLocaleString());
      console.log('Status:        ', account.status);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

accountsCmd
  .command('balances <account-id>')
  .description('Get account balances')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    requireAuth();
    try {
      const data = await withSpinner('Fetching balances...', () => getAccountBalances(accountId));

      if (options.json) {
        printJson(data);
        return;
      }

      const balances = data.balances || [];
      if (balances.length === 0) {
        console.log(chalk.yellow('No balances found.'));
        return;
      }

      console.log(chalk.bold('\nAccount Balances\n'));
      balances.forEach(balance => {
        console.log(`${balance.balanceType || 'Balance'}:`);
        console.log(`  Amount:   ${balance.balanceAmount?.amount} ${balance.balanceAmount?.currency}`);
        console.log(`  Date:     ${balance.referenceDate || 'N/A'}`);
        console.log('');
      });
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

accountsCmd
  .command('details <account-id>')
  .description('Get account details')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    requireAuth();
    try {
      const data = await withSpinner('Fetching account details...', () => getAccountDetails(accountId));

      if (options.json) {
        printJson(data);
        return;
      }

      const account = data.account || {};
      console.log(chalk.bold('\nAccount Details\n'));
      console.log('IBAN:          ', account.iban || 'N/A');
      console.log('Name:          ', account.name || 'N/A');
      console.log('Currency:      ', account.currency || 'N/A');
      console.log('Owner Name:    ', account.ownerName || 'N/A');
      console.log('Product:       ', account.product || 'N/A');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

accountsCmd
  .command('transactions <account-id>')
  .description('Get account transactions')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    requireAuth();
    try {
      const data = await withSpinner('Fetching transactions...', () => getAccountTransactions(accountId));

      if (options.json) {
        printJson(data);
        return;
      }

      const transactions = data.transactions?.booked || [];
      if (transactions.length === 0) {
        console.log(chalk.yellow('No transactions found.'));
        return;
      }

      printTable(transactions, [
        { key: 'transactionId', label: 'Transaction ID', format: (v) => v?.substring(0, 12) + '...' },
        { key: 'bookingDate', label: 'Date' },
        { key: 'transactionAmount', label: 'Amount', format: (v) => `${v?.amount} ${v?.currency}` },
        { key: 'creditorName', label: 'Creditor', format: (v) => v || 'N/A' },
        { key: 'debtorName', label: 'Debtor', format: (v) => v || 'N/A' },
        { key: 'remittanceInformationUnstructured', label: 'Description', format: (v) => v?.substring(0, 30) || 'N/A' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// Parse
// ============================================================

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
