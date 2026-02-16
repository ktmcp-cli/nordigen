/**
 * Configuration Management
 *
 * @fileoverview Manages CLI configuration and credentials storage
 * @module lib/config
 */

import Conf from 'conf';
import { homedir } from 'os';
import { join } from 'path';

/**
 * Configuration schema
 */
const schema = {
  auth: {
    type: 'object',
    properties: {
      secret_id: { type: 'string' },
      secret_key: { type: 'string' },
      access_token: { type: 'string' },
      refresh_token: { type: 'string' },
      access_expires: { type: 'number' },
      refresh_expires: { type: 'number' },
    },
  },
  defaults: {
    type: 'object',
    properties: {
      country: { type: 'string' },
      institution_id: { type: 'string' },
    },
  },
};

let configInstance = null;

/**
 * Get or create config instance
 *
 * @returns {Conf}
 */
export function getConfig() {
  if (!configInstance) {
    configInstance = new Conf({
      projectName: 'nordigen-cli',
      schema,
      configFileMode: 0o600, // Read/write for owner only
    });
  }
  return configInstance;
}

/**
 * Get configuration value
 *
 * @param {string} key - Configuration key (dot notation supported)
 * @param {*} [defaultValue] - Default value if key doesn't exist
 * @returns {*}
 */
export function get(key, defaultValue) {
  return getConfig().get(key, defaultValue);
}

/**
 * Set configuration value
 *
 * @param {string} key - Configuration key (dot notation supported)
 * @param {*} value - Value to set
 */
export function set(key, value) {
  getConfig().set(key, value);
}

/**
 * Delete configuration value
 *
 * @param {string} key - Configuration key
 */
export function del(key) {
  getConfig().delete(key);
}

/**
 * Clear all configuration
 */
export function clear() {
  getConfig().clear();
}

/**
 * Get all configuration
 *
 * @returns {Object}
 */
export function getAll() {
  return getConfig().store;
}

/**
 * Check if access token is valid (not expired)
 *
 * @returns {boolean}
 */
export function isAccessTokenValid() {
  const config = getConfig();
  const token = config.get('auth.access_token');
  const expires = config.get('auth.access_expires');

  if (!token || !expires) {
    return false;
  }

  // Check if token expires in more than 60 seconds
  const now = Math.floor(Date.now() / 1000);
  return expires > (now + 60);
}

/**
 * Check if refresh token is valid (not expired)
 *
 * @returns {boolean}
 */
export function isRefreshTokenValid() {
  const config = getConfig();
  const token = config.get('auth.refresh_token');
  const expires = config.get('auth.refresh_expires');

  if (!token || !expires) {
    return false;
  }

  // Check if token expires in more than 60 seconds
  const now = Math.floor(Date.now() / 1000);
  return expires > (now + 60);
}

/**
 * Get config file path
 *
 * @returns {string}
 */
export function getConfigPath() {
  return getConfig().path;
}
