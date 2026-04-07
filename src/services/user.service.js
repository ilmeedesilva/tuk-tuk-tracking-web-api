import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";
import { createError } from "../middleware/errorHandler.js";
import {
  parsePagination,
  buildPaginationMeta,
  parseSort,
} from "../utils/response.js";

const SALT_ROUNDS = 12;
const SAFE_SELECT = {
  id: true,
  username: true,
  email: true,
  fullName: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  provinceId: true,
  districtId: true,
  policeStationId: true,
  createdAt: true,
  updatedAt: true,
  province: { select: { id: true, name: true, code: true } },
  district: { select: { id: true, name: true, code: true } },
  policeStation: { select: { id: true, name: true, code: true } },
};

const ALLOWED_SORT = [
  "username",
  "fullName",
  "role",
  "createdAt",
  "lastLoginAt",
];

const buildWhere = (query, callerUser) => {
  const where = {};

  // Scope enforcement for non-HQ callers
  if (callerUser.role === "PROVINCIAL_ADMIN") {
    where.provinceId = callerUser.provinceId;
  }
  if (callerUser.role === "DISTRICT_OFFICER") {
    where.districtId = callerUser.districtId;
  }
  if (callerUser.role === "STATION_OFFICER") {
    where.policeStationId = callerUser.policeStationId;
  }

  // Explicit filters
  if (query.role) {
    where.role = query.role;
  }
  if (query.isActive !== undefined) {
    where.isActive = query.isActive === "true";
  }
  if (query.districtId && callerUser.role === "HQ_ADMIN") {
    where.districtId = query.districtId;
  }
  if (query.provinceId && callerUser.role === "HQ_ADMIN") {
    where.provinceId = query.provinceId;
  }

  if (query.search) {
    where.OR = [
      { username: { contains: query.search, mode: "insensitive" } },
      { fullName: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
    ];
  }
  return where;
};

export const listUsers = async (query, callerUser) => {
  const { page, limit, skip } = parsePagination(query);
  const orderBy = parseSort(query, ALLOWED_SORT);
  const where = buildWhere(query, callerUser);

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: SAFE_SELECT,
    }),
    prisma.user.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
};

export const getUser = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: SAFE_SELECT,
  });
  if (!user) {
    throw createError(404, "USER_NOT_FOUND", "User not found");
  }
  return user;
};

export const createUser = async (data) => {
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const { password: _pw, ...rest } = data;

  const user = await prisma.user.create({
    data: { ...rest, passwordHash },
    select: SAFE_SELECT,
  });
  return user;
};

export const updateUser = async (id, data) => {
  const exists = await prisma.user.findUnique({ where: { id } });
  if (!exists) {
    throw createError(404, "USER_NOT_FOUND", "User not found");
  }

  const updateData = { ...data };
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    delete updateData.password;
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: SAFE_SELECT,
  });
};

export const setUserActive = async (id, isActive) => {
  const exists = await prisma.user.findUnique({ where: { id } });
  if (!exists) {
    throw createError(404, "USER_NOT_FOUND", "User not found");
  }
  return prisma.user.update({
    where: { id },
    data: { isActive },
    select: SAFE_SELECT,
  });
};

export const deleteUser = async (id) => {
  const exists = await prisma.user.findUnique({ where: { id } });
  if (!exists) {
    throw createError(404, "USER_NOT_FOUND", "User not found");
  }
  // Cascade deletes refresh tokens via DB constraint
  await prisma.user.delete({ where: { id } });
};
