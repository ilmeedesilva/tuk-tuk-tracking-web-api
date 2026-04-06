import { prisma } from "../config/database.js";
import { createError } from "../middleware/errorHandler.js";
import {
  parsePagination,
  buildPaginationMeta,
  parseSort,
} from "../utils/response.js";

const ALLOWED_SORT = ["name", "code", "createdAt"];

const buildWhere = (query, user) => {
  const where = {};

  if (query.districtId) {
    where.districtId = query.districtId;
  } else if (
    user?.role === "DISTRICT_OFFICER" ||
    user?.role === "STATION_OFFICER"
  ) {
    where.districtId = user.districtId;
  }

  if (query.provinceId) {
    where.district = { provinceId: query.provinceId };
  } else if (user?.role === "PROVINCIAL_ADMIN") {
    where.district = { provinceId: user.provinceId };
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { code: { contains: query.search, mode: "insensitive" } },
    ];
  }
  return where;
};

export const listPoliceStations = async (query, user) => {
  const { page, limit, skip } = parsePagination(query);
  const orderBy = parseSort(query, ALLOWED_SORT);
  const where = buildWhere(query, user);

  const [data, total] = await Promise.all([
    prisma.policeStation.findMany({
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
        _count: { select: { users: true } },
      },
    }),
    prisma.policeStation.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
};

export const getPoliceStation = async (id) => {
  const station = await prisma.policeStation.findUnique({
    where: { id },
    include: {
      district: {
        include: { province: { select: { id: true, name: true, code: true } } },
      },
    },
  });
  if (!station) {
    throw createError(404, "STATION_NOT_FOUND", "Police station not found");
  }
  return station;
};

export const createPoliceStation = async (data) => {
  const district = await prisma.district.findUnique({
    where: { id: data.districtId },
  });
  if (!district) {
    throw createError(400, "INVALID_REFERENCE", "District not found");
  }
  return prisma.policeStation.create({
    data,
    include: { district: { select: { id: true, name: true, code: true } } },
  });
};

export const updatePoliceStation = async (id, data) => {
  const exists = await prisma.policeStation.findUnique({ where: { id } });
  if (!exists) {
    throw createError(404, "STATION_NOT_FOUND", "Police station not found");
  }
  return prisma.policeStation.update({
    where: { id },
    data,
    include: { district: { select: { id: true, name: true, code: true } } },
  });
};

export const deletePoliceStation = async (id) => {
  const exists = await prisma.policeStation.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!exists) {
    throw createError(404, "STATION_NOT_FOUND", "Police station not found");
  }
  if (exists._count.users > 0) {
    throw createError(
      409,
      "HAS_DEPENDENCIES",
      "Cannot delete station with assigned users",
    );
  }
  return prisma.policeStation.delete({ where: { id } });
};
