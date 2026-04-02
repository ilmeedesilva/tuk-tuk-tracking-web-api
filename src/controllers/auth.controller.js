import * as authService from "../services/auth.service.js";
import { sendSuccess } from "../utils/response.js";

export const login = async (req, res, next) => {
  try {
    const result = await authService.login({
      username: req.body.username,
      password: req.body.password,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
    return sendSuccess(res, result);
  } catch (err) {
    return next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const result = await authService.refreshTokens(req.body.refreshToken);
    return sendSuccess(res, result);
  } catch (err) {
    return next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken);
    return sendSuccess(res, { message: "Logged out successfully" });
  } catch (err) {
    return next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    return sendSuccess(res, user);
  } catch (err) {
    return next(err);
  }
};
