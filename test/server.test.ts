import request from 'supertest';
import {server, app, cleanup} from '.';

afterAll(() => cleanup(server));

it("returns the expected status", async () => {
    const response = await request(app.callback()).get('/healthcheck');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
});