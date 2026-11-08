import { HttpErrorResponse } from '@angular/common/http';

/**
 * The body of an RFC 9457 error response, typed as the generated `ProblemDetails` or
 * `ValidationProblemDetails` the operation declares; `undefined` when the error carries none
 * (a network failure, or a body of another media type). Errors stay `HttpErrorResponse` (W-04).
 */
export function problemOf<T extends object>(error: unknown): T | undefined {
  if (!(error instanceof HttpErrorResponse)) return undefined;
  const isProblem = error.headers.get('content-type')?.includes('application/problem+json');
  return isProblem && typeof error.error === 'object' && error.error !== null
    ? (error.error as T)
    : undefined;
}
