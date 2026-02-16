/**
 * End User Agreement Commands
 *
 * @fileoverview Commands for managing end user agreements (EUAs)
 * @module commands/agreements
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

export const agreementsCommand = new Command('agreements')
  .description('Manage end user agreements (EUAs)')
  .alias('eua');

// List agreements
agreementsCommand
  .command('list')
  .description('List all end user agreements')
  .option('--limit <number>', 'Results per page', '100')
  .option('--offset <number>', 'Pagination offset', '0')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    const spinner = ora('Fetching agreements...').start();

    try {
      await ensureAuth();
      const api = createClient();

      const params = {
        limit: parseInt(options.limit),
        offset: parseInt(options.offset),
      };

      const data = await api.listAgreements(params);

      spinner.succeed(`Found ${data.count || data.results?.length || 0} agreements`);

      if (options.json) {
        printJSON(data);
      } else {
        const agreements = data.results || [];

        if (agreements.length === 0) {
          console.log(chalk.yellow('No agreements found'));
          return;
        }

        printSection('End User Agreements');

        agreements.forEach((agreement, index) => {
          console.log(chalk.cyan(`${index + 1}.`), chalk.bold(agreement.id));
          console.log('   Institution:', agreement.institution_id);
          console.log('   Created:', formatDateString(agreement.created));
          console.log('   Max Historical Days:', agreement.max_historical_days);
          console.log('   Access Valid For:', agreement.access_valid_for_days, 'days');
          console.log('   Status:', formatStatus(agreement.accepted ? 'ACCEPTED' : 'PENDING'));

          if (agreement.access_scope && agreement.access_scope.length > 0) {
            console.log('   Access Scope:', agreement.access_scope.join(', '));
          }

          console.log();
        });

        if (data.next) {
          console.log(chalk.gray('More results available. Use --offset to paginate.'));
        }
      }
    } catch (error) {
      spinner.fail('Failed to fetch agreements');
      printError(error.message, error);
      process.exit(1);
    }
  });

// Create agreement
agreementsCommand
  .command('create')
  .description('Create a new end user agreement')
  .requiredOption('-i, --institution-id <id>', 'Institution ID')
  .option('--max-days <days>', 'Maximum historical days', '90')
  .option('--valid-days <days>', 'Access valid for days', '90')
  .option('--scope <scopes...>', 'Access scope (balances, details, transactions)')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    const spinner = ora('Creating agreement...').start();

    try {
      await ensureAuth();
      const api = createClient();

      const data = {
        institution_id: options.institutionId,
        max_historical_days: parseInt(options.maxDays),
        access_valid_for_days: parseInt(options.validDays),
      };

      if (options.scope) {
        data.access_scope = options.scope;
      }

      const agreement = await api.createAgreement(data);

      spinner.succeed('Agreement created');

      if (options.json) {
        printJSON(agreement);
      } else {
        printSection('Agreement Created');
        printRow('Agreement ID', agreement.id);
        printRow('Institution', agreement.institution_id);
        printRow('Max Historical Days', agreement.max_historical_days);
        printRow('Access Valid For', `${agreement.access_valid_for_days} days`);

        if (agreement.access_scope) {
          printRow('Access Scope', agreement.access_scope.join(', '));
        }

        printSuccess('Agreement created successfully');
      }
    } catch (error) {
      spinner.fail('Failed to create agreement');
      printError(error.message, error);
      process.exit(1);
    }
  });

// Get agreement
agreementsCommand
  .command('get')
  .description('Get agreement details')
  .argument('<agreement-id>', 'Agreement UUID')
  .option('-j, --json', 'Output as JSON')
  .action(async (agreementId, options) => {
    const spinner = ora('Fetching agreement...').start();

    try {
      await ensureAuth();
      const api = createClient();
      const agreement = await api.getAgreement(agreementId);

      spinner.succeed('Agreement retrieved');

      if (options.json) {
        printJSON(agreement);
      } else {
        printSection('Agreement Details');
        printRow('Agreement ID', agreement.id);
        printRow('Institution', agreement.institution_id);
        printRow('Created', formatDateString(agreement.created));
        printRow('Max Historical Days', agreement.max_historical_days);
        printRow('Access Valid For', `${agreement.access_valid_for_days} days`);
        printRow('Status', formatStatus(agreement.accepted ? 'ACCEPTED' : 'PENDING'));

        if (agreement.access_scope) {
          printRow('Access Scope', agreement.access_scope.join(', '));
        }
      }
    } catch (error) {
      spinner.fail('Failed to fetch agreement');
      printError(error.message, error);
      process.exit(1);
    }
  });

// Delete agreement
agreementsCommand
  .command('delete')
  .description('Delete an end user agreement')
  .argument('<agreement-id>', 'Agreement UUID')
  .option('-y, --yes', 'Skip confirmation')
  .action(async (agreementId, options) => {
    if (!options.yes) {
      console.log(chalk.yellow('Warning: This will permanently delete the agreement'));
      console.log('Use --yes to confirm deletion');
      process.exit(0);
    }

    const spinner = ora('Deleting agreement...').start();

    try {
      await ensureAuth();
      const api = createClient();
      await api.deleteAgreement(agreementId);

      spinner.succeed('Agreement deleted');
      printSuccess('Agreement deleted successfully');
    } catch (error) {
      spinner.fail('Failed to delete agreement');
      printError(error.message, error);
      process.exit(1);
    }
  });

// Accept agreement
agreementsCommand
  .command('accept')
  .description('Accept an end user agreement')
  .argument('<agreement-id>', 'Agreement UUID')
  .requiredOption('--user-agent <ua>', 'User agent string')
  .requiredOption('--ip <address>', 'User IP address')
  .option('-j, --json', 'Output as JSON')
  .action(async (agreementId, options) => {
    const spinner = ora('Accepting agreement...').start();

    try {
      await ensureAuth();
      const api = createClient();

      const data = {
        user_agent: options.userAgent,
        ip_address: options.ip,
      };

      const agreement = await api.acceptAgreement(agreementId, data);

      spinner.succeed('Agreement accepted');

      if (options.json) {
        printJSON(agreement);
      } else {
        printSuccess('Agreement accepted successfully');
      }
    } catch (error) {
      spinner.fail('Failed to accept agreement');
      printError(error.message, error);
      process.exit(1);
    }
  });
