/**
 * The one error type httpClient throws. `correlationId` is the value of the
 * API's X-Correlation-Id response header, so a user can read it out of an
 * error banner and the maintainer can find the request in the server logs.
 */
export class ApiError extends Error {
  constructor(message, { status, payload, correlationId }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
    this.correlationId = correlationId;
  }
}
