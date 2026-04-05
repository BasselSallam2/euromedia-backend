// middleware/errorHandler.ts
import { ApiError } from "@/utils/apiError";
import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { MulterError } from "multer";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const t = req.t;
  console.log(err);
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0] as string;
    const value = err.keyValue[field];
    return res.status(409).json({
      status: t("errors.DUBLICATED_DOCUMENT"),
      action: null,
      success: false,
      statusCode: 409,
      message: t("errors.DUBLICATED__MESSAGE" , { field, value }),
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: err.status,
      action: err.action,
      success: err.success,
      statusCode: err.statusCode,
      message: t(err.message, err.variables),
    });
  }

  if (err instanceof MulterError) {
    if (
      err.code === "LIMIT_UNEXPECTED_FILE" &&
      err.message === "Unexpected field"
    ) {
      err = new ApiError(400, "errors.Multer", { field: err.field });
      return res.status(err.statusCode).json({
        status: err.status,
        action: err.action,
        success: err.success,
        statusCode: err.statusCode,
        message: t(err.message, err.variables),
      });
    }
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errorMessages: string[] = [];
    const errorFields: Record<string, any> = {};

    for (const field in err.errors) {
      const fieldError = err.errors[field];
      if (fieldError.kind === 'required') {
        errorMessages.push(t("errors.REQUIRED_FIELD", { field: fieldError.path }));
        errorFields[fieldError.path] = t("errors.REQUIRED_FIELD_MESSAGE", { field: fieldError.path });
      } else {
        errorMessages.push(t("errors.VALIDATION_ERROR", { field: fieldError.path, value: fieldError.value }));
        errorFields[fieldError.path] = fieldError.message;
      }
    }

    return res.status(400).json({
      status: t("errors.validation"),
      action: null,
      success: false,
      statusCode: 400,
      message: errorMessages.join(', '),
      errors: errorFields,
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      status: t("errors.cast"),
      action: null,
      success: false,
      statusCode: 400,
      message: t("errors.CAST_ERROR", {
        field: err.path,
        value: err.stringValue,
        type: err.kind
      }),
    });
  }


  res.status(500).json({
    status: t("errors.error"),
    action: null,
    success: false,
    statusCode: 500,
    message: t("errors.worng"),
  });
};
