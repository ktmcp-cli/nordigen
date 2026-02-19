import axios from 'axios';
import { getConfig, setConfig, hasValidToken } from './config.js';

const NORDIGEN_BASE_URL = 'https://ob.nordigen.com/api/v2';

/**
 * Obtain a new JWT access token
 */
async function obtainAccessToken() {
  const secretId = getConfig('secretId');
  const secretKey = getConfig('secretKey');

  if (!secretId || !secretKey) {
    throw new Error('Credentials not configured. Run: nordigencom config set --secret-id <id> --secret-key <key>');
  }

  try {
    const response = await axios.post(`${NORDIGEN_BASE_URL}/token/new/`, {
      secret_id: secretId,
      secret_key: secretKey
    });

    const { access, refresh, access_expires } = response.data;
    setConfig('accessToken', access);
    if (refresh) setConfig('refreshToken', refresh);
    // access_expires is in seconds
    setConfig('tokenExpiry', Date.now() + (access_expires * 1000));

    return access;
  } catch (error) {
    const msg = error.response?.data?.summary || error.message;
    throw new Error(`Token request failed: ${msg}`);
  }
}

/**
 * Refresh the access token using refresh token
 */
async function refreshAccessToken() {
  const refreshToken = getConfig('refreshToken');

  if (!refreshToken) {
    return await obtainAccessToken();
  }

  try {
    const response = await axios.post(`${NORDIGEN_BASE_URL}/token/refresh/`, {
      refresh: refreshToken
    });

    const { access, access_expires } = response.data;
    setConfig('accessToken', access);
    setConfig('tokenExpiry', Date.now() + (access_expires * 1000));

    return access;
  } catch (error) {
    // If refresh fails, try to get a new token
    return await obtainAccessToken();
  }
}

/**
 * Get a valid access token
 */
async function getAccessToken() {
  if (hasValidToken()) {
    return getConfig('accessToken');
  }

  return await refreshAccessToken();
}

/**
 * Make an authenticated API request
 */
async function apiRequest(method, endpoint, data = null, params = null) {
  const token = await getAccessToken();

  const config = {
    method,
    url: `${NORDIGEN_BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };

  if (params) config.params = params;
  if (data) config.data = data;

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

function handleApiError(error) {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (status === 401) {
      throw new Error('Authentication failed. Run: nordigencom auth login');
    } else if (status === 403) {
      throw new Error('Access forbidden. Check your API permissions.');
    } else if (status === 404) {
      throw new Error('Resource not found.');
    } else if (status === 429) {
      throw new Error('Rate limit exceeded. Please wait before retrying.');
    } else {
      const message = data?.summary || data?.detail || data?.message || JSON.stringify(data);
      throw new Error(`API Error (${status}): ${message}`);
    }
  } else if (error.request) {
    throw new Error('No response from Nordigen API. Check your internet connection.');
  } else {
    throw error;
  }
}

// ============================================================
// INSTITUTIONS
// ============================================================

export async function listInstitutions({ country } = {}) {
  const params = {};
  if (country) params.country = country;

  const data = await apiRequest('GET', '/institutions/', null, params);
  return data || [];
}

export async function getInstitution(institutionId) {
  return await apiRequest('GET', `/institutions/${institutionId}/`);
}

// ============================================================
// AGREEMENTS
// ============================================================

export async function listAgreements({ limit = 100, offset = 0 } = {}) {
  const data = await apiRequest('GET', '/agreements/enduser/', null, { limit, offset });
  return data?.results || [];
}

export async function getAgreement(agreementId) {
  return await apiRequest('GET', `/agreements/enduser/${agreementId}/`);
}

export async function createAgreement({ institutionId, maxHistoricalDays = 90, accessValidForDays = 90, accessScope = [] }) {
  const body = {
    institution_id: institutionId,
    max_historical_days: maxHistoricalDays,
    access_valid_for_days: accessValidForDays
  };

  if (accessScope.length > 0) {
    body.access_scope = accessScope;
  }

  return await apiRequest('POST', '/agreements/enduser/', body);
}

export async function deleteAgreement(agreementId) {
  return await apiRequest('DELETE', `/agreements/enduser/${agreementId}/`);
}

export async function acceptAgreement(agreementId, userAgent, ipAddress) {
  const body = {
    user_agent: userAgent,
    ip_address: ipAddress
  };
  return await apiRequest('PUT', `/agreements/enduser/${agreementId}/accept/`, body);
}

// ============================================================
// REQUISITIONS
// ============================================================

export async function listRequisitions({ limit = 100, offset = 0 } = {}) {
  const data = await apiRequest('GET', '/requisitions/', null, { limit, offset });
  return data?.results || [];
}

export async function getRequisition(requisitionId) {
  return await apiRequest('GET', `/requisitions/${requisitionId}/`);
}

export async function createRequisition({ redirect, institutionId, reference, agreementId, userLanguage = 'EN' }) {
  const body = {
    redirect,
    institution_id: institutionId,
    reference,
    user_language: userLanguage
  };

  if (agreementId) {
    body.agreement = agreementId;
  }

  return await apiRequest('POST', '/requisitions/', body);
}

export async function deleteRequisition(requisitionId) {
  return await apiRequest('DELETE', `/requisitions/${requisitionId}/`);
}

// ============================================================
// ACCOUNTS
// ============================================================

export async function getAccountMetadata(accountId) {
  return await apiRequest('GET', `/accounts/${accountId}/`);
}

export async function getAccountBalances(accountId) {
  return await apiRequest('GET', `/accounts/${accountId}/balances/`);
}

export async function getAccountDetails(accountId) {
  return await apiRequest('GET', `/accounts/${accountId}/details/`);
}

export async function getAccountTransactions(accountId) {
  return await apiRequest('GET', `/accounts/${accountId}/transactions/`);
}
