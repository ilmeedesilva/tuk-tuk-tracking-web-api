import { validationResult } from 'express-validator';

export const handleValidation = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  return res.status(422).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: result.array().map((e) => ({
        field: e.path,
        message: e.msg,
        value: e.value,
      })),
    },
  });
};
