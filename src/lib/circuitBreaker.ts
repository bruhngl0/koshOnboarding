export type BreakerState = 'CLOSED' | 'OPEN' | 'HALF-OPEN';

/**
 * Reusable Circuit Breaker class implementing Closed, Open, and Half-Open states.
 * Fails-safe by invoking a fallback/degraded responder when the circuit is tripped.
 */
export class CircuitBreaker<TRequest = any, TResponse = any> {
  private name: string;
  private state: BreakerState = 'CLOSED';
  private failures = 0;
  private lastFailureTime = 0;
  private failureThreshold = 5;
  private cooldownPeriod = 30000; // 30 seconds
  private fallback: (request: TRequest, error: any) => Promise<TResponse> | TResponse;

  constructor(
    name: string,
    fallback: (request: TRequest, error: any) => Promise<TResponse> | TResponse,
    failureThreshold = 5,
    cooldownPeriod = 30000
  ) {
    this.name = name;
    this.fallback = fallback;
    this.failureThreshold = failureThreshold;
    this.cooldownPeriod = cooldownPeriod;
  }

  async execute(action: (req: TRequest) => Promise<TResponse>, request: TRequest): Promise<TResponse> {
    const now = Date.now();

    // Transition from OPEN to HALF-OPEN after cooldown expires
    if (this.state === 'OPEN' && now - this.lastFailureTime > this.cooldownPeriod) {
      this.state = 'HALF-OPEN';
      console.log(`[CIRCUIT BREAKER: ${this.name}] Cooldown elapsed. Testing recovery in HALF-OPEN state.`);
    }

    if (this.state === 'OPEN') {
      console.warn(`[CIRCUIT BREAKER: ${this.name}] Circuit is OPEN. Triggering degraded/fallback response.`);
      return this.fallback(request, new Error('Circuit Breaker is OPEN'));
    }

    try {
      const response = await action(request);
      
      // If we succeed in HALF-OPEN, reset the breaker back to CLOSED
      if (this.state === 'HALF-OPEN') {
        console.log(`[CIRCUIT BREAKER: ${this.name}] Success in HALF-OPEN state. Resetting breaker to CLOSED.`);
      }
      
      this.state = 'CLOSED';
      this.failures = 0;
      return response;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = now;
      console.error(`[CIRCUIT BREAKER: ${this.name}] Request failure (${this.failures}/${this.failureThreshold}). Error:`, error);

      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
        console.error(`[CIRCUIT BREAKER: ${this.name}] Failure threshold reached. Circuit tripped to OPEN (Cooldown: ${this.cooldownPeriod}ms).`);
      }

      // Graceful degradation: Return cached or custom degraded response instead of throwing
      return this.fallback(request, error);
    }
  }

  getState(): BreakerState {
    return this.state;
  }
}
