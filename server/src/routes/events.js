const express = require('express');
const router = express.Router();
const { getEventModel } = require('../models/Event');
const { authenticate } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate Limiter
const eventLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1500, 
  message: { error: 'Too many tracking requests from this IP. Please try again later.' }
});

// Deep Recursive Masking
function deepMask(obj) {
  if (Array.isArray(obj)) {
    return obj.map(deepMask);
  } else if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (['email', 'phone', 'name', 'password'].includes(lowerKey)) {
        newObj[key] = '***masked***';
      } else {
        newObj[key] = deepMask(value);
      }
    }
    return newObj;
  }
  return obj;
}

// POST /api/events — Ingest single event
router.post('/', eventLimiter, authenticate, async (req, res) => {
  try {
    const { eventName, userId, metadata, sessionId } = req.body;

    if (!eventName || !userId) {
      return res.status(400).json({ error: 'eventName and userId are required.' });
    }

    // Deep PII masking if enabled in tenant configuration
    let processedMetadata = metadata || {};
    if (req.tenant.config.piiMasking) {
      processedMetadata = deepMask(processedMetadata);
    }

    const Event = getEventModel(req.tenant._id.toString());

    const event = await Event.create({
      eventName,
      userId,
      sessionId,
      metadata: processedMetadata,
      timestamp: new Date(),
    });

    res.status(201).json({ success: true, eventId: event._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to ingest event.', details: err.message });
  }
});

// POST /api/events/batch — Ingest batch events
router.post('/batch', eventLimiter, authenticate, async (req, res) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'events array is required.' });
    }
    if (events.length > 2000) {
      return res.status(413).json({ error: 'Payload too large. Maximum 2000 events per batch.' });
    }

    const docs = events.map((e) => {
      let processedMetadata = e.metadata || {};
      if (req.tenant.config.piiMasking) {
        processedMetadata = deepMask(processedMetadata);
      }

      return {
        eventName: e.eventName,
        userId: e.userId,
        sessionId: e.sessionId,
        metadata: processedMetadata,
        timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
      };
    });

    const Event = getEventModel(req.tenant._id.toString());
    const result = await Event.insertMany(docs);
    res.status(201).json({ success: true, count: result.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to ingest batch.', details: err.message });
  }
});

module.exports = router;
