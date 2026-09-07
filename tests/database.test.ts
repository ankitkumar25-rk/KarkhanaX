import { checkDatabaseHealth } from '@/lib/db-health';

describe('Database Health & Connection Unit Tests', () => {
  it('should return a valid health check structure', async () => {
    const health = await checkDatabaseHealth();

    expect(health).toHaveProperty('isHealthy');
    expect(health).toHaveProperty('latencyMs');
    expect(health).toHaveProperty('error');
    expect(typeof health.isHealthy).toBe('boolean');
    expect(typeof health.latencyMs).toBe('number');
  });
});

