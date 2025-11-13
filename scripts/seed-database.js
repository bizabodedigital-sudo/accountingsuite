#!/usr/bin/env node

/**
 * Database Seeding Script
 * Run this script to seed the database with initial data
 * 
 * Usage:
 *   node scripts/seed-database.js
 * 
 * Or with environment variables:
 *   MONGODB_URI=mongodb://... node scripts/seed-database.js
 */

const path = require('path');
const seedData = require('../backend/src/scripts/seed');

console.log('🌱 Starting database seeding...');
console.log('');

seedData()
  .then(() => {
    console.log('');
    console.log('✅ Database seeding completed successfully!');
    console.log('');
    console.log('📋 Default login credentials:');
    console.log('  Owner: owner@jamaicatech.com / password123');
    console.log('  Accountant: accountant@jamaicatech.com / password123');
    console.log('  Staff: staff@jamaicatech.com / password123');
    console.log('');
    console.log('⚠️  IMPORTANT: Change these passwords immediately after first login!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Database seeding failed!');
    console.error(error);
    process.exit(1);
  });

