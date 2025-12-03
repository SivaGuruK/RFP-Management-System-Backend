import logger from '@/utils/logger';
import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodTypeAny } from 'zod';

export const validateRequest = (schema: ZodObject<any, any> | ZodTypeAny) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
    logger.info('Request validation successful');
  } catch (err: any) {
    logger.error('Request validation failed:', err);
    return res.status(400).json({ message: err.errors || err.message });
  }
};
