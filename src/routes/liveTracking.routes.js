import { Router } from 'express';
import { param, query } from 'express-validator';
import * as liveController from '../controllers/liveTracking.controller.js';
import {
  authenticate,
  authoriseMinRole,
  scopeGuard,
} from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/v1/live-tracking:
 *   get:
 *     tags: [Live Tracking]
 *     summary: Get real-time last-known locations for all visible vehicles
 *     description: |
 *       Returns the last-known GPS position for each vehicle visible to the caller.
 *       Results are scoped by role:
 *       - HQ_ADMIN: all vehicles nationwide
 *       - PROVINCIAL_ADMIN: vehicles in assigned province
 *       - DISTRICT_OFFICER / STATION_OFFICER: vehicles in assigned district
 *
 *       Data served from the `last_known_locations` materialised table for O(1) reads.
 *     parameters:
 *       - in: query
 *         name: districtId
 *         schema: { type: string }
 *         description: Filter by district (HQ/Provincial only)
 *       - in: query
 *         name: provinceId
 *         schema: { type: string }
 *         description: Filter by province (HQ only)
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, INACTIVE, SUSPENDED] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 100 }
 *     responses:
 *       200:
 *         description: Live location snapshot
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/LastKnownLocation' }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/',
  authoriseMinRole('STATION_OFFICER'),
  scopeGuard,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  ],
  handleValidation,
  liveController.getLiveView,
);

/**
 * @swagger
 * /api/v1/live-tracking/summary:
 *   get:
 *     tags: [Live Tracking]
 *     summary: Dashboard summary counts (active, stale, no-data vehicles)
 *     parameters:
 *       - in: query
 *         name: districtId
 *         schema: { type: string }
 *       - in: query
 *         name: provinceId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Summary statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalVehicles: { type: integer }
 *                     activeVehicles: { type: integer }
 *                     vehiclesWithLocation: { type: integer }
 *                     vehiclesLive: { type: integer, description: 'Pinged in last 30 min' }
 *                     vehiclesStale: { type: integer, description: 'Last ping older than 30 min' }
 *                     vehiclesNoData: { type: integer, description: 'Never sent a ping' }
 */
router.get(
  '/summary',
  authoriseMinRole('STATION_OFFICER'),
  scopeGuard,
  liveController.getSummary,
);

/**
 * @swagger
 * /api/v1/live-tracking/{vehicleId}:
 *   get:
 *     tags: [Live Tracking]
 *     summary: Get the real-time position of a specific vehicle
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Last-known location with full vehicle and device info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/LastKnownLocation' }
 *       404:
 *         description: Vehicle not found or no location data yet
 */
router.get(
  '/:vehicleId',
  authoriseMinRole('STATION_OFFICER'),
  [param('vehicleId').notEmpty()],
  handleValidation,
  liveController.getVehicleLocation,
);

export default router;
