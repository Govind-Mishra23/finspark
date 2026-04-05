const Tenant = require('../models/Tenant');

function maskApiKey(apiKey) {
  if (!apiKey) return 'none';
  if (apiKey.length <= 10) return apiKey;
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}

const authenticate = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    console.warn('[auth] reject 401 missing x-api-key', {
      path: req.originalUrl,
      origin: req.headers.origin || 'none',
      method: req.method,
    });
    return res.status(401).json({ error: 'Missing API key. Provide x-api-key header.' });
  }

  try {
    const tenant = await Tenant.findOne({ apiKey, isActive: true });

    if (!tenant) {
      console.warn('[auth] reject 403 invalid api key', {
        path: req.originalUrl,
        origin: req.headers.origin || 'none',
        method: req.method,
        apiKey: maskApiKey(apiKey),
      });
      return res.status(403).json({ error: 'Invalid or inactive API key.' });
    }

    req.tenant = tenant;

    // Strict CORS Domain Validation
    const origin = req.headers.origin;
    const allowedDomains = tenant.config?.allowedDomains || [];

    const isLocalDevOrigin = (value) => {
      if (!value) return false;
      try {
        const url = new URL(value);
        return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
      } catch {
        return false;
      }
    };
    
    // Only enforce if the tenant has actually configured allowed domains
    if (allowedDomains.length > 0 && origin) {
      if (!allowedDomains.includes(origin) && !isLocalDevOrigin(origin)) {
        console.warn('[auth] reject 403 origin blocked', {
          path: req.originalUrl,
          origin,
          method: req.method,
          tenant: tenant.name,
          apiKey: maskApiKey(apiKey),
          allowedDomains,
        });
        return res.status(403).json({ error: 'Origin not allowed for this Tenant API Key.' });
      }
    }

    next();
  } catch (err) {
    res.status(500).json({ error: 'Authentication failed.' });
  }
};

module.exports = { authenticate };
