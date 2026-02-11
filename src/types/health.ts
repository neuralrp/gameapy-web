export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  checks: {
    backend: { status: 'up' | 'down'; latency_ms?: number };
    database: { status: 'up' | 'down'; latency_ms?: number; error?: string };
  };
}
