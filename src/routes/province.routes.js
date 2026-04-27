import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as provinceController from '../controllers/province.controller.js';
import { authenticate, authorise } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';

const router = Router();

// All province routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/provinces:
 *   get:
 *     tags: [Provinces]
 *     summary: List all provinces
 *     description: Returns a paginated list of all 9 provinces. Supports filtering and sorting.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [name, code, createdAt], default: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or code
 *     responses:
 *       200:
 *         description: List of provinces
 *         headers:
 *           X-Total-Count:
 *             schema: { type: integer }
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Province'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sort').optional().isIn(['name', 'code', 'createdAt']),
    query('order').optional().isIn(['asc', 'desc']),
  ],
  handleValidation,
  provinceController.list,
);

/**
 * @swagger
 * /api/v1/provinces/{id}:
 *   get:
 *     tags: [Provinces]
 *     summary: Get a single province with its districts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Province with districts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/Province'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:id',
  [param('id').notEmpty()],
  handleValidation,
  provinceController.get,
);

/**
 * @swagger
 * /api/v1/provinces:
 *   post:
 *     tags: [Provinces]
 *     summary: Create a new province (HQ_ADMIN only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProvinceInput'
 *     responses:
 *       201:
 *         description: Province created
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: Province with that name/code already exists
 */
router.post(
  '/',
  authorise('HQ_ADMIN'),
  [
    body('name').trim().notEmpty().withMessage('Province name is required'),
    body('code')
      .trim()
      .notEmpty()
      .toUpperCase()
      .isLength({ min: 2, max: 6 })
      .withMessage('Province code must be 2–6 characters'),
  ],
  handleValidation,
  provinceController.create,
);

/**
 * @swagger
 * /api/v1/provinces/{id}:
 *   put:
 *     tags: [Provinces]
 *     summary: Update a province (HQ_ADMIN only)
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
 *             $ref: '#/components/schemas/ProvinceInput'
 *     responses:
 *       200:
 *         description: Province updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put(
  '/:id',
  authorise('HQ_ADMIN'),
  [
    param('id').notEmpty(),
    body('name').optional().trim().notEmpty(),
    body('code').optional().trim().toUpperCase().isLength({ min: 2, max: 6 }),
  ],
  handleValidation,
  provinceController.update,
);

/**
 * @swagger
 * /api/v1/provinces/{id}:
 *   delete:
 *     tags: [Provinces]
 *     summary: Delete a province (HQ_ADMIN only — only if no districts exist)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Province deleted
 *       409:
 *         description: Cannot delete — province has districts
 */
router.delete('/:id', authorise('HQ_ADMIN'), provinceController.remove);

export default router;
