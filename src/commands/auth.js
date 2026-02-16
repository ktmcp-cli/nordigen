/**
 * Authentication Commands
 *
 * @fileoverview Commands for authentication and token management
 * @module commands/auth
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { login, logout, getAuthStatus } from '../lib/auth.js';
import { printSuccess, printError, printSection, printRow, formatDuration } from '../lib/output.js';

export const authCommand = new Command('auth')
  .description('Authentication and token management');

// Login command
authCommand
  .command('login')
  .description('Authenticate with Nordigen API')
  .requiredOption('--secret-id <id>', 'Secret ID from Nordigen dashboard')
  .requiredOption('--secret-key <key>', 'Secret Key from Nordigen dashboard')
  .action(async (options) => {
    const spinner = ora('Authenticating...').start();

    try {
      const result = await login(options.secretId, options.secretKey);
      spinner.succeed('Authentication successful');

      printSection('Token Information');
      printRow('Access Token Expires In', formatDuration(result.access_expires));
      printRow('Refresh Token Expires In', formatDuration(result.refresh_expires));

      printSuccess('Credentials saved securely');
    } catch (error) {
      spinner.fail('Authentication failed');
      printError(error.message, error);
      process.exit(1);
    }
  });

// Logout command
authCommand
  .command('logout')
  .description('Clear stored credentials')
  .action(() => {
    try {
      logout();
      printSuccess('Logged out successfully');
    } catch (error) {
      printError('Logout failed', error);
      process.exit(1);
    }
  });

// Status command
authCommand
  .command('status')
  .description('Show authentication status')
  .action(() => {
    try {
      const status = getAuthStatus();

      printSection('Authentication Status');

      if (status.authenticated) {
        printRow('Status', chalk.green('Authenticated'));
        printRow('Access Token', status.accessTokenValid ? chalk.green('Valid') : chalk.yellow('Expired'));
        printRow('Refresh Token', status.refreshTokenValid ? chalk.green('Valid') : chalk.yellow('Expired'));

        if (status.accessTokenValid) {
          printRow('Access Expires In', formatDuration(status.accessExpiresIn));
        }
        if (status.refreshTokenValid) {
          printRow('Refresh Expires In', formatDuration(status.refreshExpiresIn));
        }
      } else {
        printRow('Status', chalk.red('Not Authenticated'));
        console.log();
        console.log('Login with:', chalk.cyan('nordigen auth login --secret-id <id> --secret-key <key>'));
      }
    } catch (error) {
      printError('Failed to get auth status', error);
      process.exit(1);
    }
  });
