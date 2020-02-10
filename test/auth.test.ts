import request from 'supertest';
import {server, app, db, cleanup} from '.';
import {jsonError} from '../src/utils/errors';

const users = [
    {
        "id": "16qz73nvk6dvdhif",
        "username": "Test4",
        "email": "test@test.org",
        "password": "$2a$08$IPzIoudLj6X.uIQF1Hx3OuOIzLmIJhMyyAKkwPLqJik6Onh660pR6"
    },
    {
        "id": "16qz731p6k6e15zqq",
        "username": "Test5",
        "email": "test@test.org",
        "password": "$2a$08$P6Ue7N702uEiOo14BAGRIuvyHBE9P2yomgQe02loCWKbUmzpvVZRC"
    }
];

beforeEach(() => {
    db.set('users', users).write()
});

afterAll(() => cleanup(server));

describe('Authentication', () => {
    it("fails with missing credentials", async () => {
        const expected = {
            username: "test@test.org",
        };
        const response = await request(app.callback()).post('/auth').send(expected);
        expect(response.status).toBe(401);
        expect(response.body).toEqual(jsonError('Unauthorised', 'Both a username and password are required'));
    });

    it("fails with incorrect username and password", async () => {
        const expected = {
            username: "Test1",
            password: "wrong",
        };
        const response = await request(app.callback()).post('/auth').send(expected);
        expect(response.status).toBe(401);
        expect(response.body).toEqual(jsonError('Unauthorised', 'Could not authenticate with the credentials provided'));
    });

    it("fails with incorrect password", async () => {
        const expected = {
            username: "Test5",
            password: "wrong",
        };
        const response = await request(app.callback()).post('/auth').send(expected);
        expect(response.status).toBe(401);
        expect(response.body).toEqual(jsonError('Unauthorised', 'Could not authenticate with the credentials provided'));
    });

    it("fails with an invalid jwt", async () => {
        const authenticatedResponse = await request(app.callback())
            .delete(`/users/${users[1].id}`)
            .set('Authorization', `Bearer nonsense`);
        expect(authenticatedResponse.status).toBe(401);
    });

    it("returns a valid jwt with the correct credentials", async () => {
        const expected = {
            username: "Test5",
            password: "TheTester",
        };
        const response = await request(app.callback()).post('/auth').send(expected);
        expect(response.status).toBe(200);

        const jwt = response.body.token;
        expect(jwt).not.toBeUndefined();

        // The JWT is tested for validity in 'Deleting a user' in `user.test.ts`
    });
});