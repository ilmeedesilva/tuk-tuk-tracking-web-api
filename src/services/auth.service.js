import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  TOKEN_EXPIRY,
} from '../config/jwt.js';
import { createError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

//Authenticate a user by username + password.
//Returns access token, refresh token, and sanitised user object.
export const login = async ({ username, password, userAgent, ipAddress }) => {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    throw createError(
      401,
      'INVALID_CREDENTIALS',
      'Invalid username or password',
    );
  }
  if (!user.isActive) {
    throw createError(401, 'ACCOUNT_DISABLED', 'Account has been deactivated');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw createError(
      401,
      'INVALID_CREDENTIALS',
      'Invalid username or password',
    );
  }

  const tokenPayload = {
    sub: user.id,
    role: user.role,
    username: user.username,
  };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  // Persist refresh token for revocation capability
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
    },
  });

  // Track last login time
  prisma.user
    .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    .catch(() => {});

  logger.info('User logged in', { userId: user.id, role: user.role });

  const { passwordHash: _ph, ...safeUser } = user;
  return {
    accessToken,
    refreshToken,
    expiresIn: TOKEN_EXPIRY.access,
    user: safeUser,
  };
};

//Issue a new access token from a valid, non-revoked refresh token.
export const refreshTokens = async (refreshToken) => {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw createError(
      401,
      'INVALID_REFRESH_TOKEN',
      'Refresh token is invalid or expired',
    );
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });
  if (!stored) {
    throw createError(
      401,
      'REFRESH_TOKEN_REVOKED',
      'Refresh token has been revoked',
    );
  }
  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    throw createError(
      401,
      'REFRESH_TOKEN_EXPIRED',
      'Refresh token has expired',
    );
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) {
    throw createError(401, 'ACCOUNT_DISABLED', 'Account is no longer active');
  }

  //refresh token rotation
  await prisma.refreshToken.delete({ where: { token: refreshToken } });
  const newAccessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    username: user.username,
  });
  const newRefreshToken = signRefreshToken({
    sub: user.id,
    role: user.role,
    username: user.username,
  });

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: TOKEN_EXPIRY.access,
  };
};

//Revoke a refresh token on logout.
export const logout = async (refreshToken) => {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
};

//Return the authenticated user's profile
export const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
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
      province: { select: { id: true, name: true, code: true } },
      district: { select: { id: true, name: true, code: true } },
      policeStation: { select: { id: true, name: true, code: true } },
    },
  });
  if (!user) {
    throw createError(404, 'USER_NOT_FOUND', 'User not found');
  }
  return user;
};
