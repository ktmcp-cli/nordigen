/**
 * Nordigen API Client
 *
 * @fileoverview Core API client for interacting with Nordigen endpoints
 * @module lib/api
 */

import fetch from 'node-fetch';
import { getConfig } from './config.js';

const BASE_URL = 'https://ob.nordigen.com';
const API_VERSION = 'v2';

/**
 * API Client for Nordigen
 */
export class NordigenAPI {
  /**
   * @param {string} [accessToken] - JWT access token
   */
  constructor(accessToken = null) {
    this.baseURL = BASE_URL;
    this.accessToken = accessToken || this.getStoredToken();
  }

  /**
   * Get stored access token from config
   * @returns {string|null}
   */
  getStoredToken() {
    const config = getConfig();
    return config.get('auth.access_token') || null;
  }

  /**
   * Make an HTTP request to the API
   *
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {Object} [options={}] - Request options
   * @param {Object} [options.body] - Request body
   * @param {Object} [options.query] - Query parameters
   * @param {boolean} [options.auth=true] - Whether to include auth header
   * @returns {Promise<Object>}
   * @throws {Error} API errors with status codes
   */
  async request(method, endpoint, options = {}) {
    const { body, query, auth = true } = options;

    // Build URL with query parameters
    const url = new URL(`${this.baseURL}${endpoint}`);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });
    }

    // Build headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (auth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Build request options
    const fetchOptions = {
      method,
      headers,
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    // Make request
    const response = await fetch(url.toString(), fetchOptions);

    // Handle response
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle errors
    if (!response.ok) {
      const error = new Error(data.summary || data.detail || `HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.statusCode = data.status_code || response.status;
      error.detail = data.detail;
      error.summary = data.summary;
      error.type = data.type;
      error.response = data;
      throw error;
    }

    return data;
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>}
   */
  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, options);
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} [body] - Request body
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>}
   */
  async post(endpoint, body = {}, options = {}) {
    return this.request('POST', endpoint, { ...options, body });
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} [body] - Request body
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>}
   */
  async put(endpoint, body = {}, options = {}) {
    return this.request('PUT', endpoint, { ...options, body });
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>}
   */
  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, options);
  }

  // ==================== Authentication ====================

  /**
   * Obtain JWT access and refresh tokens
   *
   * @param {string} secretId - Secret ID
   * @param {string} secretKey - Secret Key
   * @returns {Promise<{access: string, refresh: string, access_expires: number, refresh_expires: number}>}
   */
  async obtainToken(secretId, secretKey) {
    return this.post('/api/v2/token/new/', {
      secret_id: secretId,
      secret_key: secretKey,
    }, { auth: false });
  }

  /**
   * Refresh JWT access token
   *
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<{access: string, access_expires: number}>}
   */
  async refreshToken(refreshToken) {
    return this.post('/api/v2/token/refresh/', {
      refresh: refreshToken,
    }, { auth: false });
  }

  // ==================== Accounts ====================

  /**
   * Get account metadata
   *
   * @param {string} accountId - Account UUID
   * @returns {Promise<Object>}
   */
  async getAccount(accountId) {
    return this.get(`/api/v2/accounts/${accountId}/`);
  }

  /**
   * Get account balances
   *
   * @param {string} accountId - Account UUID
   * @returns {Promise<Object>}
   */
  async getAccountBalances(accountId) {
    return this.get(`/api/v2/accounts/${accountId}/balances/`);
  }

  /**
   * Get account details
   *
   * @param {string} accountId - Account UUID
   * @returns {Promise<Object>}
   */
  async getAccountDetails(accountId) {
    return this.get(`/api/v2/accounts/${accountId}/details/`);
  }

  /**
   * Get account transactions
   *
   * @param {string} accountId - Account UUID
   * @param {Object} [params] - Query parameters
   * @param {string} [params.date_from] - Start date (YYYY-MM-DD)
   * @param {string} [params.date_to] - End date (YYYY-MM-DD)
   * @returns {Promise<Object>}
   */
  async getAccountTransactions(accountId, params = {}) {
    return this.get(`/api/v2/accounts/${accountId}/transactions/`, { query: params });
  }

  /**
   * Get premium account transactions
   *
   * @param {string} accountId - Account UUID
   * @param {string} country - ISO 3166 country code
   * @param {Object} [params] - Query parameters
   * @param {string} [params.date_from] - Start date (YYYY-MM-DD)
   * @param {string} [params.date_to] - End date (YYYY-MM-DD)
   * @returns {Promise<Object>}
   */
  async getPremiumTransactions(accountId, country, params = {}) {
    return this.get(`/api/v2/accounts/premium/${accountId}/transactions/`, {
      query: { country, ...params }
    });
  }

  // ==================== Institutions ====================

  /**
   * List all supported institutions
   *
   * @param {string} country - ISO 3166 country code
   * @param {Object} [params] - Query parameters
   * @param {boolean} [params.payments_enabled] - Filter by payment support
   * @param {boolean} [params.account_selection] - Filter by account selection
   * @returns {Promise<Array>}
   */
  async listInstitutions(country, params = {}) {
    return this.get('/api/v2/institutions/', {
      query: { country, ...params }
    });
  }

  /**
   * Get institution details
   *
   * @param {string} institutionId - Institution ID
   * @returns {Promise<Object>}
   */
  async getInstitution(institutionId) {
    return this.get(`/api/v2/institutions/${institutionId}/`);
  }

  // ==================== End User Agreements ====================

  /**
   * List all end user agreements
   *
   * @param {Object} [params] - Query parameters
   * @param {number} [params.limit] - Results per page
   * @param {number} [params.offset] - Offset for pagination
   * @returns {Promise<Object>}
   */
  async listAgreements(params = {}) {
    return this.get('/api/v2/agreements/enduser/', { query: params });
  }

  /**
   * Create end user agreement
   *
   * @param {Object} data - Agreement data
   * @param {string} data.institution_id - Institution ID
   * @param {number} [data.max_historical_days=90] - Max historical days
   * @param {number} [data.access_valid_for_days=90] - Access validity days
   * @param {Array<string>} [data.access_scope] - Access scopes
   * @returns {Promise<Object>}
   */
  async createAgreement(data) {
    return this.post('/api/v2/agreements/enduser/', data);
  }

  /**
   * Get end user agreement by ID
   *
   * @param {string} agreementId - Agreement UUID
   * @returns {Promise<Object>}
   */
  async getAgreement(agreementId) {
    return this.get(`/api/v2/agreements/enduser/${agreementId}/`);
  }

  /**
   * Delete end user agreement
   *
   * @param {string} agreementId - Agreement UUID
   * @returns {Promise<Object>}
   */
  async deleteAgreement(agreementId) {
    return this.delete(`/api/v2/agreements/enduser/${agreementId}/`);
  }

  /**
   * Accept end user agreement
   *
   * @param {string} agreementId - Agreement UUID
   * @param {Object} data - Acceptance data
   * @param {string} data.user_agent - User agent string
   * @param {string} data.ip_address - User IP address
   * @returns {Promise<Object>}
   */
  async acceptAgreement(agreementId, data) {
    return this.put(`/api/v2/agreements/enduser/${agreementId}/accept/`, data);
  }

  // ==================== Requisitions ====================

  /**
   * List all requisitions
   *
   * @param {Object} [params] - Query parameters
   * @param {number} [params.limit] - Results per page
   * @param {number} [params.offset] - Offset for pagination
   * @returns {Promise<Object>}
   */
  async listRequisitions(params = {}) {
    return this.get('/api/v2/requisitions/', { query: params });
  }

  /**
   * Create requisition
   *
   * @param {Object} data - Requisition data
   * @param {string} data.redirect - Redirect URL after auth
   * @param {string} data.institution_id - Institution ID
   * @param {string} [data.reference] - Custom reference
   * @param {string} [data.agreement] - Agreement UUID
   * @param {string} [data.user_language] - User language code
   * @param {boolean} [data.account_selection] - Enable account selection
   * @param {boolean} [data.redirect_immediate] - Redirect immediately
   * @returns {Promise<Object>}
   */
  async createRequisition(data) {
    return this.post('/api/v2/requisitions/', data);
  }

  /**
   * Get requisition by ID
   *
   * @param {string} requisitionId - Requisition UUID
   * @returns {Promise<Object>}
   */
  async getRequisition(requisitionId) {
    return this.get(`/api/v2/requisitions/${requisitionId}/`);
  }

  /**
   * Delete requisition
   *
   * @param {string} requisitionId - Requisition UUID
   * @returns {Promise<Object>}
   */
  async deleteRequisition(requisitionId) {
    return this.delete(`/api/v2/requisitions/${requisitionId}/`);
  }

  // ==================== Payments ====================

  /**
   * List payments
   *
   * @param {Object} [params] - Query parameters
   * @param {number} [params.limit] - Results per page
   * @param {number} [params.offset] - Offset for pagination
   * @returns {Promise<Object>}
   */
  async listPayments(params = {}) {
    return this.get('/api/v2/payments/', { query: params });
  }

  /**
   * Create payment
   *
   * @param {Object} data - Payment data
   * @returns {Promise<Object>}
   */
  async createPayment(data) {
    return this.post('/api/v2/payments/', data);
  }

  /**
   * Get payment by ID
   *
   * @param {string} paymentId - Payment UUID
   * @returns {Promise<Object>}
   */
  async getPayment(paymentId) {
    return this.get(`/api/v2/payments/${paymentId}/`);
  }

  /**
   * Delete periodic payment
   *
   * @param {string} paymentId - Payment UUID
   * @returns {Promise<Object>}
   */
  async deletePayment(paymentId) {
    return this.delete(`/api/v2/payments/${paymentId}/`);
  }

  /**
   * List payment creditor accounts
   *
   * @param {Object} [params] - Query parameters
   * @returns {Promise<Object>}
   */
  async listCreditorAccounts(params = {}) {
    return this.get('/api/v2/payments/account/', { query: params });
  }

  /**
   * List payment creditors
   *
   * @param {Object} [params] - Query parameters
   * @returns {Promise<Object>}
   */
  async listCreditors(params = {}) {
    return this.get('/api/v2/payments/creditors/', { query: params });
  }

  /**
   * Create payment creditor
   *
   * @param {Object} data - Creditor data
   * @returns {Promise<Object>}
   */
  async createCreditor(data) {
    return this.post('/api/v2/payments/creditors/', data);
  }

  /**
   * Get payment creditor
   *
   * @param {string} creditorId - Creditor UUID
   * @returns {Promise<Object>}
   */
  async getCreditor(creditorId) {
    return this.get(`/api/v2/payments/creditors/${creditorId}/`);
  }

  /**
   * Delete payment creditor
   *
   * @param {string} creditorId - Creditor UUID
   * @returns {Promise<Object>}
   */
  async deleteCreditor(creditorId) {
    return this.delete(`/api/v2/payments/creditors/${creditorId}/`);
  }

  /**
   * Get minimum required fields for institution payments
   *
   * @param {string} institutionId - Institution ID
   * @returns {Promise<Object>}
   */
  async getPaymentFields(institutionId) {
    return this.get(`/api/v2/payments/fields/${institutionId}/`);
  }
}

/**
 * Create API client instance
 *
 * @param {string} [accessToken] - JWT access token
 * @returns {NordigenAPI}
 */
export function createClient(accessToken = null) {
  return new NordigenAPI(accessToken);
}
