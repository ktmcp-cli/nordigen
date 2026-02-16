/**
 * Configuration Commands
 *
 * @fileoverview Commands for managing CLI configuration
 * @module commands/config
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { getConfig, getConfigPath, clear } from '../lib/config.js';
import { printJSON, printSuccess, printError, printSection, printRow } from '../lib/output.js';

export const configCommand = new Command('config')
  .description('Manage CLI configuration');

// Show config
configCommand
  .command('show')
  .description('Show current configuration')
  .option('-j, --json', 'Output as JSON')
  .option('--show-secrets', 'Show secret values (WARNING: sensitive)')
  .action((options) => {
    try {
      const config = getConfig();
      const data = config.store;

      if (options.json) {
        if (options.showSecrets) {
          printJSON(data);
        } else {
          // Redact secrets
          const safe = JSON.parse(JSON.stringify(data));
          if (safe.auth) {
            if (safe.auth.secret_key) safe.auth.secret_key = '***REDACTED***';
            if (safe.auth.access_token) safe.auth.access_token = '***REDACTED***';
            if (safe.auth.refresh_token) safe.auth.refresh_token = '***REDACTED***';
          }
          printJSON(safe);
        }
      } else {
        printSection('Configuration');
        printRow('Config File', getConfigPath());

        console.log();
        console.log(chalk.bold('Authentication:'));
        if (data.auth) {
          printRow('  Secret ID', data.auth.secret_id || 'Not set');
          printRow('  Secret Key', options.showSecrets ? data.auth.secret_key : '***REDACTED***');
          printRow('  Access Token', data.auth.access_token ? (options.showSecrets ? data.auth.access_token : '***REDACTED***') : 'Not set');
          printRow('  Refresh Token', data.auth.refresh_token ? (options.showSecrets ? data.auth.refresh_token : '***REDACTED***') : 'Not set');
        } else {
          console.log(chalk.gray('  Not configured'));
        }

        console.log();
        console.log(chalk.bold('Defaults:'));
        if (data.defaults) {
          printRow('  Country', data.defaults.country || 'Not set');
          printRow('  Institution ID', data.defaults.institution_id || 'Not set');
        } else {
          console.log(chalk.gray('  Not configured'));
        }
      }
    } catch (error) {
      printError('Failed to show config', error);
      process.exit(1);
    }
  });

// Get config value
configCommand
  .command('get')
  .description('Get configuration value')
  .argument('<key>', 'Configuration key (dot notation, e.g., auth.secret_id)')
  .action((key) => {
    try {
      const config = getConfig();
      const value = config.get(key);

      if (value === undefined) {
        console.log(chalk.yellow(`Key '${key}' not found`));
        process.exit(1);
      }

      if (typeof value === 'object') {
        printJSON(value);
      } else {
        console.log(value);
      }
    } catch (error) {
      printError('Failed to get config value', error);
      process.exit(1);
    }
  });

// Set config value
configCommand
  .command('set')
  .description('Set configuration value')
  .argument('<key>', 'Configuration key (dot notation)')
  .argument('<value>', 'Value to set')
  .action((key, value) => {
    try {
      const config = getConfig();

      // Try to parse as JSON, otherwise use as string
      let parsedValue = value;
      try {
        parsedValue = JSON.parse(value);
      } catch {
        // Keep as string
      }

      config.set(key, parsedValue);
      printSuccess(`Set ${key} = ${value}`);
    } catch (error) {
      printError('Failed to set config value', error);
      process.exit(1);
    }
  });

// Delete config value
configCommand
  .command('delete')
  .description('Delete configuration value')
  .argument('<key>', 'Configuration key')
  .action((key) => {
    try {
      const config = getConfig();
      config.delete(key);
      printSuccess(`Deleted ${key}`);
    } catch (error) {
      printError('Failed to delete config value', error);
      process.exit(1);
    }
  });

// Clear all config
configCommand
  .command('clear')
  .description('Clear all configuration')
  .option('-y, --yes', 'Skip confirmation')
  .action((options) => {
    if (!options.yes) {
      console.log(chalk.yellow('Warning: This will clear all configuration including credentials'));
      console.log('Use --yes to confirm');
      process.exit(0);
    }

    try {
      clear();
      printSuccess('Configuration cleared');
    } catch (error) {
      printError('Failed to clear config', error);
      process.exit(1);
    }
  });

// Set default country
configCommand
  .command('set-country')
  .description('Set default country code')
  .argument('<code>', 'ISO 3166 country code (e.g., GB, DE, FR)')
  .action((code) => {
    try {
      const config = getConfig();
      config.set('defaults.country', code.toUpperCase());
      printSuccess(`Default country set to ${code.toUpperCase()}`);
    } catch (error) {
      printError('Failed to set country', error);
      process.exit(1);
    }
  });
