import * as provinceService from '../services/province.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const list = async (req, res, next) => {
  try {
    const { data, meta } = await provinceService.listProvinces(req.query);
    return sendSuccess(res, data, 200, meta);
  } catch (err) {
    return next(err);
  }
};

export const get = async (req, res, next) => {
  try {
    const province = await provinceService.getProvince(req.params.id);
    return sendSuccess(res, province);
  } catch (err) {
    return next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const province = await provinceService.createProvince(req.body);
    return sendCreated(res, province);
  } catch (err) {
    return next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const province = await provinceService.updateProvince(
      req.params.id,
      req.body,
    );
    return sendSuccess(res, province);
  } catch (err) {
    return next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await provinceService.deleteProvince(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
