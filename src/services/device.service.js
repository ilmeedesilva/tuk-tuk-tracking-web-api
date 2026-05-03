import { prisma } from "../config/database.js";
import { createError } from "../middleware/errorHandler.js";
import {
  parsePagination,
  buildPaginationMeta,
  parseSort,
} from "../utils/response.js";

const ALLOWED_SORT = ["registeredAt", "serialNumber", "status"];

export const listDevices = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const orderBy = parseSort(query, ALLOWED_SORT);

  const where = {};
  if (query.status) {
    where.status = query.status;
  }
  if (query.search) {
    where.OR = [
      { serialNumber: { contains: query.search, mode: "insensitive" } },
      { model: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.device.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        vehicle: {
          select: { id: true, registrationNumber: true, status: true },
        },
      },
    }),
    prisma.device.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
};

export const getDevice = async (id) => {
  const device = await prisma.device.findUnique({
    where: { id },
    include: {
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          driverName: true,
          status: true,
          districtId: true,
        },
      },
    },
  });
  if (!device) {
    throw createError(404, "DEVICE_NOT_FOUND", "Device not found");
  }
  return device;
};

export const createDevice = async (data) => {
  return prisma.device.create({ data });
};

export const updateDevice = async (id, data) => {
  const exists = await prisma.device.findUnique({ where: { id } });
  if (!exists) {
    throw createError(404, "DEVICE_NOT_FOUND", "Device not found");
  }
  if (exists.status === "DECOMMISSIONED") {
    throw createError(
      409,
      "DEVICE_DECOMMISSIONED",
      "Cannot modify a decommissioned device",
    );
  }
  return prisma.device.update({ where: { id }, data });
};

export const assignDevice = async (deviceId, vehicleId) => {
  const [device, vehicle] = await Promise.all([
    prisma.device.findUnique({
      where: { id: deviceId },
      include: { vehicle: true },
    }),
    prisma.vehicle.findUnique({ where: { id: vehicleId } }),
  ]);

  if (!device) {
    throw createError(404, "DEVICE_NOT_FOUND", "Device not found");
  }
  if (!vehicle) {
    throw createError(404, "VEHICLE_NOT_FOUND", "Vehicle not found");
  }
  if (device.status === "DECOMMISSIONED") {
    throw createError(409, "DEVICE_DECOMMISSIONED", "Device is decommissioned");
  }
  if (device.status === "ASSIGNED") {
    throw createError(
      409,
      "DEVICE_ALREADY_ASSIGNED",
      "Device is already assigned to a vehicle",
    );
  }
  if (vehicle.deviceId) {
    throw createError(
      409,
      "VEHICLE_HAS_DEVICE",
      "Vehicle already has a device assigned. Unassign it first",
    );
  }

  return prisma.$transaction([
    prisma.device.update({
      where: { id: deviceId },
      data: { status: "ASSIGNED" },
    }),
    prisma.vehicle.update({ where: { id: vehicleId }, data: { deviceId } }),
  ]);
};

export const unassignDevice = async (deviceId) => {
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: { vehicle: true },
  });
  if (!device) {
    throw createError(404, "DEVICE_NOT_FOUND", "Device not found");
  }
  if (device.status !== "ASSIGNED" || !device.vehicle) {
    throw createError(
      409,
      "DEVICE_NOT_ASSIGNED",
      "Device is not currently assigned to any vehicle",
    );
  }

  return prisma.$transaction([
    prisma.vehicle.update({
      where: { id: device.vehicle.id },
      data: { deviceId: null },
    }),
    prisma.device.update({
      where: { id: deviceId },
      data: { status: "UNASSIGNED" },
    }),
  ]);
};

export const decommissionDevice = async (deviceId) => {
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: { vehicle: true },
  });
  if (!device) {
    throw createError(404, "DEVICE_NOT_FOUND", "Device not found");
  }

  // Auto-unassign before decommissioning
  if (device.vehicle) {
    await prisma.vehicle.update({
      where: { id: device.vehicle.id },
      data: { deviceId: null },
    });
  }
  return prisma.device.update({
    where: { id: deviceId },
    data: { status: "DECOMMISSIONED" },
  });
};
