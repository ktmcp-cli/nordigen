/**
 * Authentication Management
 *
 * @fileoverview Handles JWT token authentication and refresh
 * @module lib/auth
 */

import { getConfig, isAccessTokenValid, isRefreshTokenValid } from './config.js';
import { createClient } from './api.js';

/**
 * Ensure valid access token, refreshing if necessary
 *
 * @returns {Promise<string>} Valid access token
 * @throws {Error} If authentication fails
 */
export async function ensureAuth() {
  const config = getConfig();

  // Check if access token is valid
  if (isAccessTokenValid()) {
    return config.get('auth.access_token');
  }

  // Try to refresh token
  if (isRefreshTokenValid()) {
    const refreshToken = config.get('auth.refresh_token');
    const api = createClient();

    try {
      const result = await api.refreshToken(refreshToken);

      // Save new access token
      const now = Math.floor(Date.now() / 1000);
      config.set('auth.access_token', result.access);
      config.set('auth.access_expires', now + result.access_expires);

      return result.access;
    } catch (error) {
      throw new Error('Failed to refresh token. Please login again using: nordigen auth login');
    }
  }

  // No valid tokens
  throw new Error('Not authenticated. Please login using: nordigen auth login --secret-id <id> --secret-key <key>');
}

/**
 * Login with secret credentials
 *
 * @param {string} secretId - Secret ID
 * @param {string} secretKey - Secret Key
 * @returns {Promise<Object>} Token response
 */
export async function login(secretId, secretKey) {
  const api = createClient();
  const result = await api.obtainToken(secretId, secretKey);

  // Save credentials and tokens
  const config = getConfig();
  const now = Math.floor(Date.now() / 1000);

  config.set('auth.secret_id', secretId);
  config.set('auth.secret_key', secretKey);
  config.set('auth.access_token', result.access);
  config.set('auth.refresh_token', result.refresh);
  config.set('auth.access_expires', now + result.access_expires);
  config.set('auth.refresh_expires', now + result.refresh_expires);

  return result;
}

/**
 * Logout (clear credentials)
 */
export function logout() {
  const config = getConfig();
  config.delete('auth');
}

/**
 * Check if authenticated
 *
 * @returns {boolean}
 */
export function isAuthenticated() {
  return isAccessTokenValid() || isRefreshTokenValid();
}

/**
 * Get authentication status
 *
 * @returns {Object} Authentication status details
 */
export function getAuthStatus() {
  const config = getConfig();
  const accessToken = config.get('auth.access_token');
  const refreshToken = config.get('auth.refresh_token');
  const accessExpires = config.get('auth.access_expires');
  const refreshExpires = config.get('auth.refresh_expires');

  const now = Math.floor(Date.now() / 1000);

  return {
    authenticated: isAuthenticated(),
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    accessTokenValid: isAccessTokenValid(),
    refreshTokenValid: isRefreshTokenValid(),
    accessExpiresIn: accessExpires ? Math.max(0, accessExpires - now) : 0,
    refreshExpiresIn: refreshExpires ? Math.max(0, refreshExpires - now) : 0,
  };
}
