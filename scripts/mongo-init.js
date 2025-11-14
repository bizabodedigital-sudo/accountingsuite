// MongoDB initialization script
db = db.getSiblingDB('bizabode');

// Create collections with validation
db.createCollection('tenants', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'currency'],
      properties: {
        name: { bsonType: 'string' },
        currency: { bsonType: 'string' },
        plan: { bsonType: 'string' },
        isActive: { bsonType: 'bool' }
      }
    }
  }
});

db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'firstName', 'lastName', 'role', 'tenantId'],
      properties: {
        email: { bsonType: 'string' },
        password: { bsonType: 'string' },
        firstName: { bsonType: 'string' },
        lastName: { bsonType: 'string' },
        role: { bsonType: 'string' },
        tenantId: { bsonType: 'objectId' },
        isActive: { bsonType: 'bool' }
      }
    }
  }
});

db.createCollection('customers', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'tenantId'],
      properties: {
        name: { bsonType: 'string' },
        email: { bsonType: 'string' },
        phone: { bsonType: 'string' },
        tenantId: { bsonType: 'objectId' },
        isActive: { bsonType: 'bool' }
      }
    }
  }
});

db.createCollection('invoices', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['number', 'type', 'customerId', 'items', 'subtotal', 'total', 'status', 'dueDate', 'tenantId'],
      properties: {
        number: { bsonType: 'string' },
        type: { bsonType: 'string' },
        customerId: { bsonType: 'objectId' },
        items: { bsonType: 'array' },
        subtotal: { bsonType: 'number' },
        total: { bsonType: 'number' },
        status: { bsonType: 'string' },
        dueDate: { bsonType: 'date' },
        tenantId: { bsonType: 'objectId' }
      }
    }
  }
});

db.createCollection('expenses', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['description', 'amount', 'category', 'vendorId', 'date', 'tenantId'],
      properties: {
        description: { bsonType: 'string' },
        amount: { bsonType: 'number' },
        category: { bsonType: 'string' },
        vendorId: { bsonType: 'objectId' },
        date: { bsonType: 'date' },
        tenantId: { bsonType: 'objectId' }
      }
    }
  }
});

// Create indexes for better performance
db.tenants.createIndex({ name: 1 });
db.tenants.createIndex({ isActive: 1 });

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ tenantId: 1 });
db.users.createIndex({ role: 1 });

db.customers.createIndex({ name: 1, tenantId: 1 });
db.customers.createIndex({ email: 1, tenantId: 1 });
db.customers.createIndex({ tenantId: 1 });

db.invoices.createIndex({ number: 1 }, { unique: true });
db.invoices.createIndex({ customerId: 1, tenantId: 1 });
db.invoices.createIndex({ status: 1, tenantId: 1 });
db.invoices.createIndex({ issueDate: 1, tenantId: 1 });
db.invoices.createIndex({ dueDate: 1, tenantId: 1 });

db.expenses.createIndex({ date: 1, tenantId: 1 });
db.expenses.createIndex({ category: 1, tenantId: 1 });
db.expenses.createIndex({ vendorId: 1, tenantId: 1 });
db.expenses.createIndex({ tenantId: 1 });

print('MongoDB initialization completed successfully');















