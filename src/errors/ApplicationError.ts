/**
 * Base for application/domain errors. Used by service and repository layers.
 * HTTP-agnostic; the API layer maps these to status codes.
 */
export abstract class ApplicationError extends Error {
  readonly statusCode: number;

  constructor(
    message: string,
    statusCode: number,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
