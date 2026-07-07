import { NextResponse } from 'next/server';

interface ErrorEnvelope {
  code: string;
  message: string;
  details?: any;
}

interface MetaEnvelope {
  page?: number;
  limit?: number;
  total?: number;
}

interface ResponseEnvelopeArgs<T = any> {
  success: boolean;
  data?: T | null;
  error?: ErrorEnvelope | null;
  meta?: MetaEnvelope | null;
  status?: number;
  headers?: Record<string, string>;
}

/**
 * Standardized global response helper following the envelope:
 * { success, data, error: { code, message, details }, meta: { page, limit, total }, requestId }
 * Supports custom response headers (needed for rate-limiting, CORS, etc).
 */
export function apiResponse<T = any>({
  success,
  data = null,
  error = null,
  meta = null,
  status = 200,
  headers
}: ResponseEnvelopeArgs<T>) {
  // Generate a random unique requestId for traceability
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : 'req-' + Math.random().toString(36).substring(2, 15);

  return NextResponse.json(
    {
      success,
      data,
      error,
      meta,
      requestId
    },
    { 
      status,
      headers 
    }
  );
}
