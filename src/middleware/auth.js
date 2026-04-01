import { verifyAccessToken } from "../config/jwt.js";
import { prisma } from "../config/database.js";
import { createError } from "./errorHandler.js";

//Role hierarchy
const ROLE_ORDER = [
  "DEVICE",
  "STATION_OFFICER",
  "DISTRICT_OFFICER",
  "PROVINCIAL_ADMIN",
  "HQ_ADMIN",
];

//authenticate — verifies the Bearer JWT and attaches req.user.
export const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return next(
        createError(401, "MISSING_TOKEN", "Authorization header required"),
      );
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    // DB check --> ensure the user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        provinceId: true,
        districtId: true,
        policeStationId: true,
      },
    });

    if (!user) {
      return next(
        createError(
          401,
          "USER_NOT_FOUND",
          "User associated with token no longer exists",
        ),
      );
    }
    if (!user.isActive) {
      return next(
        createError(401, "ACCOUNT_DISABLED", "Account has been deactivated"),
      );
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
};

//Allows the request if req.user.role is in the permitted roles list
export const authorise =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) {
      return next(
        createError(401, "UNAUTHENTICATED", "Authentication required"),
      );
    }
    if (!roles.includes(req.user.role)) {
      return next(
        createError(
          403,
          "FORBIDDEN",
          `Access denied. Required role: ${roles.join(" or ")}. Your role: ${req.user.role}`,
        ),
      );
    }
    return next();
  };

//allows minRole and any role with higher privilege.
export const authoriseMinRole = (minRole) => (req, _res, next) => {
  if (!req.user) {
    return next(createError(401, "UNAUTHENTICATED", "Authentication required"));
  }

  const userRoleIndex = ROLE_ORDER.indexOf(req.user.role);
  const minRoleIndex = ROLE_ORDER.indexOf(minRole);

  if (userRoleIndex < minRoleIndex) {
    return next(
      createError(
        403,
        "FORBIDDEN",
        `Minimum required role: ${minRole}. Your role: ${req.user.role}`,
      ),
    );
  }
  return next();
};

//scopeGuard — ensures non-HQ users can only access resources within their assigned scope.
export const scopeGuard = (req, _res, next) => {
  const { user } = req;
  if (!user || user.role === "HQ_ADMIN") {
    return next();
  }

  const requestedProvinceId = req.query.provinceId || req.body?.provinceId;
  const requestedDistrictId = req.query.districtId || req.body?.districtId;

  if (
    user.role === "PROVINCIAL_ADMIN" &&
    requestedProvinceId &&
    requestedProvinceId !== user.provinceId
  ) {
    return next(
      createError(
        403,
        "SCOPE_VIOLATION",
        "Access restricted to your assigned province",
      ),
    );
  }

  if (
    (user.role === "DISTRICT_OFFICER" || user.role === "STATION_OFFICER") &&
    requestedDistrictId &&
    requestedDistrictId !== user.districtId
  ) {
    return next(
      createError(
        403,
        "SCOPE_VIOLATION",
        "Access restricted to your assigned district",
      ),
    );
  }

  return next();
};
