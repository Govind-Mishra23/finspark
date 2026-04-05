const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for lightning-fast, scoped analytics queries
eventSchema.index({ eventName: 1, timestamp: -1 });
eventSchema.index({ timestamp: -1 });

module.exports = {
  getEventModel: (tenantId) => {
    const modelName = `Event_Tenant_${tenantId}`;
    if (mongoose.models[modelName]) return mongoose.models[modelName];
    return mongoose.model(modelName, eventSchema, `events_${tenantId}`);
  }
};
