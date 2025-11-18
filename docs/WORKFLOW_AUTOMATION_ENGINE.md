# Workflow Automation Engine

## Overview

The Workflow Automation Engine allows businesses to automate repetitive tasks based on triggers and conditions.

---

## Core Concepts

### 1. Triggers

Events that start a workflow:

- **INVOICE_CREATED**: New invoice created
- **INVOICE_SENT**: Invoice sent to customer
- **INVOICE_PAID**: Invoice fully paid
- **INVOICE_OVERDUE**: Invoice past due date
- **QUOTE_CREATED**: New quote created
- **QUOTE_APPROVED**: Quote approved by customer
- **PAYMENT_RECEIVED**: Payment recorded
- **EXPENSE_CREATED**: New expense created
- **CUSTOMER_CREATED**: New customer added
- **PRODUCT_LOW_STOCK**: Product below minimum stock
- **SCHEDULED**: Time-based trigger (cron)

### 2. Conditions

Optional filters that must be met:

```javascript
{
  status: 'SENT',
  amountGreaterThan: 1000,
  amountLessThan: 10000,
  customerId: 'customer123'
}
```

### 3. Actions

Tasks executed when workflow runs:

- **SEND_EMAIL**: Send email notification
- **SEND_SMS**: Send SMS notification
- **CREATE_TASK**: Create follow-up task
- **UPDATE_STATUS**: Update document status
- **WEBHOOK**: Call external webhook
- **DELAY**: Wait before next action
- **CONDITIONAL**: Branch based on condition

---

## Workflow Execution Flow

### 1. Trigger Detection

When an event occurs (e.g., invoice sent):

```javascript
// In invoiceController.js
await WorkflowService.executeWorkflows('INVOICE_SENT', {
  documentType: 'INVOICE',
  documentId: invoice._id,
  invoice: invoice.toObject(),
  status: 'SENT',
  amount: invoice.total,
  customerId: invoice.customerId
}, req.user.tenantId);
```

### 2. Workflow Matching

Find active workflows for the trigger:

```javascript
const workflows = await Workflow.find({
  tenantId,
  isActive: true,
  'trigger.type': triggerType
});
```

### 3. Condition Evaluation

Check if conditions are met:

```javascript
if (!this.checkConditions(workflow.trigger.conditions, context)) {
  return; // Skip this workflow
}
```

### 4. Action Execution

Execute actions in order:

```javascript
for (const action of sortedActions) {
  await this.executeAction(action, context);
}
```

---

## Variable Resolution

### Template Variables

Actions can use dynamic variables:

- `{{customer.email}}` - Customer email
- `{{invoice.number}}` - Invoice number
- `{{invoice.total}}` - Invoice amount
- `{{invoice.dueDate}}` - Due date

### Example

```javascript
{
  type: 'SEND_EMAIL',
  config: {
    to: '{{customer.email}}',
    subject: 'Invoice {{invoice.number}} is due',
    body: 'Your invoice for {{invoice.total}} is due on {{invoice.dueDate}}'
  }
}
```

**Location**: `backend/src/services/workflowService.js` → `resolveVariable()`

---

## Action Types

### 1. SEND_EMAIL

```javascript
{
  type: 'SEND_EMAIL',
  config: {
    to: '{{customer.email}}',
    subject: 'Invoice {{invoice.number}}',
    template: 'invoice_reminder',
    body: 'Custom email body'
  }
}
```

### 2. SEND_SMS

```javascript
{
  type: 'SEND_SMS',
  config: {
    to: '{{customer.phone}}',
    message: 'Your invoice {{invoice.number}} is due'
  }
}
```

### 3. CREATE_TASK

```javascript
{
  type: 'CREATE_TASK',
  config: {
    title: 'Follow up on invoice {{invoice.number}}',
    assignTo: 'user123',
    dueDate: '+7 days'
  }
}
```

### 4. UPDATE_STATUS

```javascript
{
  type: 'UPDATE_STATUS',
  config: {
    status: 'APPROVED'
  }
}
```

### 5. WEBHOOK

```javascript
{
  type: 'WEBHOOK',
  config: {
    url: 'https://example.com/webhook',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer token'
    },
    body: {
      invoiceId: '{{invoice._id}}',
      amount: '{{invoice.total}}'
    }
  }
}
```

### 6. DELAY

```javascript
{
  type: 'DELAY',
  config: {
    duration: 3600 // seconds
  }
}
```

### 7. CONDITIONAL

```javascript
{
  type: 'CONDITIONAL',
  config: {
    condition: 'amount > 1000',
    trueActions: [
      { type: 'SEND_EMAIL', config: {...} }
    ],
    falseActions: [
      { type: 'SEND_SMS', config: {...} }
    ]
  }
}
```

---

## Workflow Model

```javascript
{
  name: "Send Invoice Reminder",
  description: "Send reminder when invoice is overdue",
  isActive: true,
  trigger: {
    type: "INVOICE_OVERDUE",
    conditions: {
      amountGreaterThan: 500
    }
  },
  actions: [
    {
      type: "SEND_EMAIL",
      config: {
        to: "{{customer.email}}",
        subject: "Overdue Invoice {{invoice.number}}",
        template: "invoice_overdue"
      },
      order: 0
    },
    {
      type: "DELAY",
      config: {
        duration: 86400 // 24 hours
      },
      order: 1
    },
    {
      type: "SEND_SMS",
      config: {
        to: "{{customer.phone}}",
        message: "Invoice {{invoice.number}} is overdue"
      },
      order: 2
    }
  ],
  tenantId: ObjectId,
  runCount: 10,
  successCount: 9,
  failureCount: 1,
  lastRun: Date
}
```

---

## API Endpoints

### Create Workflow
```
POST /api/workflows
```

### Get Workflows
```
GET /api/workflows?triggerType=INVOICE_SENT&isActive=true
```

### Test Workflow
```
POST /api/workflows/:id/test
Body: { context: {...} }
```

### Toggle Workflow
```
POST /api/workflows/:id/toggle
```

---

## Testing Workflows

### Manual Test

```javascript
// Test workflow with mock context
POST /api/workflows/:id/test
{
  context: {
    documentType: 'INVOICE',
    invoice: {
      number: 'INV-001',
      total: 1000,
      customer: {
        email: 'test@example.com'
      }
    }
  }
}
```

---

## Best Practices

1. **Start Simple**: Begin with single-action workflows
2. **Test First**: Always test workflows before activating
3. **Monitor**: Check success/failure rates regularly
4. **Error Handling**: Workflows continue even if one action fails
5. **Variable Safety**: Always validate variable resolution

---

## Common Workflows

### Invoice Reminder
- Trigger: INVOICE_OVERDUE
- Action: SEND_EMAIL with reminder template

### Payment Confirmation
- Trigger: PAYMENT_RECEIVED
- Action: SEND_EMAIL with receipt

### Low Stock Alert
- Trigger: PRODUCT_LOW_STOCK
- Action: SEND_EMAIL to inventory manager

### Quote Follow-up
- Trigger: QUOTE_CREATED
- Action: CREATE_TASK for sales team

---

## Related Documentation

- `ACCOUNTING_ENGINE.md` - How workflows integrate with accounting
- `INTEGRATIONS_OVERVIEW.md` - Webhook and email integrations




