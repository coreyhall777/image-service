import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../src/app.js';

describe('API Endpoints', () => {
  it('should return service info on root endpoint', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('status');
  });

  it('should return 404 for non-existent endpoints', async () => {
    const response = await request(app).get('/nonexistent');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Not Found');
  });

  it('should handle malformed JSON with 400 error', async () => {
    const response = await request(app)
      .post('/')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'BadRequest');
    expect(response.body.message).toMatch(/JSON/i);
  });
});
