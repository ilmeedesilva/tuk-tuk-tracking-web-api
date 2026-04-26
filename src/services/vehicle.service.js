import { prisma } from '../config/database.js';
import { createError } from '../middleware/errorHandler.js';
import {
  parsePagination,
  buildPaginationMeta,
  parseSort,
} from '../utils/response.js';

const ALLOWED_SORT = [
  'registrationNumber',
  'driverName',
  'status',
  'createdAt',
];

const buildWhere = (query, user) => {
  const where = {};

  // Scope enforcement by user role
  if (user.role === 'PROVINCIAL_ADMIN') {
    where.district = { provinceId: user.provinceId };
  } else if (
    user.role === 'DISTRICT_OFFICER' ||
    user.role === 'STATION_OFFICER'
  ) {
    where.districtId = user.districtId;
  }

  // Explicit filters
  if (query.districtId) {
    where.districtId = query.districtId;
  }
  if (query.provinceId && user.role === 'HQ_ADMIN') {
    where.district = { provinceId: query.provinceId };
  }
  if (query.status) {
    where.status = query.status;
  }
  if (query.hasDevice !== undefined) {
    where.deviceId = query.hasDevice === 'true' ? { not: null } : null;
  }
  if (query.search) {
    where.OR = [
      { registrationNumber: { contains: query.search, mode: 'insensitive' } },
      { driverName: { contains: query.search, mode: 'insensitive' } },
      { driverNic: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  return where;
};

export const listVehicles = async (query, user) => {
  const { page, limit, skip } = parsePagination(query);
  const orderBy = parseSort(query, ALLOWED_SORT);
  const where = buildWhere(query, user);

  const [data, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        district: {
          select: {
            id: true,
            name: true,
            code: true,
            province: { select: { id: true, name: true, code: true } },
          },
        },
        device: { select: { id: true, serialNumber: true, status: true } },
        lastKnownLocation: {
          select: {
            latitude: true,
            longitude: true,
            speed: true,
            timestamp: true,
          },
        },
      },
    }),
    prisma.vehicle.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
};

export const getVehicle = async (id) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      district: {
        include: { province: { select: { id: true, name: true, code: true } } },
      },
      device: true,
      lastKnownLocation: true,
    },
  });
  if (!vehicle) {
    throw createError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found');
  }
  return vehicle;
};

export const createVehicle = async (data) => {
  const district = await prisma.district.findUnique({
    where: { id: data.districtId },
  });
  if (!district) {
    throw createError(400, 'INVALID_REFERENCE', 'District not found');
  }
  return prisma.vehicle.create({
    data,
    include: { district: { select: { id: true, name: true, code: true } } },
  });
};

export const updateVehicle = async (id, data) => {
  const exists = await prisma.vehicle.findUnique({ where: { id } });
  if (!exists) {
    throw createError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found');
  }
  return prisma.vehicle.update({
    where: { id },
    data,
    include: { district: { select: { id: true, name: true, code: true } } },
  });
};

export const setVehicleStatus = async (id, status) => {
  const exists = await prisma.vehicle.findUnique({ where: { id } });
  if (!exists) {
    throw createError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found');
  }
  return prisma.vehicle.update({ where: { id }, data: { status } });
};

export const deleteVehicle = async (id) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) {
    throw createError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found');
  }

  // Clean up related records first
  await prisma.$transaction([
    prisma.lastKnownLocation.deleteMany({ where: { vehicleId: id } }),
    prisma.locationPing.deleteMany({ where: { vehicleId: id } }),
    ...(vehicle.deviceId
      ? [
          prisma.device.update({
            where: { id: vehicle.deviceId },
            data: { status: 'UNASSIGNED' },
          }),
        ]
      : []),
    prisma.vehicle.delete({ where: { id } }),
  ]);
};
