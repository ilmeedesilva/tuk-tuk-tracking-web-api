import * as userService from '../services/user.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const list = async (req, res, next) => {
  try {
    const { data, meta } = await userService.listUsers(req.query, req.user);
    return sendSuccess(res, data, 200, meta);
  } catch (err) {
    return next(err);
  }
};

export const get = async (req, res, next) => {
  try {
    const user = await userService.getUser(req.params.id);
    return sendSuccess(res, user);
  } catch (err) {
    return next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    return sendCreated(res, user);
  } catch (err) {
    return next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    return sendSuccess(res, user);
  } catch (err) {
    return next(err);
  }
};

export const activate = async (req, res, next) => {
  try {
    const user = await userService.setUserActive(req.params.id, true);
    return sendSuccess(res, user);
  } catch (err) {
    return next(err);
  }
};

export const deactivate = async (req, res, next) => {
  try {
    const user = await userService.setUserActive(req.params.id, false);
    return sendSuccess(res, user);
  } catch (err) {
    return next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
