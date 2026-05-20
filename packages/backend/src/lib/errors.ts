import type { Request, Response, NextFunction } from "express";

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

/**
 * Detects a better-sqlite3 unique-constraint failure and converts it into a
 * 409 Conflict HttpError with a helpful message. Falls through (returns null)
 * for any other error so callers can rethrow.
 */
export function asUniqueConflict(err: unknown, message: string): HttpError | null {
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code: string }).code === "SQLITE_CONSTRAINT_UNIQUE"
  ) {
    const sqliteMessage = "message" in err && typeof err.message === "string"
      ? err.message
      : message;
    return new HttpError(409, message, { sqliteMessage });
  }
  return null;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
}
