const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const Tenant = require('../../src/models/Tenant');

/**
 * Create a test user and tenant
 */
async function createTestUser(overrides = {}) {
  const tenant = await Tenant.create({
    name: overrides.companyName || 'Test Company',
    email: 'test@example.com',
    ...overrides.tenant
  });

  const user = await User.create({
    email: overrides.email || 'test@example.com',
    password: overrides.password || 'password123',
    firstName: overrides.firstName || 'Test',
    lastName: overrides.lastName || 'User',
    role: overrides.role || 'OWNER',
    tenantId: tenant._id,
    ...overrides.user
  });

  return { user, tenant };
}

/**
 * Generate a JWT token for testing
 */
function generateToken(user) {
  return jwt.sign(
    { userId: user._id, tenantId: user.tenantId },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );
}

/**
 * Create authenticated request headers
 */
function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`
  };
}

/**
 * Wait for async operations
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  createTestUser,
  generateToken,
  authHeaders,
  sleep
};





