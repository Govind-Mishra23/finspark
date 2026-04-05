require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Tenant = require('../models/Tenant');

const TENANTS = [
  { name: 'System Admin', email: 'admin@insightx.com', password: Tenant.hashPassword('admin123'), isAdmin: true, config: { piiMasking: false, trackingConsent: true } },
  { name: 'demo_bank', email: 'admin@demobank.com', password: Tenant.hashPassword('demo123'), config: { piiMasking: true, trackingConsent: true } },
  { name: 'fintech_corp', email: 'admin@fintechcorp.com', password: Tenant.hashPassword('fintech123'), config: { piiMasking: false, trackingConsent: true } },
  { name: 'credit_union', email: 'admin@creditunion.com', password: Tenant.hashPassword('credit123'), config: { piiMasking: true, trackingConsent: true } },
];

const EVENTS = [
  'Loan_Apply_Clicked',
  'Document_Upload_Started',
  'Document_Upload_Completed',
  'KYC_Verification_Started',
  'KYC_Verification_Completed',
  'Loan_Approved',
  'Loan_Rejected',
  'Dashboard_Viewed',
  'Profile_Updated',
  'Support_Contacted',
];

const FUNNEL_DROP_RATES = {
  'Loan_Apply_Clicked': 1.0,
  'Document_Upload_Started': 0.8,
  'Document_Upload_Completed': 0.7,
  'KYC_Verification_Started': 0.5,
  'KYC_Verification_Completed': 0.4,
  'Loan_Approved': 0.3,
  'Loan_Rejected': 0.1,
};

function randomDate(daysBack) {
  const now = Date.now();
  return new Date(now - Math.random() * daysBack * 24 * 60 * 60 * 1000);
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Event.deleteMany({});
    await Tenant.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create tenants
    const createdTenants = await Tenant.insertMany(TENANTS);
    console.log(`👥 Created ${createdTenants.length} tenants`);
    createdTenants.forEach((t) => console.log(`   ${t.name}: ${t.apiKey}`));

    // Generate events
    const events = [];
    const userCounts = [50, 35, 25]; // users per tenant

    createdTenants.forEach((tenant, ti) => {
      const numUsers = userCounts[ti];

      for (let u = 1; u <= numUsers; u++) {
        const userId = `user_${tenant.name}_${u}`;
        const sessionId = `sess_${Date.now()}_${u}`;

        EVENTS.forEach((eventName) => {
          const dropRate = FUNNEL_DROP_RATES[eventName];
          if (dropRate !== undefined && Math.random() > dropRate) return;

          // Generate 1-5 events per user per event type
          const count = eventName.includes('Dashboard') || eventName.includes('Profile')
            ? Math.ceil(Math.random() * 5)
            : Math.ceil(Math.random() * 2);

          for (let c = 0; c < count; c++) {
            events.push({
              eventName,
              userId,
              tenantId: tenant._id.toString(),
              sessionId,
              metadata: {
                source: ['web', 'mobile', 'api'][Math.floor(Math.random() * 3)],
                browser: ['Chrome', 'Firefox', 'Safari'][Math.floor(Math.random() * 3)],
                duration: Math.floor(Math.random() * 300) + 10,
              },
              timestamp: randomDate(30),
            });
          }
        });
      }
    });

    await Event.insertMany(events);
    console.log(`📊 Seeded ${events.length} events`);
    console.log('\n🎉 Seed complete! You can now start the server.');

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
