/**
 * Output Formatting
 *
 * @fileoverview Utilities for formatting and displaying CLI output
 * @module lib/output
 */

import chalk from 'chalk';
import { format as formatDate } from 'date-fns';

/**
 * Output formats
 */
export const OutputFormat = {
  JSON: 'json',
  TABLE: 'table',
  LIST: 'list',
};

/**
 * Print JSON output
 *
 * @param {*} data - Data to output
 * @param {boolean} [pretty=true] - Pretty print
 */
export function printJSON(data, pretty = true) {
  if (pretty) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(JSON.stringify(data));
  }
}

/**
 * Print success message
 *
 * @param {string} message - Success message
 */
export function printSuccess(message) {
  console.log(chalk.green('✓'), message);
}

/**
 * Print error message
 *
 * @param {string} message - Error message
 * @param {Error} [error] - Error object
 */
export function printError(message, error = null) {
  console.error(chalk.red('✗'), message);
  if (error && process.env.DEBUG) {
    console.error(chalk.gray(error.stack));
  }
}

/**
 * Print warning message
 *
 * @param {string} message - Warning message
 */
export function printWarning(message) {
  console.log(chalk.yellow('⚠'), message);
}

/**
 * Print info message
 *
 * @param {string} message - Info message
 */
export function printInfo(message) {
  console.log(chalk.blue('ℹ'), message);
}

/**
 * Print table row
 *
 * @param {string} label - Row label
 * @param {string} value - Row value
 * @param {number} [labelWidth=20] - Label column width
 */
export function printRow(label, value, labelWidth = 20) {
  const paddedLabel = label.padEnd(labelWidth);
  console.log(`${chalk.cyan(paddedLabel)} ${value}`);
}

/**
 * Print section header
 *
 * @param {string} title - Section title
 */
export function printSection(title) {
  console.log();
  console.log(chalk.bold.underline(title));
  console.log();
}

/**
 * Format currency amount
 *
 * @param {number|string} amount - Amount
 * @param {string} [currency='EUR'] - Currency code
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'EUR') {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(num);
}

/**
 * Format date
 *
 * @param {string|Date} date - Date to format
 * @param {string} [format='yyyy-MM-dd'] - Date format
 * @returns {string}
 */
export function formatDateString(date, format = 'yyyy-MM-dd') {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDate(d, format);
}

/**
 * Format relative time
 *
 * @param {string|Date} date - Date to format
 * @returns {string}
 */
export function formatRelativeTime(date) {
  if (!date) return 'N/A';

  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;

  return formatDate(d, 'yyyy-MM-dd');
}

/**
 * Format seconds to human-readable duration
 *
 * @param {number} seconds - Duration in seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  const days = Math.floor(seconds / 86400);
  return `${days} day${days !== 1 ? 's' : ''}`;
}

/**
 * Print account summary
 *
 * @param {Object} account - Account data
 */
export function printAccountSummary(account) {
  printSection('Account Details');
  printRow('Account ID', account.id);
  printRow('IBAN', account.iban || 'N/A');
  printRow('Status', formatStatus(account.status));
  printRow('Created', formatDateString(account.created));
  printRow('Last Accessed', formatRelativeTime(account.last_accessed));
  if (account.institution_id) {
    printRow('Institution ID', account.institution_id);
  }
}

/**
 * Format status with color
 *
 * @param {string} status - Status string
 * @returns {string}
 */
export function formatStatus(status) {
  switch (status?.toUpperCase()) {
    case 'READY':
    case 'ACTIVE':
    case 'COMPLETED':
      return chalk.green(status);
    case 'PROCESSING':
    case 'PENDING':
      return chalk.yellow(status);
    case 'ERROR':
    case 'SUSPENDED':
    case 'EXPIRED':
      return chalk.red(status);
    default:
      return status || 'N/A';
  }
}

/**
 * Print transaction
 *
 * @param {Object} transaction - Transaction data
 */
export function printTransaction(transaction) {
  const amount = transaction.transactionAmount || {};
  const date = transaction.bookingDate || transaction.valueDate;

  console.log(
    chalk.cyan(formatDateString(date)),
    formatCurrency(amount.amount, amount.currency),
    transaction.remittanceInformationUnstructured || transaction.debtorName || 'N/A'
  );
}

/**
 * Print list of items
 *
 * @param {Array} items - Items to print
 * @param {Function} formatter - Function to format each item
 */
export function printList(items, formatter) {
  if (!items || items.length === 0) {
    printWarning('No items found');
    return;
  }

  items.forEach((item, index) => {
    formatter(item, index);
  });
}

/**
 * Truncate string
 *
 * @param {string} str - String to truncate
 * @param {number} [maxLength=50] - Maximum length
 * @returns {string}
 */
export function truncate(str, maxLength = 50) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}
