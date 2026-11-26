// Validation and error responses happen before the database, so no MongoDB is needed.
const request = require('supertest');
const app = require('./app');

const ID = '64b7f0c2a1b2c3d4e5f60718';
const fields = (res) => res.body.error.details.map((d) => d.field);

test('unknown route -> 404', async () => {
  expect((await request(app).get('/api/nope')).status).toBe(404);
});

test('bad JSON -> 400', async () => {
  const res = await request(app).post('/api/plans').set('Content-Type', 'application/json').send('{"title":');
  expect(res.status).toBe(400);
  expect(res.body.error.message).toBe('Request body is not valid JSON');
});

test('plan without title and with bad time -> 400 with fields', async () => {
  const res = await request(app).post('/api/plans').send({ startTime: '25:00' });
  expect(res.status).toBe(400);
  expect(fields(res)).toEqual(expect.arrayContaining(['title', 'startTime']));
});

test('invalid id -> 400', async () => {
  expect((await request(app).get('/api/plans/abc')).status).toBe(400);
});

test('bad stop -> 400 with every bad field', async () => {
  const res = await request(app).post(`/api/plans/${ID}/stops`).send({
    name: 'Bank', location: '', opensAt: '16:00', closesAt: '10:00',
    priority: 'urgent', travelMins: -5, visitMins: 10, items: [{ text: '' }],
  });
  expect(res.status).toBe(400);
  expect(fields(res)).toEqual(expect.arrayContaining(['location', 'closesAt', 'priority', 'travelMins', 'items[0].text']));
});

test('bad reorder body -> 400', async () => {
  expect((await request(app).patch(`/api/plans/${ID}/stops/reorder`).send({ order: ['x'] })).status).toBe(400);
});
