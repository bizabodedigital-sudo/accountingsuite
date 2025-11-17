const AuditLog = require('../models/AuditLog');

/**
 * Audit Log Service
 * Centralized service for creating audit logs
 */
class AuditLogService {
  /**
   * Log an action
   */
  static async log({
    action,
    entityType,
    entityId = null,
    entityName = null,
    changes = null,
    oldValues = null,
    newValues = null,
    userId,
    userEmail = null,
    userRole = null,
    ipAddress = null,
    userAgent = null,
    status = 'SUCCESS',
    errorMessage = null,
    metadata = null,
    tenantId
  }) {
    try {
      // Get user info if not provided
      if (userId && (!userEmail || !userRole)) {
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (user) {
          userEmail = userEmail || user.email;
          userRole = userRole || user.role;
        }
      }

      return await AuditLog.log({
        action,
        entityType,
        entityId,
        entityName,
        changes,
        oldValues,
        newValues,
        userId,
        userEmail,
        userRole,
        ipAddress,
        userAgent,
        status,
        errorMessage,
        metadata,
        tenantId
      });
    } catch (error) {
      // Don't throw - audit logging should never break the main flow
      console.error('Audit log service error:', error);
      return null;
    }
  }

  /**
   * Log login attempt
   */
  static async logLogin(user, ipAddress, userAgent, success = true) {
    return await this.log({
      action: success ? 'LOGIN' : 'LOGIN_FAILED',
      entityType: 'USER',
      entityId: user?._id,
      entityName: user?.email,
      userId: user?._id || null,
      userEmail: user?.email,
      userRole: user?.role,
      ipAddress,
      userAgent,
      status: success ? 'SUCCESS' : 'FAILED',
      tenantId: user?.tenantId
    });
  }

  /**
   * Log entity creation
   */
  static async logCreate(entityType, entity, user, req = null) {
    return await this.log({
      action: `${entityType.toUpperCase()}_CREATED`,
      entityType: entityType.toUpperCase(),
      entityId: entity._id,
      entityName: entity.name || entity.number || entity.email || entity._id.toString(),
      newValues: this.extractValues(entity),
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('user-agent'),
      tenantId: user.tenantId
    });
  }

  /**
   * Log entity update
   */
  static async logUpdate(entityType, entity, oldEntity, user, req = null) {
    const changes = this.calculateChanges(oldEntity, entity);
    
    return await this.log({
      action: `${entityType.toUpperCase()}_UPDATED`,
      entityType: entityType.toUpperCase(),
      entityId: entity._id,
      entityName: entity.name || entity.number || entity.email || entity._id.toString(),
      changes,
      oldValues: this.extractValues(oldEntity),
      newValues: this.extractValues(entity),
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('user-agent'),
      tenantId: user.tenantId
    });
  }

  /**
   * Log entity deletion
   */
  static async logDelete(entityType, entity, user, req = null) {
    return await this.log({
      action: `${entityType.toUpperCase()}_DELETED`,
      entityType: entityType.toUpperCase(),
      entityId: entity._id,
      entityName: entity.name || entity.number || entity.email || entity._id.toString(),
      oldValues: this.extractValues(entity),
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('user-agent'),
      tenantId: user.tenantId
    });
  }

  /**
   * Extract values from entity (exclude sensitive fields)
   */
  static extractValues(entity) {
    if (!entity) return {};
    
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey'];
    const values = {};
    
    for (const [key, value] of Object.entries(entity.toObject ? entity.toObject() : entity)) {
      if (!sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        values[key] = value;
      }
    }
    
    return values;
  }

  /**
   * Calculate changes between old and new entity
   */
  static calculateChanges(oldEntity, newEntity) {
    if (!oldEntity || !newEntity) return {};
    
    const oldValues = this.extractValues(oldEntity);
    const newValues = this.extractValues(newEntity);
    const changes = {};
    
    for (const [key, newValue] of Object.entries(newValues)) {
      if (oldValues[key] !== newValue) {
        changes[key] = {
          old: oldValues[key],
          new: newValue
        };
      }
    }
    
    return changes;
  }
}

module.exports = AuditLogService;

