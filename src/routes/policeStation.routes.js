import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as stationController from '../controllers/policeStation.controller.js';
import { authenticate, authorise, scopeGuard } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/v1/police-stations:
 *   get:
 *     tags: [Police Stations]
 *     summary: List police stations (scoped by user role)
 *     parameters:
 *       - in: query
 *         name: districtId
 *         schema: { type: string }
 *       - in: query
 *         name: provinceId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of police stations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/PoliceStation' }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 */
router.get(
  '/',
  scopeGuard,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  handleValidation,
  stationController.list,
);

/**
 * @swagger
 * /api/v1/police-stations/{id}:
 *   get:
 *     tags: [Police Stations]
 *     summary: Get a police station by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Police station detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/PoliceStation' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:id',
  [param('id').notEmpty()],
  handleValidation,
  stationController.get,
);

/**
 * @swagger
 * /api/v1/police-stations:
 *   post:
 *     tags: [Police Stations]
 *     summary: Create a police station (HQ_ADMIN or PROVINCIAL_ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PoliceStationInput'
 *     responses:
 *       201:
 *         description: Police station created
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  '/',
  authorise('HQ_ADMIN', 'PROVINCIAL_ADMIN'),
  [
    body('name').trim().notEmpty().withMessage('Station name is required'),
    body('code').trim().notEmpty().toUpperCase().isLength({ min: 2, max: 12 }),
    body('districtId').notEmpty().withMessage('District ID is required'),
    body('address').optional().trim(),
    body('contact').optional().trim(),
  ],
  handleValidation,
  stationController.create,
);

/**
 * @swagger
 * /api/v1/police-stations/{id}:
 *   put:
 *     tags: [Police Stations]
 *     summary: Update a police station (HQ_ADMIN or PROVINCIAL_ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PoliceStationInput'
 *     responses:
 *       200:
 *         description: Updated
 */
router.put(
  '/:id',
  authorise('HQ_ADMIN', 'PROVINCIAL_ADMIN'),
  [
    param('id').notEmpty(),
    body('name').optional().trim().notEmpty(),
    body('code').optional().trim().toUpperCase(),
    body('address').optional().trim(),
    body('contact').optional().trim(),
  ],
  handleValidation,
  stationController.update,
);

/**
 * @swagger
 * /api/v1/police-stations/{id}:
 *   delete:
 *     tags: [Police Stations]
 *     summary: Delete a police station (HQ_ADMIN only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Deleted
 *       409:
 *         description: Cannot delete — has assigned users
 */
router.delete('/:id', authorise('HQ_ADMIN'), stationController.remove);

export default router;
