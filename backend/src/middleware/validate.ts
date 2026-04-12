import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

/**
 * Returns an Express middleware that validates req.body against the given Zod schema.
 * On failure, responds 400 with the first validation error message.
 * On success, replaces req.body with the parsed (coerced/stripped) value.
 */
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const firstError = (result.error as ZodError).errors[0]
      res.status(400).json({
        error: firstError ? `${firstError.path.join('.')}: ${firstError.message}` : 'Invalid request body',
      })
      return
    }
    req.body = result.data
    next()
  }
}
