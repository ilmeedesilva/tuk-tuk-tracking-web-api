import * as districtService from "../services/district.service.js";
import { sendSuccess, sendCreated } from "../utils/response.js";

export const list = async (req, res, next) => {
  try {
    const { data, meta } = await districtService.listDistricts(
      req.query,
      req.user,
    );
    return sendSuccess(res, data, 200, meta);
  } catch (err) {
    return next(err);
  }
};

export const get = async (req, res, next) => {
  try {
    const district = await districtService.getDistrict(req.params.id);
    return sendSuccess(res, district);
  } catch (err) {
    return next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const district = await districtService.createDistrict(req.body);
    return sendCreated(res, district);
  } catch (err) {
    return next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const district = await districtService.updateDistrict(
      req.params.id,
      req.body,
    );
    return sendSuccess(res, district);
  } catch (err) {
    return next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await districtService.deleteDistrict(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
