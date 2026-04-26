import * as pingService from '../services/locationPing.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const submit = async (req, res, next) => {
  try {
    const ping = await pingService.submitPing(req.body, req.user);
    return sendCreated(res, ping);
  } catch (err) {
    return next(err);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const { data, vehicle, meta } = await pingService.getVehicleHistory(
      req.params.vehicleId,
      req.query,
    );
    return sendSuccess(res, { vehicle, pings: data }, 200, meta);
  } catch (err) {
    return next(err);
  }
};

export const query = async (req, res, next) => {
  try {
    const { data, meta } = await pingService.queryPings(req.query, req.user);
    return sendSuccess(res, data, 200, meta);
  } catch (err) {
    return next(err);
  }
};
