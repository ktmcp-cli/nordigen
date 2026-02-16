/**
 * API Client Tests
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { NordigenAPI } from '../src/lib/api.js';

test('NordigenAPI - initialization', () => {
  const api = new NordigenAPI();
  assert.ok(api);
  assert.equal(api.baseURL, 'https://ob.nordigen.com');
});

test('NordigenAPI - request URL building', async () => {
  const api = new NordigenAPI('test-token');

  // Mock fetch for testing
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    assert.ok(url.includes('/api/v2/'));
    return {
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({ test: 'data' })
    };
  };

  try {
    const result = await api.get('/api/v2/test');
    assert.deepEqual(result, { test: 'data' });
  } finally {
    global.fetch = originalFetch;
  }
});

test('NordigenAPI - query parameters', async () => {
  const api = new NordigenAPI('test-token');

  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    assert.ok(url.includes('country=GB'));
    assert.ok(url.includes('limit=10'));
    return {
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ([])
    };
  };

  try {
    await api.get('/api/v2/institutions/', {
      query: { country: 'GB', limit: 10 }
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test('NordigenAPI - error handling', async () => {
  const api = new NordigenAPI('test-token');

  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 401,
    statusText: 'Unauthorized',
    headers: new Map([['content-type', 'application/json']]),
    json: async () => ({
      status_code: 401,
      summary: 'Invalid token',
      detail: 'Token is invalid or expired'
    })
  });

  try {
    await assert.rejects(
      async () => await api.get('/api/v2/accounts/test'),
      (error) => {
        assert.equal(error.status, 401);
        assert.ok(error.message.includes('Invalid token'));
        return true;
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});
