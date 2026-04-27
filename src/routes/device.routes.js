import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as deviceController from '../controllers/device.controller.js';
import {
  authenticate,
  authorise,
  authoriseMinRole,
} from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/v1/devices:
 *   get:
 *     tags: [Devices]
 *     summary: List GPS tracking devices
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [UNASSIGNED, ASSIGNED, DECOMMISSIONED] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by serial number or model
 *     responses:
 *       200:
 *         description: List of devices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Device' }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 */
router.get(
  '/',
  authoriseMinRole('DISTRICT_OFFICER'),
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status')
      .optional()
      .isIn(['UNASSIGNED', 'ASSIGNED', 'DECOMMISSIONED']),
  ],
  handleValidation,
  deviceController.list,
);

/**
 * @swagger
 * /api/v1/devices/{id}:
 *   get:
 *     tags: [Devices]
 *     summary: Get a device by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Device detail
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:id',
  authoriseMinRole('DISTRICT_OFFICER'),
  [param('id').notEmpty()],
  handleValidation,
  deviceController.get,
);

/**
 * @swagger
 * /api/v1/devices:
 *   post:
 *     tags: [Devices]
 *     summary: Register a new GPS device (HQ_ADMIN only)
 *     description: |
 *       Registers a new GPS hardware device. A corresponding DEVICE-role user account
 *       should be created separately with the device's serial number as the username.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeviceInput'
 *     responses:
 *       201:
 *         description: Device registered
 *       409:
 *         description: Serial number already exists
 */
router.post(
  '/',
  authorise('HQ_ADMIN'),
  [
    body('serialNumber')
      .trim()
      .notEmpty()
      .withMessage('Serial number is required'),
    body('model').optional().trim(),
    body('firmwareVersion').optional().trim(),
    body('simIccid').optional().trim(),
  ],
  handleValidation,
  deviceController.create,
);

/**
 * @swagger
 * /api/v1/devices/{id}:
 *   put:
 *     tags: [Devices]
 *     summary: Update device metadata (HQ_ADMIN only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeviceInput'
 *     responses:
 *       200:
 *         description: Device updated
 */
router.put(
  '/:id',
  authorise('HQ_ADMIN'),
  [
    param('id').notEmpty(),
    body('model').optional().trim(),
    body('firmwareVersion').optional().trim(),
  ],
  handleValidation,
  deviceController.update,
);

/**
 * @swagger
 * /api/v1/devices/{id}/assign:
 *   patch:
 *     tags: [Devices]
 *     summary: Assign device to a vehicle (HQ_ADMIN or DISTRICT_OFFICER)
 *     description: |
 *       Assigns a GPS device to a tuk-tuk. Enforces the one-device-per-vehicle
 *       constraint at both the application and database level. A device cannot be
 *       reassigned while already ASSIGNED — it must be unassigned first.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Device ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId]
 *             properties:
 *               vehicleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device assigned to vehicle
 *       409:
 *         description: Device already assigned or vehicle already has a device
 */
router.patch(
  '/:id/assign',
  authorise('HQ_ADMIN', 'DISTRICT_OFFICER'),
  [
    param('id').notEmpty(),
    body('vehicleId').notEmpty().withMessage('Vehicle ID is required'),
  ],
  handleValidation,
  deviceController.assign,
);

/**
 * @swagger
 * /api/v1/devices/{id}/unassign:
 *   patch:
 *     tags: [Devices]
 *     summary: Unassign a device from its vehicle (HQ_ADMIN only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Device unassigned
 *       409:
 *         description: Device is not currently assigned
 */
router.patch('/:id/unassign', authorise('HQ_ADMIN'), deviceController.unassign);

/**
 * @swagger
 * /api/v1/devices/{id}/decommission:
 *   patch:
 *     tags: [Devices]
 *     summary: Decommission a device (HQ_ADMIN only)
 *     description: Permanently retires a device. Auto-unassigns from vehicle if currently assigned.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Device decommissioned
 */
router.patch(
  '/:id/decommission',
  authorise('HQ_ADMIN'),
  deviceController.decommission,
);

export default router;
