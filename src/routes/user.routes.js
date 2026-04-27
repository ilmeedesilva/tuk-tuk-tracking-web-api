import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as userController from '../controllers/user.controller.js';
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
 * /api/v1/users:
 *   get:
 *     tags: [Users]
 *     summary: List users (scoped by caller role)
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [HQ_ADMIN, PROVINCIAL_ADMIN, DISTRICT_OFFICER, STATION_OFFICER, DEVICE]
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: districtId
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
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/User' }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 */
router.get(
  '/',
  authoriseMinRole('DISTRICT_OFFICER'),
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('role')
      .optional()
      .isIn([
        'HQ_ADMIN',
        'PROVINCIAL_ADMIN',
        'DISTRICT_OFFICER',
        'STATION_OFFICER',
        'DEVICE',
      ]),
    query('isActive').optional().isBoolean(),
  ],
  handleValidation,
  userController.list,
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User detail
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:id',
  authoriseMinRole('DISTRICT_OFFICER'),
  [param('id').notEmpty()],
  handleValidation,
  userController.get,
);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a user (HQ_ADMIN or PROVINCIAL_ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: User created
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: Username or email already taken
 */
router.post(
  '/',
  authorise('HQ_ADMIN', 'PROVINCIAL_ADMIN'),
  [
    body('username').trim().notEmpty().isLength({ min: 3, max: 50 }),
    body('password')
      .notEmpty()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('email').normalizeEmail().isEmail(),
    body('fullName').trim().notEmpty(),
    body('role').isIn([
      'HQ_ADMIN',
      'PROVINCIAL_ADMIN',
      'DISTRICT_OFFICER',
      'STATION_OFFICER',
      'DEVICE',
    ]),
    body('provinceId').optional().notEmpty(),
    body('districtId').optional().notEmpty(),
    body('policeStationId').optional().notEmpty(),
  ],
  handleValidation,
  userController.create,
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update a user (HQ_ADMIN or PROVINCIAL_ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       200:
 *         description: User updated
 */
router.put(
  '/:id',
  authorise('HQ_ADMIN', 'PROVINCIAL_ADMIN'),
  [
    param('id').notEmpty(),
    body('email').optional().normalizeEmail().isEmail(),
    body('password').optional().isLength({ min: 8 }),
    body('fullName').optional().trim().notEmpty(),
  ],
  handleValidation,
  userController.update,
);

/**
 * @swagger
 * /api/v1/users/{id}/activate:
 *   patch:
 *     tags: [Users]
 *     summary: Activate a user account (HQ_ADMIN or PROVINCIAL_ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User activated
 */
router.patch(
  '/:id/activate',
  authorise('HQ_ADMIN', 'PROVINCIAL_ADMIN'),
  userController.activate,
);

/**
 * @swagger
 * /api/v1/users/{id}/deactivate:
 *   patch:
 *     tags: [Users]
 *     summary: Deactivate a user account (HQ_ADMIN or PROVINCIAL_ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deactivated
 */
router.patch(
  '/:id/deactivate',
  authorise('HQ_ADMIN', 'PROVINCIAL_ADMIN'),
  userController.deactivate,
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Permanently delete a user (HQ_ADMIN only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Deleted
 */
router.delete('/:id', authorise('HQ_ADMIN'), userController.remove);

export default router;
