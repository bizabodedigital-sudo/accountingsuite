const express = require('express');
const { getDashboard } = require('../controllers/dashboardController');
const { protect, tenantFilter } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard statistics and analytics
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard statistics and trends
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                     trends:
 *                       type: object
 *                     alerts:
 *                       type: array
 */
router.get('/', protect, tenantFilter(), getDashboard);

module.exports = router;



