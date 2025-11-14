# Bizabode Accounting Suite - Integrations Guide

This guide explains how to integrate Bizabode with external platforms using webhooks, API keys, and third-party automation tools like n8n, Zapier, and Make.

## Table of Contents

1. [Webhooks](#webhooks)
2. [API Keys](#api-keys)
3. [Integrations](#integrations)
4. [Platform-Specific Guides](#platform-specific-guides)
5. [Event Reference](#event-reference)

---

## Webhooks

Webhooks allow external systems to receive real-time notifications when events occur in Bizabode.

### Creating a Webhook

**Endpoint:** `POST /api/webhooks`

**Request Body:**
```json
{
  "name": "My n8n Webhook",
  "url": "https://your-n8n-instance.com/webhook/invoice-created",
  "events": ["invoice.created", "invoice.updated", "invoice.sent"],
  "platform": "n8n",
  "headers": {
    "X-Custom-Header": "value"
  },
  "retryConfig": {
    "maxRetries": 3,
    "retryDelay": 1000
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "My n8n Webhook",
    "url": "https://...",
    "events": ["invoice.created", "invoice.updated", "invoice.sent"],
    "secret": "generated-secret-key-here",
    "platform": "n8n",
    "isActive": true
  },
  "message": "Webhook created successfully. Save the secret - it will not be shown again."
}
```

**Important:** Save the `secret` immediately - it's only shown once and is required for webhook signature verification.

### Webhook Payload Format

When an event occurs, Bizabode sends a POST request to your webhook URL with the following payload:

```json
{
  "event": "invoice.created",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "_id": "...",
    "number": "INV-001",
    "customerId": {...},
    "items": [...],
    "total": 1000.00,
    "status": "DRAFT"
  },
  "webhookId": "..."
}
```

### Webhook Headers

Bizabode includes the following headers with each webhook request:

- `Content-Type: application/json`
- `X-Webhook-Event: invoice.created`
- `X-Webhook-Signature: <HMAC-SHA256 signature>`
- `X-Webhook-Timestamp: 2024-01-15T10:30:00.000Z`
- `User-Agent: Bizabode-Webhooks/1.0`

Platform-specific headers:
- n8n: `X-n8n-Webhook: true`
- Zapier: `X-Zapier-Webhook: true`
- Make: `X-Make-Webhook: true`

### Verifying Webhook Signatures

To verify that a webhook request is from Bizabode, verify the signature:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Webhook Events

Available events:
- `invoice.created` - New invoice created
- `invoice.updated` - Invoice updated
- `invoice.sent` - Invoice sent to customer
- `invoice.paid` - Invoice marked as paid
- `invoice.voided` - Invoice voided
- `invoice.deleted` - Invoice deleted
- `customer.created` - New customer created
- `customer.updated` - Customer updated
- `customer.deleted` - Customer deleted
- `expense.created` - New expense created
- `expense.updated` - Expense updated
- `expense.deleted` - Expense deleted
- `product.created` - New product created
- `product.updated` - Product updated
- `product.deleted` - Product deleted
- `payment.received` - Payment received
- `payment.refunded` - Payment refunded

### Managing Webhooks

- **List webhooks:** `GET /api/webhooks`
- **Get webhook:** `GET /api/webhooks/:id`
- **Update webhook:** `PUT /api/webhooks/:id`
- **Delete webhook:** `DELETE /api/webhooks/:id`
- **Test webhook:** `POST /api/webhooks/:id/test`
- **View deliveries:** `GET /api/webhooks/:id/deliveries`
- **Regenerate secret:** `POST /api/webhooks/:id/regenerate-secret`

---

## API Keys

API keys allow programmatic access to the Bizabode API without user authentication.

### Creating an API Key

**Endpoint:** `POST /api/api-keys`

**Request Body:**
```json
{
  "name": "My Integration API Key",
  "scopes": [
    "read:invoices",
    "write:invoices",
    "read:customers",
    "write:customers"
  ],
  "expiresAt": "2025-12-31T23:59:59.000Z",
  "rateLimit": {
    "requestsPerMinute": 60
  },
  "ipWhitelist": ["192.168.1.1", "10.0.0.0/8"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "My Integration API Key",
    "key": "biz_abc123...",
    "keyPrefix": "biz_abc123",
    "scopes": ["read:invoices", "write:invoices"],
    "isActive": true
  },
  "message": "API key created successfully. Save the key - it will not be shown again."
}
```

**Important:** Save the full `key` immediately - it's only shown once.

### Using API Keys

Include the API key in requests using one of these methods:

**Option 1: Authorization Header (Bearer)**
```bash
curl -H "Authorization: Bearer biz_abc123..." \
  https://api.bizabode.com/api/invoices
```

**Option 2: X-API-Key Header**
```bash
curl -H "X-API-Key: biz_abc123..." \
  https://api.bizabode.com/api/invoices
```

### API Key Scopes

Available scopes:
- `read:invoices` - Read invoices
- `write:invoices` - Create/update invoices
- `read:customers` - Read customers
- `write:customers` - Create/update customers
- `read:expenses` - Read expenses
- `write:expenses` - Create/update expenses
- `read:products` - Read products
- `write:products` - Create/update products
- `read:reports` - Read reports
- `webhooks:manage` - Manage webhooks

### Managing API Keys

- **List API keys:** `GET /api/api-keys`
- **Get API key:** `GET /api/api-keys/:id`
- **Update API key:** `PUT /api/api-keys/:id`
- **Delete API key:** `DELETE /api/api-keys/:id`
- **Revoke API key:** `POST /api/api-keys/:id/revoke`

---

## Integrations

Integrations provide a unified way to manage connections with external platforms.

### Creating an Integration

**Endpoint:** `POST /api/integrations`

**Request Body:**
```json
{
  "name": "n8n Automation",
  "type": "n8n",
  "config": {
    "workflowId": "123",
    "instanceUrl": "https://n8n.example.com"
  },
  "credentials": {
    "apiKey": "n8n-api-key"
  },
  "webhookId": "webhook-id-here"
}
```

### Integration Types

- `n8n` - n8n automation platform
- `zapier` - Zapier automation
- `make` - Make (formerly Integromat)
- `webhook` - Generic webhook integration
- `api` - API-based integration
- `custom` - Custom integration

### Managing Integrations

- **List integrations:** `GET /api/integrations`
- **Get integration:** `GET /api/integrations/:id`
- **Update integration:** `PUT /api/integrations/:id`
- **Delete integration:** `DELETE /api/integrations/:id`
- **Test integration:** `POST /api/integrations/:id/test`

---

## Platform-Specific Guides

### n8n Integration

1. **Create a Webhook Node in n8n:**
   - Add a "Webhook" node to your workflow
   - Copy the webhook URL

2. **Create Webhook in Bizabode:**
   ```bash
   POST /api/webhooks
   {
     "name": "n8n Invoice Webhook",
     "url": "https://your-n8n.com/webhook/invoice",
     "events": ["invoice.created", "invoice.sent"],
     "platform": "n8n"
   }
   ```

3. **Verify Signature in n8n:**
   - Use the "Function" node to verify the webhook signature
   - Compare `X-Webhook-Signature` header with computed HMAC

### Zapier Integration

1. **Create a Zapier Webhook:**
   - Create a new Zap with "Webhooks by Zapier" as trigger
   - Copy the webhook URL

2. **Create Webhook in Bizabode:**
   ```bash
   POST /api/webhooks
   {
     "name": "Zapier Integration",
     "url": "https://hooks.zapier.com/hooks/catch/...",
     "events": ["invoice.created"],
     "platform": "zapier"
   }
   ```

### Make (Integromat) Integration

1. **Create a Webhook in Make:**
   - Add "Webhooks" > "Custom webhook" module
   - Copy the webhook URL

2. **Create Webhook in Bizabode:**
   ```bash
   POST /api/webhooks
   {
     "name": "Make Integration",
     "url": "https://hook.make.com/...",
     "events": ["invoice.created", "customer.created"],
     "platform": "make"
   }
   ```

---

## Event Reference

### Invoice Events

#### invoice.created
Triggered when a new invoice is created.

**Payload:**
```json
{
  "event": "invoice.created",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "_id": "...",
    "number": "INV-001",
    "customerId": {...},
    "items": [...],
    "subtotal": 1000.00,
    "taxAmount": 150.00,
    "total": 1150.00,
    "status": "DRAFT",
    "issueDate": "2024-01-15",
    "dueDate": "2024-02-15"
  }
}
```

#### invoice.updated
Triggered when an invoice is updated.

#### invoice.sent
Triggered when an invoice is sent to a customer.

#### invoice.paid
Triggered when an invoice is marked as paid.

#### invoice.voided
Triggered when an invoice is voided.

#### invoice.deleted
Triggered when an invoice is deleted.

### Customer Events

#### customer.created
Triggered when a new customer is created.

**Payload:**
```json
{
  "event": "customer.created",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "_id": "...",
    "name": "Acme Corp",
    "email": "contact@acme.com",
    "phone": "+1-555-0123",
    "address": "123 Main St"
  }
}
```

#### customer.updated
Triggered when a customer is updated.

#### customer.deleted
Triggered when a customer is deleted.

### Expense Events

#### expense.created
Triggered when a new expense is created.

#### expense.updated
Triggered when an expense is updated.

#### expense.deleted
Triggered when an expense is deleted.

---

## Best Practices

1. **Security:**
   - Always verify webhook signatures
   - Use HTTPS for webhook URLs
   - Rotate API keys regularly
   - Use IP whitelisting for API keys when possible

2. **Reliability:**
   - Implement idempotency in your webhook handlers
   - Handle retries gracefully
   - Log all webhook deliveries for debugging

3. **Performance:**
   - Process webhooks asynchronously
   - Use appropriate rate limits
   - Monitor webhook delivery success rates

4. **Testing:**
   - Use the test endpoint to verify webhook configuration
   - Test with sample events before going live
   - Monitor webhook delivery logs

---

## Support

For integration support, please refer to:
- API Documentation: `/api/docs` (if available)
- Webhook Delivery Logs: `/api/webhooks/:id/deliveries`
- Integration Status: `/api/integrations/:id`


