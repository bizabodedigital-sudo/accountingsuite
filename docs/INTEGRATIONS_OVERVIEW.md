# Integrations Overview

## Overview

Bizabode supports integrations with payment gateways, email services, SMS providers, and webhooks for external system connectivity.

---

## Payment Gateway Integrations

### Supported Gateways

1. **Stripe**
   - Payment Intents API
   - Webhook support for payment confirmation
   - Refund support

2. **PayPal**
   - Orders API
   - Capture payments
   - Refund support

3. **WiPay** (Jamaican)
   - Local payment processor
   - Placeholder for integration

4. **Lynk** (Jamaican)
   - Mobile payment solution
   - Placeholder for integration

5. **NCB** (National Commercial Bank - Jamaican)
   - Bank integration
   - Placeholder for integration

6. **JN Bank** (Jamaican)
   - Bank integration
   - Placeholder for integration

### Payment Flow

1. **Create Payment Intent**
   ```
   POST /api/payment-gateways/stripe/intent
   Body: { invoiceId, amount, currency }
   ```

2. **Confirm Payment**
   ```
   POST /api/payment-gateways/stripe/confirm
   Body: { paymentIntentId, invoiceId }
   ```

3. **Webhook Handling**
   ```
   POST /api/webhooks/stripe
   ```
   - Verifies webhook signature
   - Updates payment status
   - Creates payment record
   - Updates invoice status

### Code Location

- **Service**: `backend/src/services/paymentGatewayService.js`
- **Controller**: `backend/src/controllers/paymentGatewayController.js`
- **Routes**: `backend/src/routes/paymentGateways.js`

---

## Email Service Integration

### SMTP Configuration

Configure SMTP settings in tenant settings:

```javascript
{
  smtp: {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "your-email@gmail.com",
      pass: "your-password"
    }
  }
}
```

### Email Templates

Templates support variables:
- `{{customer.name}}`
- `{{invoice.number}}`
- `{{invoice.total}}`
- `{{invoice.dueDate}}`

**Location**: `backend/src/services/emailService.js`

---

## SMS Integration

### Placeholder Implementation

SMS service is ready for integration with providers like:
- Twilio
- Vonage (Nexmo)
- Local Jamaican SMS providers

**Location**: `backend/src/services/smsService.js` (to be created)

---

## Webhook System

### Outbound Webhooks

Send events to external systems:

**Supported Events**:
- `invoice.created`
- `invoice.sent`
- `invoice.paid`
- `payment.created`
- `expense.created`
- `customer.created`

### Webhook Configuration

```javascript
{
  url: "https://example.com/webhook",
  events: ["invoice.created", "invoice.paid"],
  secret: "webhook-secret",
  isActive: true
}
```

### Webhook Delivery

- Automatic retry on failure
- Delivery status tracking
- Signature verification

**Location**: 
- **Model**: `backend/src/models/Webhook.js`
- **Service**: `backend/src/services/webhookService.js`
- **Routes**: `backend/src/routes/webhooks.js`

---

## API Keys

### Generate API Key

```
POST /api/api-keys
Body: { name: "My Integration", permissions: ["read:invoices", "write:payments"] }
```

### Use API Key

```
Authorization: Bearer ba_xxxxxxxxxxxxx
```

**Location**: `backend/src/models/ApiKey.js`

---

## Integration Testing

### Test Payment Gateway

```javascript
// Test Stripe integration
POST /api/payment-gateways/stripe/test
```

### Test Webhook

```javascript
// Send test webhook
POST /api/webhooks/:id/test
```

---

## Security

- All API keys are hashed
- Webhook signatures verified
- Rate limiting on API endpoints
- Tenant isolation enforced

---

## Related Documentation

- `WORKFLOW_AUTOMATION_ENGINE.md` - Automated workflows can trigger webhooks
- Payment Gateway Service implementation





