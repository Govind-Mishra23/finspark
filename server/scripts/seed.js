require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Tenant = require('../src/models/Tenant');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    await mongoose.connection.db.dropDatabase();
    console.log('Dropped Database InsightX');

    // Create admin
    const admin = await Tenant.create({
      name: 'Demo App Authority',
      email: 'admin@insightx.com',
      password: await Tenant.hashPassword('admin123'),
      isAdmin: false, // The Authority has no global privileges anymore!
      apiKey: 'insightx_admin_secret_key'
    });

    console.log(`Seeded Authority: ${admin.email}`);

    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
