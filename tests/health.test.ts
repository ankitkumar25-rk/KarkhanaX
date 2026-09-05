import { GET } from '@/app/api/health/route';

describe('Health Check API Handler', () => {
  it('should return 200 OK status and health payload', async () => {
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('healthy');
    expect(json.data.service).toBe('KarkhanaX API');
  });
});

