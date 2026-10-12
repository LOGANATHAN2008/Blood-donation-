const request = require('supertest');
const { app, server } = require('../index');
const mongoose = require('mongoose');
const Hospital = require('../models/Hospital');

afterAll(async () => {
  await mongoose.disconnect();
  server.close();
});

describe('Locations API', () => {
  
  beforeEach(async () => {
    // Clear hospitals collection
    await Hospital.deleteMany({});
  });

  it('GET /api/locations/states returns 36 entries even with an empty database', async () => {
    const res = await request(app).get('/api/locations/states');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('success');
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toEqual(36);
    expect(res.body.data).toContain('Tamil Nadu');
    expect(res.body.data).toContain('Maharashtra');
  });

  it('GET /api/locations/districts fallback', async () => {
    // With empty database, it should still return fallback districts for Tamil Nadu
    const res = await request(app).get('/api/locations/districts?state=Tamil Nadu');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('success');
    expect(res.body.data).toBeInstanceOf(Array);
    // Should contain fallback districts and "Other"
    expect(res.body.data.length).toBeGreaterThan(1);
    expect(res.body.data).toContain('Chennai');
    expect(res.body.data).toContain('Other');
  });

  it('GET /api/locations/districts requires state parameter', async () => {
    const res = await request(app).get('/api/locations/districts');
    expect(res.statusCode).toEqual(400);
  });
});
