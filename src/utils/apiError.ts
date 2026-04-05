import type { TFunction } from "i18next";

class ApiError extends Error {
  status: string;
  action: string | null;
  success: boolean;
  statusCode: number;
  override message: string;
  variables?: Record<string, any>;

  constructor(
    statusCode: number,
    messageKey: string,
    variables?: Record<string, any>,
    action?: string | null
  ) {
    super(messageKey);

    this.statusCode = statusCode;
    this.success = false;
    this.action = action ?? null;
    this.message = messageKey;
    this.variables = variables;


    this.status = this.statusCode.toString().startsWith("4")
      ? "warning"
      : "error";

    Object.setPrototypeOf(this, ApiError.prototype);
    this.name = this.constructor.name;
  }
}

export { ApiError };
