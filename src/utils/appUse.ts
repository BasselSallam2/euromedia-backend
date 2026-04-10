import cookieParser from "cookie-parser";
import cors from "cors";
import type { Express } from "express";
import express from "express";
import helmet from "helmet";
import path from "path";

import { logger } from "@utils/logger";
import appRoutes from "@utils/routes";
import compression from "compression";
import mongooseSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

import { i18next } from "@config/i18n";

import * as middleware from "i18next-http-middleware";





const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    message: "Too many requests from this IP, please try again after 15 minutes",
});

const speedLimiter = slowDown({
    windowMs: 60 * 1000,
    delayAfter: 50,
    delayMs: () => 500,
});

function Appuse(app: Express) {



    app.use(middleware.handle(i18next));
    app.use(cookieParser("secret-key"));
    app.use(express.json({ limit: "10Kb" }));
    app.use(express.urlencoded({ extended: true, limit: "10Kb" }));
    app.use("/public", express.static(path.join(process.cwd(), "public")));
    app.use(compression());
    app.use(
        cors({ origin: "*", credentials: true }),
    );
    app.use(helmet());
    app.use(rateLimiter);
    app.use(speedLimiter);
    app.use(logger);
    app.use(mongooseSanitize());

    app.use("/api", appRoutes);
}

export default Appuse;
