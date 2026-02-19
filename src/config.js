import Conf from 'conf';

const config = new Conf({
  projectName: 'nordigencom-cli',
  schema: {
    secretId: {
      type: 'string',
      default: ''
    },
    secretKey: {
      type: 'string',
      default: ''
    },
    accessToken: {
      type: 'string',
      default: ''
    },
    refreshToken: {
      type: 'string',
      default: ''
    },
    tokenExpiry: {
      type: 'number',
      default: 0
    }
  }
});

export function getConfig(key) {
  return config.get(key);
}

export function setConfig(key, value) {
  config.set(key, value);
}

export function getAllConfig() {
  return config.store;
}

export function clearConfig() {
  config.clear();
}

export function isConfigured() {
  const secretId = config.get('secretId');
  const secretKey = config.get('secretKey');
  return !!(secretId && secretKey);
}

export function hasValidToken() {
  const accessToken = config.get('accessToken');
  const tokenExpiry = config.get('tokenExpiry');
  if (!accessToken) return false;
  // Consider token valid if it expires more than 60 seconds from now
  return tokenExpiry > Date.now() + 60000;
}

export default config;
