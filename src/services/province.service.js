import { prisma } from "../config/database.js";
import { createError } from "../middleware/errorHandler.js";
import {
  parsePagination,
  buildPaginationMeta,
  parseSort,
} from "../utils/response.js";

const ALLOWED_SORT = ["name", "code", "createdAt"];

export const listProvinces = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const orderBy = parseSort(query, ALLOWED_SORT);

  const search = query.search
    ? {
        OR: [
          { name: { contains: query.search, mode: "insensitive" } },
          { code: { contains: query.search, mode: "insensitive" } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.province.findMany({
      where: search,
      orderBy,
      skip,
      take: limit,
      include: { _count: { select: { districts: true } } },
    }),
    prisma.province.count({ where: search }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
};

export const getProvince = async (id) => {
  const province = await prisma.province.findUnique({
    where: { id },
    include: {
      districts: {
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!province) {
    throw createError(404, "PROVINCE_NOT_FOUND", "Province not found");
  }
  return province;
};

export const createProvince = async (data) => {
  return prisma.province.create({ data });
};

export const updateProvince = async (id, data) => {
  const exists = await prisma.province.findUnique({ where: { id } });
  if (!exists) {
    throw createError(404, "PROVINCE_NOT_FOUND", "Province not found");
  }
  return prisma.province.update({ where: { id }, data });
};

export const deleteProvince = async (id) => {
  const exists = await prisma.province.findUnique({
    where: { id },
    include: { _count: { select: { districts: true } } },
  });
  if (!exists) {
    throw createError(404, "PROVINCE_NOT_FOUND", "Province not found");
  }
  if (exists._count.districts > 0) {
    throw createError(
      409,
      "HAS_DEPENDENCIES",
      "Cannot delete province with associated districts",
    );
  }
  return prisma.province.delete({ where: { id } });
};
