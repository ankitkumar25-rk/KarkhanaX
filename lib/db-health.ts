import prisma from '@/lib/prisma';

export interface DatabaseHealthStatus {
  isHealthy: boolean;
  latencyMs: number;
  error: string | null;
}

/**
 * Executes a lightweight ping query against PostgreSQL database to check connection pool health.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
  const startTime = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - startTime;

    return {
      isHealthy: true,
      latencyMs,
      error: null,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Database ping failed';

    return {
      isHealthy: false,
      latencyMs: Date.now() - startTime,
      error: errorMessage,
    };
  }
}

