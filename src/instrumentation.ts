import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

/**
 * OpenTelemetry Instrumentation bootstrapper.
 * Registers NodeSDK trace listeners using standard static imports.
 */
export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Honeycomb/Jaeger OTLP HTTP trace collector endpoint
    const url = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';
    const exporter = new OTLPTraceExporter({ url });

    const sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [SemanticResourceAttributes.SERVICE_NAME]: 'kosh-onboarding-api',
      }),
      traceExporter: exporter,
      instrumentations: [
        new HttpInstrumentation(),
      ],
    });

    sdk.start();
    console.log('[OTEL] OpenTelemetryNodeSDK initialized successfully. Exporting to:', url);
  }
}
