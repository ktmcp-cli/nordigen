/**
 * Requisition Commands
 *
 * @fileoverview Commands for managing account requisitions
 * @module commands/requisitions
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
  formatDateString,
  formatStatus,
} from '../lib/output.js';

export const requisitionsCommand = new Command('requisitions')
  .description('Manage account requisitions')
  .alias('req');

// List requisitions
requisitionsCommand
  .command('list')
  .description('List all requisitions')
  .option('--limit <number>', 'Results per page', '100')
  .option('--offset <number>', 'Pagination offset', '0')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    const spinner = ora('Fetching requisitions...').start();

    try {
      await ensureAuth();
      const api = createClient();

      const params = {
        limit: parseInt(options.limit),
        offset: parseInt(options.offset),
      };

      const data = await api.listRequisitions(params);

      spinner.succeed(`Found ${data.count || data.results?.length || 0} requisitions`);

      if (options.json) {
        printJSON(data);
      } else {
        const requisitions = data.results || [];

        if (requisitions.length === 0) {
          console.log(chalk.yellow('No requisitions found'));
          return;
        }

        printSection('Requisitions');

        requisitions.forEach((req, index) => {
          console.log(chalk.cyan(`${index + 1}.`), chalk.bold(req.id));
          console.log('   Status:', formatStatus(req.status));
          console.log('   Institution:', req.institution_id);
          console.log('   Created:', formatDateString(req.created));

          if (req.reference) {
            console.log('   Reference:', req.reference);
          }

          if (req.accounts && req.accounts.length > 0) {
            console.log('   Accounts:', req.accounts.join(', '));
          }

          if (req.link) {
            console.log('   Auth Link:', chalk.blue(req.link));
          }

          console.log();
        });

        if (data.next) {
          console.log(chalk.gray('More results available. Use --offset to paginate.'));
        }
      }
    } catch (error) {
      spinner.fail('Failed to fetch requisitions');
      printError(error.message, error);
      process.exit(1);
    }
  });

// Create requisition
requisitionsCommand
  .command('create')
  .description('Create a new requisition')
  .requiredOption('-i, --institution-id <id>', 'Institution ID')
  .requiredOption('-r, --redirect <url>', 'Redirect URL after authentication')
  .option('--reference <ref>', 'Custom reference identifier')
  .option('--agreement <id>', 'Agreement UUID')
  .option('--language <code>', 'User language code (e.g., en, de, fr)')
  .option('--account-selection', 'Enable account selection')
  .option('--redirect-immediate', 'Redirect immediately after auth')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    const spinner = ora('Creating requisition...').start();

    try {
      await ensureAuth();
      const api = createClient();

      const data = {
        institution_id: options.institutionId,
        redirect: options.redirect,
      };

      if (options.reference) data.reference = options.reference;
      if (options.agreement) data.agreement = options.agreement;
      if (options.language) data.user_language = options.language;
      if (options.accountSelection) data.account_selection = true;
      if (options.redirectImmediate) data.redirect_immediate = true;

      const requisition = await api.createRequisition(data);

      spinner.succeed('Requisition created');

      if (options.json) {
        printJSON(requisition);
      } else {
        printSection('Requisition Created');
        printRow('Requisition ID', requisition.id);
        printRow('Status', formatStatus(requisition.status));
        printRow('Institution', requisition.institution_id);

        if (requisition.reference) {
          printRow('Reference', requisition.reference);
        }

        console.log();
        printSuccess('Requisition created successfully');

        if (requisition.link) {
          console.log();
          console.log(chalk.bold('Authentication Link:'));
          console.log(chalk.blue(requisition.link));
          console.log();
          console.log(chalk.gray('Send this link to the end user to authorize access'));
        }
      }
    } catch (error) {
      spinner.fail('Failed to create requisition');
      printError(error.message, error);
      process.exit(1);
    }
  });

// Get requisition
requisitionsCommand
  .command('get')
  .description('Get requisition details')
  .argument('<requisition-id>', 'Requisition UUID')
  .option('-j, --json', 'Output as JSON')
  .action(async (requisitionId, options) => {
    const spinner = ora('Fetching requisition...').start();

    try {
      await ensureAuth();
      const api = createClient();
      const requisition = await api.getRequisition(requisitionId);

      spinner.succeed('Requisition retrieved');

      if (options.json) {
        printJSON(requisition);
      } else {
        printSection('Requisition Details');
        printRow('Requisition ID', requisition.id);
        printRow('Status', formatStatus(requisition.status));
        printRow('Institution', requisition.institution_id);
        printRow('Created', formatDateString(requisition.created));

        if (requisition.reference) {
          printRow('Reference', requisition.reference);
        }

        if (requisition.agreement) {
          printRow('Agreement', requisition.agreement);
        }

        if (requisition.accounts && requisition.accounts.length > 0) {
          console.log();
          console.log(chalk.bold('Connected Accounts:'));
          requisition.accounts.forEach((accountId, index) => {
            console.log(chalk.cyan(`  ${index + 1}.`), accountId);
          });
        }

        if (requisition.link) {
          console.log();
          console.log(chalk.bold('Authentication Link:'));
          console.log(chalk.blue(requisition.link));
        }
      }
    } catch (error) {
      spinner.fail('Failed to fetch requisition');
      printError(error.message, error);
      process.exit(1);
    }
  });

// Delete requisition
requisitionsCommand
  .command('delete')
  .description('Delete a requisition')
  .argument('<requisition-id>', 'Requisition UUID')
  .option('-y, --yes', 'Skip confirmation')
  .action(async (requisitionId, options) => {
    if (!options.yes) {
      console.log(chalk.yellow('Warning: This will permanently delete the requisition'));
      console.log('Use --yes to confirm deletion');
      process.exit(0);
    }

    const spinner = ora('Deleting requisition...').start();

    try {
      await ensureAuth();
      const api = createClient();
      await api.deleteRequisition(requisitionId);

      spinner.succeed('Requisition deleted');
      printSuccess('Requisition deleted successfully');
    } catch (error) {
      spinner.fail('Failed to delete requisition');
      printError(error.message, error);
      process.exit(1);
    }
  });
