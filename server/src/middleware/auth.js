const Tenant = require('../models/Tenant');

const authenticate = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API key. Provide x-api-key header.' });
  }

  try {
    const tenant = await Tenant.findOne({ apiKey, isActive: true });

    if (!tenant) {
      return res.status(403).json({ error: 'Invalid or inactive API key.' });
    }

    req.tenant = tenant;

    // Strict CORS Domain Validation
    const origin = req.headers.origin;
    const allowedDomains = tenant.config?.allowedDomains || [];
    
    // Only enforce if the tenant has actually configured allowed domains
    if (allowedDomains.length > 0 && origin) {
      if (!allowedDomains.includes(origin)) {
        return res.status(403).json({ error: 'Origin not allowed for this Tenant API Key.' });
      }
    }

    next();
  } catch (err) {
    res.status(500).json({ error: 'Authentication failed.' });
  }
};

module.exports = { authenticate };
