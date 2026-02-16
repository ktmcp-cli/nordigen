/**
 * Institution Commands
 *
 * @fileoverview Commands for browsing and searching financial institutions
 * @module commands/institutions
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { createClient } from '../lib/api.js';
import { ensureAuth } from '../lib/auth.js';
import {
  printJSON,
  printError,
  printSection,
  printRow,
  truncate,
} from '../lib/output.js';

export const institutionsCommand = new Command('institutions')
  .description('Browse and search financial institutions')
  .alias('inst');

// List institutions
institutionsCommand
  .command('list')
  .description('List supported institutions')
  .requiredOption('-c, --country <code>', 'ISO 3166 country code (e.g., GB, DE, FR)')
  .option('--payments', 'Filter institutions supporting payments')
  .option('--account-selection', 'Filter institutions supporting account selection')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    const spinner = ora('Fetching institutions...').start();

    try {
      await ensureAuth();
      const api = createClient();

      const params = {};
      if (options.payments) params.payments_enabled = true;
      if (options.accountSelection) params.account_selection = true;

      const institutions = await api.listInstitutions(options.country, params);

      spinner.succeed(`Found ${institutions.length} institutions`);

      if (options.json) {
        printJSON(institutions);
      } else {
        printSection(`Institutions in ${options.country.toUpperCase()}`);

        institutions.forEach((inst, index) => {
          console.log(
            chalk.cyan(`${(index + 1).toString().padStart(3)}.`),
            chalk.bold(inst.name),
            chalk.gray(`(${inst.id})`)
          );

          if (inst.bic) {
            console.log('     BIC:', inst.bic);
          }

          const features = [];
          if (inst.transaction_total_days) {
            features.push(`${inst.transaction_total_days} days history`);
          }
          if (inst.payments_enabled) {
            features.push('Payments');
          }
          if (inst.account_selection_supported) {
            features.push('Account Selection');
          }

          if (features.length > 0) {
            console.log('     Features:', chalk.green(features.join(', ')));
          }

          console.log();
        });
      }
    } catch (error) {
      spinner.fail('Failed to fetch institutions');
      printError(error.message, error);
      process.exit(1);
    }
  });

// Get institution details
institutionsCommand
  .command('get')
  .description('Get institution details')
  .argument('<institution-id>', 'Institution ID')
  .option('-j, --json', 'Output as JSON')
  .action(async (institutionId, options) => {
    const spinner = ora('Fetching institution...').start();

    try {
      await ensureAuth();
      const api = createClient();
      const institution = await api.getInstitution(institutionId);

      spinner.succeed('Institution retrieved');

      if (options.json) {
        printJSON(institution);
      } else {
        printSection('Institution Details');

        printRow('ID', institution.id);
        printRow('Name', institution.name);
        if (institution.bic) printRow('BIC', institution.bic);
        if (institution.countries) printRow('Countries', institution.countries.join(', '));
        if (institution.logo) printRow('Logo', institution.logo);

        printSection('Features');
        printRow('Transaction History', institution.transaction_total_days ? `${institution.transaction_total_days} days` : 'N/A');
        printRow('Payments', institution.payments_enabled ? chalk.green('Supported') : chalk.gray('Not supported'));
        printRow('Account Selection', institution.account_selection_supported ? chalk.green('Supported') : chalk.gray('Not supported'));

        if (institution.supported_payments) {
          printRow('Payment Types', institution.supported_payments.join(', '));
        }
      }
    } catch (error) {
      spinner.fail('Failed to fetch institution');
      printError(error.message, error);
      process.exit(1);
    }
  });

// Search institutions
institutionsCommand
  .command('search')
  .description('Search for institutions by name')
  .argument('<query>', 'Search query')
  .requiredOption('-c, --country <code>', 'ISO 3166 country code')
  .option('-j, --json', 'Output as JSON')
  .action(async (query, options) => {
    const spinner = ora('Searching institutions...').start();

    try {
      await ensureAuth();
      const api = createClient();
      const institutions = await api.listInstitutions(options.country);

      // Filter by name
      const results = institutions.filter((inst) =>
        inst.name.toLowerCase().includes(query.toLowerCase())
      );

      spinner.succeed(`Found ${results.length} matching institutions`);

      if (options.json) {
        printJSON(results);
      } else {
        if (results.length === 0) {
          console.log(chalk.yellow('No institutions found matching query'));
          return;
        }

        printSection('Search Results');

        results.forEach((inst, index) => {
          console.log(
            chalk.cyan(`${(index + 1).toString().padStart(3)}.`),
            chalk.bold(inst.name),
            chalk.gray(`(${inst.id})`)
          );
          if (inst.bic) {
            console.log('     BIC:', inst.bic);
          }
          console.log();
        });
      }
    } catch (error) {
      spinner.fail('Search failed');
      printError(error.message, error);
      process.exit(1);
    }
  });
