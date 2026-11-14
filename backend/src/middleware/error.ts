import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const notFound: RequestHandler = (req) => {
  throw ApiError.notFound(`Route ${req.method} ${req.originalUrl}`);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let error: ApiError;

  if (err instanceof ApiError) {
    error = err;
  } else if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    error = ApiError.badRequest(details[0]?.message ?? 'Validation failed', details);
    error.code = 'VALIDATION_ERROR';
  } else if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    error = ApiError.badRequest('Validation failed', details);
    error.code = 'VALIDATION_ERROR';
  } else if (err instanceof mongoose.Error.CastError) {
    error = ApiError.badRequest(`Invalid value for ${err.path}`);
  } else if (err?.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    error = ApiError.conflict(`A record with this ${field} already exists`);
    error.details = [{ field, message: `This ${field} is already in use` }];
  } else if (err?.type === 'entity.parse.failed') {
    error = ApiError.badRequest('Malformed JSON body');
  } else {
    console.error(err);
    error = new ApiError(500, 'Something went wrong on our side', 'INTERNAL_ERROR');
  }

  res.status(error.status).json({
    error: {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
      ...(!env.isProd && error.status === 500 ? { stack: String(err?.stack) } : {}),
    },
  });
};
