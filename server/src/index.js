require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const path = require('path');

const eventRoutes = require('./routes/events');
const analyticsRoutes = require('./routes/analytics');
const tenantRoutes = require('./routes/tenants');

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const { authenticate } = require('./middleware/auth');

// Routes
app.use('/api/events', eventRoutes);
app.use('/api/analytics', authenticate, analyticsRoutes);
app.use('/api/tenants', tenantRoutes);

// SDK Hosting
app.use('/sdk', express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to MongoDB & start server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 InsightX server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
