import * as stationService from "../services/policeStation.service.js";
import { sendSuccess, sendCreated } from "../utils/response.js";

export const list = async (req, res, next) => {
  try {
    const { data, meta } = await stationService.listPoliceStations(
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
    const station = await stationService.getPoliceStation(req.params.id);
    return sendSuccess(res, station);
  } catch (err) {
    return next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const station = await stationService.createPoliceStation(req.body);
    return sendCreated(res, station);
  } catch (err) {
    return next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const station = await stationService.updatePoliceStation(
      req.params.id,
      req.body,
    );
    return sendSuccess(res, station);
  } catch (err) {
    return next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await stationService.deletePoliceStation(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
