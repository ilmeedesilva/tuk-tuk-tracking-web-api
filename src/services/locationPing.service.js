import { prisma } from '../config/database.js';
import { createError } from '../middleware/errorHandler.js';
import { parsePagination, buildPaginationMeta } from '../utils/response.js';

//Submit a location ping from a GPS device.
export const submitPing = async (pingData, deviceUser) => {
  const device = await prisma.device.findUnique({
    where: { serialNumber: deviceUser.username },
    include: { vehicle: true },
  });

  if (!device) {
    throw createError(
      403,
      'DEVICE_NOT_REGISTERED',
      'No device registered for this account',
    );
  }
  if (device.status !== 'ASSIGNED') {
    throw createError(
      403,
      'DEVICE_NOT_ASSIGNED',
      'Device is not assigned to any vehicle',
    );
  }
  if (!device.vehicle) {
    throw createError(
      403,
      'NO_VEHICLE',
      'No vehicle associated with this device',
    );
  }
  if (device.vehicle.status !== 'ACTIVE') {
    throw createError(403, 'VEHICLE_INACTIVE', 'Vehicle is not active');
  }

  const vehicleId = device.vehicle.id;
  const { latitude, longitude, speed, heading, altitude, accuracy, timestamp } =
    pingData;

  // Reject pings with future timestamps
  const pingTime = new Date(timestamp);
  if (pingTime > new Date(Date.now() + 30_000)) {
    throw createError(
      400,
      'FUTURE_TIMESTAMP',
      'Ping timestamp cannot be in the future',
    );
  }

  // Write ping and upsert last-known location in a single transaction
  const [ping] = await prisma.$transaction([
    prisma.locationPing.create({
      data: {
        vehicleId,
        latitude,
        longitude,
        speed,
        heading,
        altitude,
        accuracy,
        timestamp: pingTime,
      },
    }),
    prisma.lastKnownLocation.upsert({
      where: { vehicleId },
      create: {
        vehicleId,
        latitude,
        longitude,
        speed,
        heading,
        timestamp: pingTime,
      },
      update: { latitude, longitude, speed, heading, timestamp: pingTime },
    }),
  ]);

  return ping;
};

//Query historical location pings for a vehicle within a time window.
export const getVehicleHistory = async (vehicleId, query) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) {
    throw createError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found');
  }

  const { page, limit, skip } = parsePagination(query);

  const where = { vehicleId };
  if (query.from) {
    where.timestamp = { gte: new Date(query.from) };
  }
  if (query.to) {
    where.timestamp = { ...where.timestamp, lte: new Date(query.to) };
  }

  const [data, total] = await Promise.all([
    prisma.locationPing.findMany({
      where,
      orderBy: { timestamp: query.order === 'asc' ? 'asc' : 'desc' },
      skip,
      take: limit,
    }),
    prisma.locationPing.count({ where }),
  ]);

  return { data, vehicle, meta: buildPaginationMeta(page, limit, total) };
};

//all pings across vehicles filtered by district/province and time window.
export const queryPings = async (query, user) => {
  const { page, limit, skip } = parsePagination(query);

  const vehicleWhere = {};
  if (query.vehicleId) {
    vehicleWhere.id = query.vehicleId;
  }
  if (query.districtId) {
    vehicleWhere.districtId = query.districtId;
  }
  if (query.provinceId) {
    vehicleWhere.district = { provinceId: query.provinceId };
  }

  if (user.role === 'PROVINCIAL_ADMIN') {
    vehicleWhere.district = { provinceId: user.provinceId };
  }
  if (user.role === 'DISTRICT_OFFICER' || user.role === 'STATION_OFFICER') {
    vehicleWhere.districtId = user.districtId;
  }

  const pingWhere = {};
  if (Object.keys(vehicleWhere).length > 0) {
    pingWhere.vehicle = vehicleWhere;
  }
  if (query.from || query.to) {
    pingWhere.timestamp = {};
    if (query.from) {
      pingWhere.timestamp.gte = new Date(query.from);
    }
    if (query.to) {
      pingWhere.timestamp.lte = new Date(query.to);
    }
  }

  const [data, total] = await Promise.all([
    prisma.locationPing.findMany({
      where: pingWhere,
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit,
      include: {
        vehicle: {
          select: { id: true, registrationNumber: true, districtId: true },
        },
      },
    }),
    prisma.locationPing.count({ where: pingWhere }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
};
