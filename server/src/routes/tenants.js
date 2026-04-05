const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');

// POST /api/tenants — Register a new tenant with email/password
router.post('/', async (req, res) => {
  try {
    const { name, email, password, config } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }

    const existing = await Tenant.findOne({ $or: [{ name }, { email }] });
    if (existing) {
      return res.status(409).json({ error: 'Tenant with this name or email already exists.' });
    }

    const tenant = await Tenant.create({
      name,
      email,
      password: await Tenant.hashPassword(password),
      config,
    });

    res.status(201).json({
      success: true,
      tenant: {
        _id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        apiKey: tenant.apiKey,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create tenant.', details: err.message });
  }
});

// POST /api/tenants/login — Email/password login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Check login
    const tenant = await Tenant.findOne({
      email,
      isActive: true,
    });

    if (!tenant || !(await Tenant.comparePassword(password, tenant.password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.json({
      success: true,
      role: tenant.isAdmin ? 'admin' : 'tenant',
      apiKey: tenant.apiKey,
      tenant: tenant.isAdmin ? null : {
        _id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        apiKey: tenant.apiKey,
        config: tenant.config,
      },
      message: `Logged in as ${tenant.isAdmin ? 'admin' : 'tenant'}.`,
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.', details: err.message });
  }
});

// PUT /api/tenants/password — Change password for logged-in user
router.put('/password', async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Email, old password, and new password are required.' });
    }

    const tenant = await Tenant.findOne({ email });

    if (!tenant || !(await Tenant.comparePassword(oldPassword, tenant.password))) {
      return res.status(401).json({ error: 'Incorrect old password.' });
    }

    tenant.password = await Tenant.hashPassword(newPassword);
    await tenant.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password.', details: err.message });
  }
});
// POST /api/tenants/rotate-key — Generate a new API Key for the logged-in tenant
router.post('/rotate-key', async (req, res) => {
  try {
    const adminKey = req.headers['x-api-key'] || req.headers['x-admin-key'];
    if (!adminKey) return res.status(401).json({ error: 'Verification required to rotate key.' });

    const tenant = await Tenant.findOne({ apiKey: adminKey });
    if (!tenant) return res.status(403).json({ error: 'Invalid API key.' });

    const { v4: uuidv4 } = require('uuid');
    const newApiKey = `ixk_${uuidv4().replace(/-/g, '')}`;
    
    tenant.apiKey = newApiKey;
    await tenant.save();

    res.json({ success: true, apiKey: newApiKey });
  } catch (err) {
    res.status(500).json({ error: 'Failed to rotate API Key.', details: err.message });
  }
});

// PATCH /api/tenants/governance — Update governance & deployment config
router.patch('/governance', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ error: 'API key required.' });

    const tenant = await Tenant.findOne({ apiKey });
    if (!tenant) return res.status(403).json({ error: 'Invalid API key.' });

    const { piiMasking, requireConsent, deploymentModel, trackingConsent } = req.body;

    if (piiMasking !== undefined) tenant.config.piiMasking = piiMasking;
    if (requireConsent !== undefined) tenant.config.requireConsent = requireConsent;
    if (trackingConsent !== undefined) tenant.config.trackingConsent = trackingConsent;
    if (deploymentModel !== undefined) {
      if (!['cloud', 'on-premise'].includes(deploymentModel)) {
        return res.status(400).json({ error: 'deploymentModel must be "cloud" or "on-premise".' });
      }
      tenant.config.deploymentModel = deploymentModel;
    }

    await tenant.save();
    res.json({ success: true, config: tenant.config });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update governance settings.', details: err.message });
  }
});

module.exports = router;

