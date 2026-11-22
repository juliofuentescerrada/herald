import { HttpInterceptorFn } from '@angular/common/http';

/** The header that carries a mutation's operation identity (operation-receipts). */
export const operationIdHeader = 'Operation-Id';

/**
 * Gives every admin mutation an operation identity, so the host keeps its receipt and a repeat of the same request returns the
 * first outcome instead of a second effect. A command that carries one in its body sends that one, which the host requires to
 * match; a request that already names one keeps it; reads go as they are.
 */
export const operationIdentity: HttpInterceptorFn = (request, next) => {
  if (request.method === 'GET' || request.method === 'HEAD' || !request.url.includes('/api/organisations/') || request.headers.has(operationIdHeader)) {
    return next(request);
  }
  const body = request.body as { operationId?: unknown } | null;
  const carried = typeof body === 'object' && body !== null && typeof body.operationId === 'string' ? body.operationId : null;
  return next(request.clone({ setHeaders: { [operationIdHeader]: carried ?? crypto.randomUUID() } }));
};
