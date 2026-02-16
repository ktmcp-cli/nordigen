/**
 * Account Commands
 *
 * @fileoverview Commands for managing and retrieving account data
 * @module commands/accounts
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { createClient } from '../lib/api.js';
import { ensureAuth } from '../lib/auth.js';
import {
  printJSON,
  printSuccess,
  printError,
  printSection,
  printRow,
  printAccountSummary,
  printTransaction,
  formatCurrency,
  formatDateString,
  formatStatus,
} from '../lib/output.js';

export const accountsCommand = new Command('accounts')
  .description('Account information and data retrieval')
  .alias('acc');

// Get account metadata
accountsCommand
  .command('get')
  .description('Get account metadata')
  .argument('<account-id>', 'Account UUID')
  .option('-j, --json', 'Output as JSON')
  .action(async (accountId, options) => {
    const spinner = ora('Fetching account...').start();

    try {
      await ensureAuth();
      const api = createClient();
      const account = await api.getAccount(accountId);

      spinner.succeed('Account retrieved');

      if (options.json) {
        printJSON(account);
      } else {
        printAccountSummary(account);
      }
    } catch (error) {
      spinner.fail('Failed to fetch account');
      printError(error.message, error);
      process.exit(1);
    }
  });

// Get account balances
accountsCommand
  .command('balances')
  .description('Get account balances')
  .argument('<account-id>', 'Account UUID')
  .option('-j, --json', 'Output as JSON')
  .action(async (accountId, options) => {
    const spinner = ora('Fetching balances...').start();

    try {
      await ensureAuth();
      const api = createClient();
      const data = await api.getAccountBalances(accountId);

      spinner.succeed('Balances retrieved');

      if (options.json) {
        printJSON(data);
      } else {
        printSection('Account Balances');

        if (data.balances && data.balances.length > 0) {
          data.balances.forEach((balance) => {
            const amount = balance.balanceAmount || {};
            const type = balance.balanceType || 'N/A';
            console.log(
              chalk.cyan(type.padEnd(20)),
              formatCurrency(amount.amount, amount.currency),
              balance.referenceDate ? chalk.gray(`(${formatDateString(balance.referenceDate)})`) : ''
            );
          });
        } else {
          console.log(chalk.yellow('No balance information available'));
        }
      }
    } catch (error) {
      spinner.fail('Failed to fetch balances');
      printError(error.message, error);
      process.exit(1);
    }
  });

// Get account details
accountsCommand
  .command('details')
  .description('Get account details')
  .argument('<account-id>', 'Account UUID')
  .option('-j, --json', 'Output as JSON')
  .action(async (accountId, options) => {
    const spinner = ora('Fetching account details...').start();

    try {
      await ensureAuth();
      const api = createClient();
      const data = await api.getAccountDetails(accountId);

      spinner.succeed('Account details retrieved');

      if (options.json) {
        printJSON(data);
      } else {
        printSection('Account Details');

        const account = data.account || {};
        if (account.iban) printRow('IBAN', account.iban);
        if (account.bban) printRow('BBAN', account.bban);
        if (account.name) printRow('Name', account.name);
        if (account.product) printRow('Product', account.product);
        if (account.cashAccountType) printRow('Type', account.cashAccountType);
        if (account.currency) printRow('Currency', account.currency);
        if (account.ownerName) printRow('Owner', account.ownerName);
      }
    } catch (error) {
      spinner.fail('Failed to fetch account details');
      printError(error.message, error);
      process.exit(1);
    }
  });

// Get account transactions
accountsCommand
  .command('transactions')
  .description('Get account transactions')
  .argument('<account-id>', 'Account UUID')
  .option('--from <date>', 'Start date (YYYY-MM-DD)')
  .option('--to <date>', 'End date (YYYY-MM-DD)')
  .option('--premium', 'Use premium endpoint')
  .option('--country <code>', 'Country code (required for premium)')
  .option('-j, --json', 'Output as JSON')
  .action(async (accountId, options) => {
    const spinner = ora('Fetching transactions...').start();

    try {
      await ensureAuth();
      const api = createClient();

      const params = {};
      if (options.from) params.date_from = options.from;
      if (options.to) params.date_to = options.to;

      let data;
      if (options.premium) {
        if (!options.country) {
          spinner.fail('Country code required for premium transactions');
          printError('Use --country <code> to specify country');
          process.exit(1);
        }
        data = await api.getPremiumTransactions(accountId, options.country, params);
      } else {
        data = await api.getAccountTransactions(accountId, params);
      }

      spinner.succeed('Transactions retrieved');

      if (options.json) {
        printJSON(data);
      } else {
        printSection('Transactions');

        const transactions = data.transactions?.booked || [];
        const pending = data.transactions?.pending || [];

        if (transactions.length > 0) {
          console.log(chalk.bold('Booked Transactions:'));
          console.log();
          transactions.forEach((tx) => printTransaction(tx));
        }

        if (pending.length > 0) {
          console.log();
          console.log(chalk.bold('Pending Transactions:'));
          console.log();
          pending.forEach((tx) => printTransaction(tx));
        }

        if (transactions.length === 0 && pending.length === 0) {
          console.log(chalk.yellow('No transactions found'));
        }

        console.log();
        console.log(chalk.gray(`Total: ${transactions.length} booked, ${pending.length} pending`));
      }
    } catch (error) {
      spinner.fail('Failed to fetch transactions');
      printError(error.message, error);
      process.exit(1);
    }
  });
