#!/usr/bin/env node

/**
 * Nordigen CLI - Production-ready command-line interface for Nordigen API
 *
 * @fileoverview Main entry point for the Nordigen CLI application
 * @module nordigen-cli
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import commands
import { authCommand } from '../src/commands/auth.js';
import { accountsCommand } from '../src/commands/accounts.js';
import { institutionsCommand } from '../src/commands/institutions.js';
import { agreementsCommand } from '../src/commands/agreements.js';
import { requisitionsCommand } from '../src/commands/requisitions.js';
import { paymentsCommand } from '../src/commands/payments.js';
import { configCommand } from '../src/commands/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const program = new Command();

program
  .name('nordigen')
  .description('Production-ready CLI for Nordigen Open Banking API')
  .version(packageJson.version)
  .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.cyan('$ nordigen auth login --secret-id <id> --secret-key <key>')}
  ${chalk.cyan('$ nordigen institutions list --country GB')}
  ${chalk.cyan('$ nordigen accounts list')}
  ${chalk.cyan('$ nordigen accounts transactions <account-id>')}

${chalk.bold('Documentation:')}
  README.md    - Complete usage guide
  AGENT.md     - AI agent integration patterns
  OPENCLAW.md  - OpenClaw integration guide

${chalk.bold('Support:')}
  GitHub: https://github.com/ktmcp/nordigen-cli
  API Docs: https://nordigen.com/en/docs/
`);

// Register all commands
program.addCommand(authCommand);
program.addCommand(accountsCommand);
program.addCommand(institutionsCommand);
program.addCommand(agreementsCommand);
program.addCommand(requisitionsCommand);
program.addCommand(paymentsCommand);
program.addCommand(configCommand);

// Global error handling
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Error:'), error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('Fatal Error:'), error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});

// Parse arguments
program.parse(process.argv);

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
