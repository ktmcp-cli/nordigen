/**
 * Payment Commands
 *
 * @fileoverview Commands for managing payments and creditors
 * @module commands/payments
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
  formatStatus,
  formatDateString,
} from '../lib/output.js';

export const paymentsCommand = new Command('payments')
  .description('Manage payments and creditors')
  .alias('pay');

// List payments
paymentsCommand
  .command('list')
  .description('List all payments')
  .option('--limit <number>', 'Results per page', '100')
  .option('--offset <number>', 'Pagination offset', '0')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    const spinner = ora('Fetching payments...').start();

    try {
      await ensureAuth();
      const api = createClient();

      const params = {
        limit: parseInt(options.limit),
        offset: parseInt(options.offset),
      };

      const data = await api.listPayments(params);

      spinner.succeed(`Found ${data.count || data.results?.length || 0} payments`);

      if (options.json) {
        printJSON(data);
      } else {
        const payments = data.results || [];

        if (payments.length === 0) {
          console.log(chalk.yellow('No payments found'));
          return;
        }

        printSection('Payments');

        payments.forEach((payment, index) => {
          console.log(chalk.cyan(`${index + 1}.`), chalk.bold(payment.id));
          console.log('   Status:', formatStatus(payment.status));
          console.log('   Created:', formatDateString(payment.created));

          if (payment.amount && payment.currency) {
            console.log('   Amount:', `${payment.amount} ${payment.currency}`);
          }

          console.log();
        });

        if (data.next) {
          console.log(chalk.gray('More results available. Use --offset to paginate.'));
        }
      }
    } catch (error) {
      spinner.fail('Failed to fetch payments');
      printError(error.message, error);
      process.exit(1);
    }
  });

// Get payment
paymentsCommand
  .command('get')
  .description('Get payment details')
  .argument('<payment-id>', 'Payment UUID')
  .option('-j, --json', 'Output as JSON')
  .action(async (paymentId, options) => {
    const spinner = ora('Fetching payment...').start();

    try {
      await ensureAuth();
      const api = createClient();
      const payment = await api.getPayment(paymentId);

      spinner.succeed('Payment retrieved');

      if (options.json) {
        printJSON(payment);
      } else {
        printSection('Payment Details');
        printRow('Payment ID', payment.id);
        printRow('Status', formatStatus(payment.status));
        printRow('Created', formatDateString(payment.created));

        if (payment.amount && payment.currency) {
          printRow('Amount', `${payment.amount} ${payment.currency}`);
        }
      }
    } catch (error) {
      spinner.fail('Failed to fetch payment');
      printError(error.message, error);
      process.exit(1);
    }
  });

// Delete payment
paymentsCommand
  .command('delete')
  .description('Delete a periodic payment')
  .argument('<payment-id>', 'Payment UUID')
  .option('-y, --yes', 'Skip confirmation')
  .action(async (paymentId, options) => {
    if (!options.yes) {
      console.log(chalk.yellow('Warning: This will permanently delete the payment'));
      console.log('Use --yes to confirm deletion');
      process.exit(0);
    }

    const spinner = ora('Deleting payment...').start();

    try {
      await ensureAuth();
      const api = createClient();
      await api.deletePayment(paymentId);

      spinner.succeed('Payment deleted');
      printSuccess('Payment deleted successfully');
    } catch (error) {
      spinner.fail('Failed to delete payment');
      printError(error.message, error);
      process.exit(1);
    }
  });

// List creditors
paymentsCommand
  .command('creditors')
  .description('List payment creditors')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    const spinner = ora('Fetching creditors...').start();

    try {
      await ensureAuth();
      const api = createClient();
      const data = await api.listCreditors();

      spinner.succeed(`Found ${data.count || data.results?.length || 0} creditors`);

      if (options.json) {
        printJSON(data);
      } else {
        const creditors = data.results || [];

        if (creditors.length === 0) {
          console.log(chalk.yellow('No creditors found'));
          return;
        }

        printSection('Payment Creditors');

        creditors.forEach((creditor, index) => {
          console.log(chalk.cyan(`${index + 1}.`), chalk.bold(creditor.name || creditor.id));
          console.log('   ID:', creditor.id);

          if (creditor.account) {
            console.log('   Account:', creditor.account);
          }

          console.log();
        });
      }
    } catch (error) {
      spinner.fail('Failed to fetch creditors');
      printError(error.message, error);
      process.exit(1);
    }
  });

// Get payment fields
paymentsCommand
  .command('fields')
  .description('Get required payment fields for institution')
  .argument('<institution-id>', 'Institution ID')
  .option('-j, --json', 'Output as JSON')
  .action(async (institutionId, options) => {
    const spinner = ora('Fetching payment fields...').start();

    try {
      await ensureAuth();
      const api = createClient();
      const fields = await api.getPaymentFields(institutionId);

      spinner.succeed('Payment fields retrieved');

      if (options.json) {
        printJSON(fields);
      } else {
        printSection(`Required Payment Fields for ${institutionId}`);

        if (Array.isArray(fields)) {
          fields.forEach((field, index) => {
            console.log(chalk.cyan(`${index + 1}.`), field);
          });
        } else {
          console.log(chalk.yellow('No specific fields required'));
        }
      }
    } catch (error) {
      spinner.fail('Failed to fetch payment fields');
      printError(error.message, error);
      process.exit(1);
    }
  });
