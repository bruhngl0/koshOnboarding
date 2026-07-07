import { trace, Span, context, propagation } from '@opentelemetry/api';

// Create a named tracer instance
export const tracer = trace.getTracer('kosh-custom-tracer');

/**
 * Executes an action wrapped inside an OpenTelemetry Span for distributed tracing.
 */
export async function traceSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: 1 }); // OK state
      return result;
    } catch (err: any) {
      span.setStatus({ code: 2, message: err.message }); // ERROR state
      span.recordException(err);
      throw err;
    } finally {
      span.end();
    }
  });
}

/**
 * Injects traceparent headers into outgoing request headers to propagate trace context.
 */
export function injectTraceHeaders(headers: Record<string, string> = {}): Record<string, string> {
  propagation.inject(context.active(), headers);
  return headers;
}
