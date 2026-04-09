import { Router } from "express";
import { body, param, query } from "express-validator";
import * as vehicleController from "../controllers/vehicle.controller.js";
import {
  authenticate,
  authorise,
  authoriseMinRole,
  scopeGuard,
} from "../middleware/auth.js";
import { handleValidation } from "../middleware/validate.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/v1/vehicles:
 *   get:
 *     tags: [Vehicles]
 *     summary: List registered tuk-tuks (scoped by role)
 *     parameters:
 *       - in: query
 *         name: districtId
 *         schema: { type: string }
 *       - in: query
 *         name: provinceId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, INACTIVE, SUSPENDED] }
 *       - in: query
 *         name: hasDevice
 *         schema: { type: boolean }
 *         description: Filter vehicles that have/don't have a GPS device assigned
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [registrationNumber, driverName, status, createdAt] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by registration number, driver name, or NIC
 *     responses:
 *       200:
 *         description: Paginated list of vehicles including last known location
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Vehicle' }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 */
router.get(
  "/",
  scopeGuard,
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("status").optional().isIn(["ACTIVE", "INACTIVE", "SUSPENDED"]),
    query("sort")
      .optional()
      .isIn(["registrationNumber", "driverName", "status", "createdAt"]),
    query("order").optional().isIn(["asc", "desc"]),
  ],
  handleValidation,
  vehicleController.list,
);

/**
 * @swagger
 * /api/v1/vehicles/{id}:
 *   get:
 *     tags: [Vehicles]
 *     summary: Get a vehicle with device and last-known location
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Vehicle detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Vehicle' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/:id",
  [param("id").notEmpty()],
  handleValidation,
  vehicleController.get,
);

/**
 * @swagger
 * /api/v1/vehicles:
 *   post:
 *     tags: [Vehicles]
 *     summary: Register a new tuk-tuk (HQ_ADMIN, PROVINCIAL_ADMIN, or DISTRICT_OFFICER)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VehicleInput'
 *     responses:
 *       201:
 *         description: Vehicle registered
 *       409:
 *         description: Registration number or driver NIC already exists
 */
router.post(
  "/",
  authoriseMinRole("DISTRICT_OFFICER"),
  [
    body("registrationNumber")
      .trim()
      .notEmpty()
      .withMessage("Registration number is required"),
    body("driverName").trim().notEmpty(),
    body("driverNic").trim().notEmpty().withMessage("Driver NIC is required"),
    body("driverContact").optional().trim(),
    body("districtId").notEmpty().withMessage("District ID is required"),
  ],
  handleValidation,
  vehicleController.create,
);

/**
 * @swagger
 * /api/v1/vehicles/{id}:
 *   put:
 *     tags: [Vehicles]
 *     summary: Update vehicle details (DISTRICT_OFFICER and above)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VehicleInput'
 *     responses:
 *       200:
 *         description: Updated
 */
router.put(
  "/:id",
  authoriseMinRole("DISTRICT_OFFICER"),
  [
    param("id").notEmpty(),
    body("registrationNumber").optional().trim().notEmpty(),
    body("driverName").optional().trim().notEmpty(),
    body("driverNic").optional().trim().notEmpty(),
    body("driverContact").optional().trim(),
  ],
  handleValidation,
  vehicleController.update,
);

/**
 * @swagger
 * /api/v1/vehicles/{id}/status:
 *   patch:
 *     tags: [Vehicles]
 *     summary: Change vehicle status (DISTRICT_OFFICER and above)
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
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
  "/:id/status",
  authoriseMinRole("DISTRICT_OFFICER"),
  [
    param("id").notEmpty(),
    body("status")
      .isIn(["ACTIVE", "INACTIVE", "SUSPENDED"])
      .withMessage("Invalid status value"),
  ],
  handleValidation,
  vehicleController.setStatus,
);

/**
 * @swagger
 * /api/v1/vehicles/{id}:
 *   delete:
 *     tags: [Vehicles]
 *     summary: Permanently remove a vehicle record (HQ_ADMIN only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Deleted
 */
router.delete("/:id", authorise("HQ_ADMIN"), vehicleController.remove);

export default router;
