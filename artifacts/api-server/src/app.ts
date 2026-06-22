import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// In production, restrict CORS to the known frontend origin so that
// credentials (session cookies) can't be sent from arbitrary sites.
// Set FRONTEND_URL to your Netlify domain, e.g. https://gorilla-guardians.netlify.app
const corsOrigin = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map(u => u.trim())
  : true;
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(
  express.json({
    // Stripe webhook signature verification needs the exact raw bytes of the request body.
    // Capturing them here via the `verify` hook (rather than mounting express.raw() only for
    // /api/webhooks/stripe) avoids the classic pitfall of the request stream being consumed
    // twice — body-parsers can only read the stream once, so a second parser sees nothing.
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true }));
// Cross-origin cookies (Netlify → Render) require sameSite:"none" + secure:true.
// Either NODE_ENV=production OR FRONTEND_URL being set signals cross-origin mode.
const crossOrigin = process.env.NODE_ENV === "production" || !!process.env.FRONTEND_URL;
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "gorilla-guardians-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: crossOrigin,
      sameSite: crossOrigin ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.use("/api/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api", router);

export default app;
