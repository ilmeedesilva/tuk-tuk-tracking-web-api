import { prisma } from '../config/database.js';
import { createError } from '../middleware/errorHandler.js';
import { parsePagination, buildPaginationMeta } from '../utils/response.js';

//Get last-known locations for all vehicles.
export const getLiveView = async (query, user) => {
  const { page, limit, skip } = parsePagination(query);

  //determine which last_known_locations to include
  const vehicleWhere = {};

  if (user.role === 'PROVINCIAL_ADMIN') {
    vehicleWhere.district = { provinceId: user.provinceId };
  }
  if (user.role === 'DISTRICT_OFFICER' || user.role === 'STATION_OFFICER') {
    vehicleWhere.districtId = user.districtId;
  }

  if (query.districtId) {
    vehicleWhere.districtId = query.districtId;
  }
  if (query.provinceId && user.role === 'HQ_ADMIN') {
    vehicleWhere.district = { provinceId: query.provinceId };
  }
  if (query.status) {
    vehicleWhere.status = query.status;
  }

  const where = { vehicle: vehicleWhere };

  const [data, total] = await Promise.all([
    prisma.lastKnownLocation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      include: {
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            driverName: true,
            status: true,
            district: {
              select: {
                id: true,
                name: true,
                code: true,
                province: { select: { id: true, name: true, code: true } },
              },
            },
            device: { select: { id: true, serialNumber: true } },
          },
        },
      },
    }),
    prisma.lastKnownLocation.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
};

//Get the last-known location of a single vehicle.
export const getVehicleLiveLocation = async (vehicleId) => {
  const location = await prisma.lastKnownLocation.findUnique({
    where: { vehicleId },
    include: {
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          driverName: true,
          driverContact: true,
          status: true,
          district: {
            include: {
              province: { select: { id: true, name: true, code: true } },
            },
          },
          device: { select: { id: true, serialNumber: true, model: true } },
        },
      },
    },
  });

  if (!location) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) {
      throw createError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found');
    }
    throw createError(
      404,
      'NO_LOCATION_DATA',
      'No location data available yet for this vehicle',
    );
  }

  return location;
};

//Summary statistics for a province or district live dashboard.
export const getLiveSummary = async (query, user) => {
  const vehicleWhere = {};

  if (user.role === 'PROVINCIAL_ADMIN') {
    vehicleWhere.district = { provinceId: user.provinceId };
  }
  if (user.role === 'DISTRICT_OFFICER' || user.role === 'STATION_OFFICER') {
    vehicleWhere.districtId = user.districtId;
  }
  if (query.districtId) {
    vehicleWhere.districtId = query.districtId;
  }
  if (query.provinceId) {
    vehicleWhere.district = { provinceId: query.provinceId };
  }

  const [totalVehicles, activeVehicles, vehiclesWithLocation, staleVehicles] =
    await Promise.all([
      prisma.vehicle.count({ where: vehicleWhere }),
      prisma.vehicle.count({ where: { ...vehicleWhere, status: 'ACTIVE' } }),
      prisma.lastKnownLocation.count({ where: { vehicle: vehicleWhere } }),
      prisma.lastKnownLocation.count({
        where: {
          vehicle: vehicleWhere,
          updatedAt: { lt: new Date(Date.now() - 30 * 60 * 1000) },
        },
      }),
    ]);

  return {
    totalVehicles,
    activeVehicles,
    vehiclesWithLocation,
    vehiclesLive: vehiclesWithLocation - staleVehicles,
    vehiclesStale: staleVehicles,
    vehiclesNoData: totalVehicles - vehiclesWithLocation,
  };
};
