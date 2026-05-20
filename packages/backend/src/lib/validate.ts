import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

/**
 * Validates `req.body` against a Zod schema. On failure returns 400 with the
 * flattened Zod issues so the client knows exactly which field failed.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: result.error.flatten(),
      });
    }
    req.body = result.data;
    next();
  };
}
