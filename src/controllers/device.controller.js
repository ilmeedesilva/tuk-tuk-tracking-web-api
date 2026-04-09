import * as deviceService from "../services/device.service.js";
import { sendSuccess, sendCreated } from "../utils/response.js";

export const list = async (req, res, next) => {
  try {
    const { data, meta } = await deviceService.listDevices(req.query);
    return sendSuccess(res, data, 200, meta);
  } catch (err) {
    return next(err);
  }
};

export const get = async (req, res, next) => {
  try {
    const device = await deviceService.getDevice(req.params.id);
    return sendSuccess(res, device);
  } catch (err) {
    return next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const device = await deviceService.createDevice(req.body);
    return sendCreated(res, device);
  } catch (err) {
    return next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const device = await deviceService.updateDevice(req.params.id, req.body);
    return sendSuccess(res, device);
  } catch (err) {
    return next(err);
  }
};

export const assign = async (req, res, next) => {
  try {
    const [updatedDevice, updatedVehicle] = await deviceService.assignDevice(
      req.params.id,
      req.body.vehicleId,
    );
    return sendSuccess(res, { device: updatedDevice, vehicle: updatedVehicle });
  } catch (err) {
    return next(err);
  }
};

export const unassign = async (req, res, next) => {
  try {
    const [updatedVehicle, updatedDevice] = await deviceService.unassignDevice(
      req.params.id,
    );
    return sendSuccess(res, { device: updatedDevice, vehicle: updatedVehicle });
  } catch (err) {
    return next(err);
  }
};

export const decommission = async (req, res, next) => {
  try {
    const device = await deviceService.decommissionDevice(req.params.id);
    return sendSuccess(res, device);
  } catch (err) {
    return next(err);
  }
};
