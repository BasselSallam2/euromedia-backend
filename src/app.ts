import { ApiError } from "@utils/apiError";
import { globalErrorHandler } from "@utils/apiGolbalErrror";
import Appuse from "@utils/appUse";
import express from "express";

const app = express();
app.set("trust proxy", 1);
Appuse(app);

app.all("*", (req, res, next) => {
    next(new ApiError(404, "errors.notFound", { url: req.originalUrl }));
});

app.use(globalErrorHandler);

export default app;
