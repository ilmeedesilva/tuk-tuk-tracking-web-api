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

  if (query.provinceId) {
    where.provinceId = query.provinceId;
  } else if (user?.role === "PROVINCIAL_ADMIN") {
    where.provinceId = user.provinceId;
  }

  if (user?.role === "DISTRICT_OFFICER" || user?.role === "STATION_OFFICER") {
    where.id = user.districtId;
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { code: { contains: query.search, mode: "insensitive" } },
    ];
  }
  return where;
};

export const listDistricts = async (query, user) => {
  const { page, limit, skip } = parsePagination(query);
  const orderBy = parseSort(query, ALLOWED_SORT);
  const where = buildWhere(query, user);

  const [data, total] = await Promise.all([
    prisma.district.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        province: { select: { id: true, name: true, code: true } },
        _count: { select: { policeStations: true, vehicles: true } },
      },
    }),
    prisma.district.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
};

export const getDistrict = async (id) => {
  const district = await prisma.district.findUnique({
    where: { id },
    include: {
      province: { select: { id: true, name: true, code: true } },
      policeStations: {
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      },
      _count: { select: { vehicles: true } },
    },
  });
  if (!district) {
    throw createError(404, "DISTRICT_NOT_FOUND", "District not found");
  }
  return district;
};

export const createDistrict = async (data) => {
  const province = await prisma.province.findUnique({
    where: { id: data.provinceId },
  });
  if (!province) {
    throw createError(400, "INVALID_REFERENCE", "Province not found");
  }
  return prisma.district.create({
    data,
    include: { province: { select: { id: true, name: true, code: true } } },
  });
};

export const updateDistrict = async (id, data) => {
  const exists = await prisma.district.findUnique({ where: { id } });
  if (!exists) {
    throw createError(404, "DISTRICT_NOT_FOUND", "District not found");
  }
  return prisma.district.update({
    where: { id },
    data,
    include: { province: { select: { id: true, name: true, code: true } } },
  });
};

export const deleteDistrict = async (id) => {
  const exists = await prisma.district.findUnique({
    where: { id },
    include: { _count: { select: { policeStations: true, vehicles: true } } },
  });
  if (!exists) {
    throw createError(404, "DISTRICT_NOT_FOUND", "District not found");
  }
  if (exists._count.policeStations > 0 || exists._count.vehicles > 0) {
    throw createError(
      409,
      "HAS_DEPENDENCIES",
      "Cannot delete district with associated stations or vehicles",
    );
  }
  return prisma.district.delete({ where: { id } });
};
