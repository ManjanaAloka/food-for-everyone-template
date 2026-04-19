import { AnyZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validate(schema: AnyZodObject, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    // @ts-ignore
    req[source] = schema.parse(req[source]);
    next();
  };
}