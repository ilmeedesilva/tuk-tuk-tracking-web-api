import * as vehicleService from '../services/vehicle.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const list = async (req, res, next) => {
  try {
    const { data, meta } = await vehicleService.listVehicles(
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
    const vehicle = await vehicleService.getVehicle(req.params.id);
    return sendSuccess(res, vehicle);
  } catch (err) {
    return next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.createVehicle(req.body);
    return sendCreated(res, vehicle);
  } catch (err) {
    return next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
    return sendSuccess(res, vehicle);
  } catch (err) {
    return next(err);
  }
};

export const setStatus = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.setVehicleStatus(
      req.params.id,
      req.body.status,
    );
    return sendSuccess(res, vehicle);
  } catch (err) {
    return next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await vehicleService.deleteVehicle(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
