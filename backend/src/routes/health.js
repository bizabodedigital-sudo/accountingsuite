const express = require('express');
const { healthCheck, financialHealthCheck } = require('../controllers/healthController');
const { protect, tenantFilter } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: System health and financial validation endpoints
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: System health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                 checks:
 *                   type: object
 */
router.get('/', healthCheck);

/**
 * @swagger
 * /api/health/financial:
 *   get:
 *     summary: Financial health check (validates accounting integrity)
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Financial health check results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                 summary:
 *                   type: object
 *                 trialBalance:
 *                   type: object
 */
router.get('/financial', protect, tenantFilter(), financialHealthCheck);

module.exports = router;




