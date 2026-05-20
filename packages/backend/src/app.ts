import express from "express";
import cors from "cors";
import helmet from "helmet";
import companies from "./routes/companies";
import sites from "./routes/sites";
import pages from "./routes/pages";
import assets from "./routes/assets";
import { errorHandler } from "./lib/errors";
import { uploadsDir } from "./lib/uploads";

/**
 * Build the Express app. Exported as a factory so tests can spin up a fresh
 * app against an isolated database.
 */
export function createApp() {
  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use("/uploads", express.static(uploadsDir));

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/companies", companies);
  app.use("/api/sites", sites);
  app.use("/api/pages", pages);
  app.use("/api/assets", assets);

  app.use(errorHandler);
  return app;
}
