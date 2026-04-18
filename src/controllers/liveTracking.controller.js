import * as liveService from "../services/liveTracking.service.js";
import { sendSuccess } from "../utils/response.js";

export const getLiveView = async (req, res, next) => {
  try {
    const { data, meta } = await liveService.getLiveView(req.query, req.user);
    return sendSuccess(res, data, 200, meta);
  } catch (err) {
    return next(err);
  }
};

export const getVehicleLocation = async (req, res, next) => {
  try {
    const location = await liveService.getVehicleLiveLocation(
      req.params.vehicleId,
    );
    return sendSuccess(res, location);
  } catch (err) {
    return next(err);
  }
};

export const getSummary = async (req, res, next) => {
  try {
    const summary = await liveService.getLiveSummary(req.query, req.user);
    return sendSuccess(res, summary);
  } catch (err) {
    return next(err);
  }
};
