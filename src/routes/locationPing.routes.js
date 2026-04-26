import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as pingController from '../controllers/locationPing.controller.js';
import {
  authenticate,
  authorise,
  authoriseMinRole,
} from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';
import { locationPingRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/v1/location-pings:
 *   post:
 *     tags: [Location Pings]
 *     summary: Submit a GPS location ping (DEVICE role only)
 *     description: |
 *       Called by GPS tracking devices to report their current location.
 *       The device is identified by the authenticated user's username (which must match
 *       a registered device's serial number).
 *       Rate limited to 120 pings per minute.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationPingInput'
 *     responses:
 *       201:
 *         description: Ping recorded and last-known location updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/LocationPing' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         description: Device not registered or not assigned to a vehicle
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post(
  '/',
  authorise('DEVICE'),
  locationPingRateLimiter,
  [
    body('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    body('timestamp')
      .isISO8601()
      .withMessage('Timestamp must be a valid ISO 8601 date-time'),
    body('speed').optional().isFloat({ min: 0, max: 300 }),
    body('heading').optional().isFloat({ min: 0, max: 360 }),
    body('altitude').optional().isFloat(),
    body('accuracy').optional().isFloat({ min: 0 }),
  ],
  handleValidation,
  pingController.submit,
);

/**
 * @swagger
 * /api/v1/location-pings:
 *   get:
 *     tags: [Location Pings]
 *     summary: Query location ping history (investigative use)
 *     description: |
 *       Query location pings across vehicles. Supports filtering by vehicle, district,
 *       province, and time window. Results are scoped to the caller's assigned jurisdiction.
 *     parameters:
 *       - in: query
 *         name: vehicleId
 *         schema: { type: string }
 *       - in: query
 *         name: districtId
 *         schema: { type: string }
 *       - in: query
 *         name: provinceId
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *         description: Start of time window (ISO 8601)
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *         description: End of time window (ISO 8601)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paginated location pings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/LocationPing' }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 */
router.get(
  '/',
  authoriseMinRole('STATION_OFFICER'),
  [
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  handleValidation,
  pingController.query,
);

/**
 * @swagger
 * /api/v1/location-pings/{vehicleId}/history:
 *   get:
 *     tags: [Location Pings]
 *     summary: Get movement history for a specific vehicle
 *     description: Returns time-ordered GPS pings for a single vehicle. Supports time-window filtering.
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100 }
 *     responses:
 *       200:
 *         description: Vehicle movement history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     vehicle: { $ref: '#/components/schemas/VehicleSummary' }
 *                     pings:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/LocationPing' }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:vehicleId/history',
  authoriseMinRole('STATION_OFFICER'),
  [
    param('vehicleId').notEmpty(),
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
    query('order').optional().isIn(['asc', 'desc']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
  ],
  handleValidation,
  pingController.getHistory,
);

export default router;
