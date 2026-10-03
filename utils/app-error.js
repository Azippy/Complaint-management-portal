class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = null) {
    return new AppError(message, 400, errors);
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError(message, 401);
  }

  static forbidden(message = "Forbidden") {
    return new AppError(message, 403);
  }

  static notFound(resource = "Resource") {
    return new AppError(`${resource} not found`, 404);
  }

  static conflict(message) {
    return new AppError(message, 409);
  }

  static unprocessable(message, errors = null) {
    return new AppError(message, 422, errors);
  }
}

module.exports = AppError;