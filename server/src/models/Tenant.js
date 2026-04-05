const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function comparePassword(plain, hashed) {
  return await bcrypt.compare(plain, hashed);
}

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
    },
    apiKey: {
      type: String,
      default: () => `ixk_${uuidv4().replace(/-/g, '')}`,
      unique: true,
      index: true,
    },
    config: {
      piiMasking: { type: Boolean, default: false },
      trackingConsent: { type: Boolean, default: true },
      requireConsent: { type: Boolean, default: false },
      deploymentModel: { type: String, enum: ['cloud', 'on-premise'], default: 'cloud' },
      allowedEvents: [String],
      allowedDomains: [String],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

tenantSchema.statics.hashPassword = hashPassword;
tenantSchema.statics.comparePassword = comparePassword;

module.exports = mongoose.model('Tenant', tenantSchema);
