import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as districtController from '../controllers/district.controller.js';
import { authenticate, authorise, scopeGuard } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/v1/districts:
 *   get:
 *     tags: [Districts]
 *     summary: List districts (scoped by user role)
 *     parameters:
 *       - in: query
 *         name: provinceId
 *         schema: { type: string }
 *         description: Filter by province
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [name, code, createdAt] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of districts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/District' }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 */
router.get(
  '/',
  scopeGuard,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sort').optional().isIn(['name', 'code', 'createdAt']),
    query('order').optional().isIn(['asc', 'desc']),
  ],
  handleValidation,
  districtController.list,
);

/**
 * @swagger
 * /api/v1/districts/{id}:
 *   get:
 *     tags: [Districts]
 *     summary: Get a district with its police stations and vehicle count
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: District detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/District' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:id',
  [param('id').notEmpty()],
  handleValidation,
  districtController.get,
);

/**
 * @swagger
 * /api/v1/districts:
 *   post:
 *     tags: [Districts]
 *     summary: Create a district (HQ_ADMIN only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DistrictInput'
 *     responses:
 *       201:
 *         description: District created
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  '/',
  authorise('HQ_ADMIN'),
  [
    body('name').trim().notEmpty().withMessage('District name is required'),
    body('code').trim().notEmpty().toUpperCase().isLength({ min: 2, max: 8 }),
    body('provinceId').notEmpty().withMessage('Province ID is required'),
  ],
  handleValidation,
  districtController.create,
);

/**
 * @swagger
 * /api/v1/districts/{id}:
 *   put:
 *     tags: [Districts]
 *     summary: Update a district (HQ_ADMIN only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DistrictInput'
 *     responses:
 *       200:
 *         description: District updated
 */
router.put(
  '/:id',
  authorise('HQ_ADMIN'),
  [
    param('id').notEmpty(),
    body('name').optional().trim().notEmpty(),
    body('code').optional().trim().toUpperCase(),
    body('provinceId').optional().notEmpty(),
  ],
  handleValidation,
  districtController.update,
);

/**
 * @swagger
 * /api/v1/districts/{id}:
 *   delete:
 *     tags: [Districts]
 *     summary: Delete a district (HQ_ADMIN only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Deleted
 *       409:
 *         description: Cannot delete — has police stations or vehicles
 */
router.delete('/:id', authorise('HQ_ADMIN'), districtController.remove);

export default router;
