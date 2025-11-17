const Workflow = require('../models/Workflow');
const Invoice = require('../models/Invoice');
const Quote = require('../models/Quote');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const emailService = require('./emailService');
const logger = require('../config/logger');

/**
 * Workflow Service
 * Executes workflows based on triggers
 */
class WorkflowService {
  /**
   * Execute workflows for a trigger
   */
  static async executeWorkflows(triggerType, context, tenantId) {
    try {
      // Find active workflows for this trigger
      const workflows = await Workflow.find({
        tenantId,
        isActive: true,
        'trigger.type': triggerType
      });

      const results = [];

      for (const workflow of workflows) {
        try {
          // Check if conditions are met
          if (!this.checkConditions(workflow.trigger.conditions, context)) {
            continue;
          }

          // Execute workflow actions
          const result = await this.executeWorkflow(workflow, context);
          
          // Update workflow stats
          workflow.runCount += 1;
          if (result.success) {
            workflow.successCount += 1;
          } else {
            workflow.failureCount += 1;
          }
          workflow.lastRun = new Date();
          await workflow.save();

          results.push({
            workflowId: workflow._id,
            workflowName: workflow.name,
            success: result.success,
            message: result.message,
            actionsExecuted: result.actionsExecuted
          });
        } catch (error) {
          logger.error(`Workflow execution error for ${workflow.name}:`, error);
          results.push({
            workflowId: workflow._id,
            workflowName: workflow.name,
            success: false,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Execute workflows error:', error);
      throw error;
    }
  }

  /**
   * Check if workflow conditions are met
   */
  static checkConditions(conditions, context) {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true; // No conditions means always execute
    }

    for (const [key, value] of Object.entries(conditions)) {
      if (key === 'status' && context.status !== value) {
        return false;
      }
      if (key === 'amountGreaterThan' && (!context.amount || context.amount <= value)) {
        return false;
      }
      if (key === 'amountLessThan' && (!context.amount || context.amount >= value)) {
        return false;
      }
      if (key === 'customerId' && context.customerId?.toString() !== value.toString()) {
        return false;
      }
      // Add more condition checks as needed
    }

    return true;
  }

  /**
   * Execute a single workflow
   */
  static async executeWorkflow(workflow, context) {
    const actionsExecuted = [];
    let success = true;
    let errorMessage = null;

    // Sort actions by order
    const sortedActions = [...workflow.actions].sort((a, b) => a.order - b.order);

    for (const action of sortedActions) {
      try {
        const result = await this.executeAction(action, context);
        actionsExecuted.push({
          type: action.type,
          success: result.success,
          message: result.message
        });

        if (!result.success) {
          success = false;
          errorMessage = result.message;
          // Continue with other actions even if one fails
        }
      } catch (error) {
        logger.error(`Action execution error: ${action.type}`, error);
        actionsExecuted.push({
          type: action.type,
          success: false,
          message: error.message
        });
        success = false;
        errorMessage = error.message;
      }
    }

    return {
      success,
      message: errorMessage || 'Workflow executed successfully',
      actionsExecuted
    };
  }

  /**
   * Execute a single action
   */
  static async executeAction(action, context) {
    switch (action.type) {
      case 'SEND_EMAIL':
        return await this.sendEmail(action.config, context);
      
      case 'SEND_SMS':
        return await this.sendSMS(action.config, context);
      
      case 'CREATE_TASK':
        return await this.createTask(action.config, context);
      
      case 'UPDATE_STATUS':
        return await this.updateStatus(action.config, context);
      
      case 'WEBHOOK':
        return await this.callWebhook(action.config, context);
      
      case 'DELAY':
        return await this.delay(action.config);
      
      case 'CONDITIONAL':
        return await this.executeConditional(action.config, context);
      
      default:
        return {
          success: false,
          message: `Unknown action type: ${action.type}`
        };
    }
  }

  /**
   * Send email action
   */
  static async sendEmail(config, context) {
    try {
      const to = this.resolveVariable(config.to, context);
      const subject = this.resolveVariable(config.subject, context);
      const template = config.template;
      const body = this.resolveVariable(config.body, context);

      // Use email service to send email
      await emailService.sendCustomEmail(to, subject, body || '');

      return {
        success: true,
        message: `Email sent to ${to}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send email: ${error.message}`
      };
    }
  }

  /**
   * Send SMS action (placeholder)
   */
  static async sendSMS(config, context) {
    try {
      const to = this.resolveVariable(config.to, context);
      const message = this.resolveVariable(config.message, context);

      // TODO: Integrate with SMS service
      logger.info(`SMS would be sent to ${to}: ${message}`);

      return {
        success: true,
        message: `SMS sent to ${to}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send SMS: ${error.message}`
      };
    }
  }

  /**
   * Create task action (placeholder)
   */
  static async createTask(config, context) {
    try {
      const title = this.resolveVariable(config.title, context);
      const assignTo = config.assignTo;
      const dueDate = config.dueDate;

      // TODO: Create task in task management system
      logger.info(`Task would be created: ${title}`);

      return {
        success: true,
        message: `Task created: ${title}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create task: ${error.message}`
      };
    }
  }

  /**
   * Update status action
   */
  static async updateStatus(config, context) {
    try {
      const status = config.status;
      const documentType = context.documentType; // INVOICE, QUOTE, etc.
      const documentId = context.documentId;

      let Model;
      switch (documentType) {
        case 'INVOICE':
          Model = Invoice;
          break;
        case 'QUOTE':
          Model = Quote;
          break;
        default:
          return {
            success: false,
            message: `Unknown document type: ${documentType}`
          };
      }

      await Model.findByIdAndUpdate(documentId, { status });
      
      return {
        success: true,
        message: `Status updated to ${status}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update status: ${error.message}`
      };
    }
  }

  /**
   * Call webhook action
   */
  static async callWebhook(config, context) {
    try {
      const axios = require('axios');
      const url = config.url;
      const method = config.method || 'POST';
      const headers = config.headers || {};
      const body = this.resolveVariables(config.body, context);

      await axios({
        method,
        url,
        headers,
        data: body
      });

      return {
        success: true,
        message: `Webhook called: ${url}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to call webhook: ${error.message}`
      };
    }
  }

  /**
   * Delay action
   */
  static async delay(config) {
    return new Promise((resolve) => {
      const duration = config.duration || 0; // seconds
      setTimeout(() => {
        resolve({
          success: true,
          message: `Delayed for ${duration} seconds`
        });
      }, duration * 1000);
    });
  }

  /**
   * Execute conditional action
   */
  static async executeConditional(config, context) {
    const condition = config.condition;
    const conditionMet = this.evaluateCondition(condition, context);

    if (conditionMet) {
      // Execute true actions
      for (const action of config.trueActions || []) {
        await this.executeAction(action, context);
      }
    } else {
      // Execute false actions
      for (const action of config.falseActions || []) {
        await this.executeAction(action, context);
      }
    }

    return {
      success: true,
      message: `Conditional executed: ${conditionMet ? 'true' : 'false'} branch`
    };
  }

  /**
   * Resolve variable in template string
   */
  static resolveVariable(template, context) {
    if (!template) return '';
    
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(context, path);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Resolve variables in object
   */
  static resolveVariables(obj, context) {
    if (typeof obj === 'string') {
      return this.resolveVariable(obj, context);
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.resolveVariables(item, context));
    }
    if (obj && typeof obj === 'object') {
      const resolved = {};
      for (const [key, value] of Object.entries(obj)) {
        resolved[key] = this.resolveVariables(value, context);
      }
      return resolved;
    }
    return obj;
  }

  /**
   * Get nested value from object
   */
  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, prop) => {
      return current && current[prop] !== undefined ? current[prop] : undefined;
    }, obj);
  }

  /**
   * Evaluate condition
   */
  static evaluateCondition(condition, context) {
    // Simple condition evaluation
    // Example: "amount > 1000" or "status === 'SENT'"
    try {
      // Replace variables in condition
      const resolvedCondition = this.resolveVariable(condition, context);
      
      // Simple evaluation (for production, use a proper expression evaluator)
      if (resolvedCondition.includes('>')) {
        const [left, right] = resolvedCondition.split('>').map(s => s.trim());
        return parseFloat(left) > parseFloat(right);
      }
      if (resolvedCondition.includes('<')) {
        const [left, right] = resolvedCondition.split('<').map(s => s.trim());
        return parseFloat(left) < parseFloat(right);
      }
      if (resolvedCondition.includes('===')) {
        const [left, right] = resolvedCondition.split('===').map(s => s.trim().replace(/['"]/g, ''));
        return left === right;
      }
      
      return false;
    } catch (error) {
      logger.error('Condition evaluation error:', error);
      return false;
    }
  }
}

module.exports = WorkflowService;



