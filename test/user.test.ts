import request from 'supertest';
import {server, app, db, cleanup} from '.';
import {jsonError} from '../src/utils/errors';
import {checkPassword} from '../src/utils/security';
import {User} from '../src/types';
import * as R from 'ramda';

/**
 * Prep the db for tests
 */
const prepareDb = (data: User[]): void => db.set('users', data).write();

/**
 * This will be fired before any nested beforeEach
 */
beforeEach(() => prepareDb([]));

afterAll(() => cleanup(server));

describe('Getting a user', () => {
    it("gets an empty array of users, when no users exist", async () => {
        const expected: User[] = [];
        const response = await request(app.callback()).get('/users');
        expect(response.status).toBe(200);
        expect(response.body.users).toStrictEqual(expected);
    });

    it("returns a specific user successfully", async () => {
        const expected: User = {
            username: "Test2",
            email: "test@test.org",
            password: "TheTester"
        };
        await request(app.callback()).post('/users').send(expected);
        const expectedUser = db.get('users').find({username: expected.username}).value();
        const response = await request(app.callback()).get(`/users/${expectedUser.id}`);

        expect(response.status).toBe(200);
        expect(response.body.user).toEqual(R.omit(['password'], expectedUser));
    });

    it("errors for a missing user", async () => {
        const id = 'nonsense';
        const response = await request(app.callback()).get(`/users/${id}`);
        expect(response.status).toBe(404);
        expect(response.body).toEqual(jsonError('Not found', `No user was found with id: ${id}`));
    });

    it("returns an array of users successfully", async () => {
        const expected: User[] = [
            {
                username: "Test2",
                email: "test@test.org",
                password: "TheTester"
            },
            {
                username: "Test3",
                email: "test@test.org",
                password: "TheTester"
            }
        ];
        await request(app.callback()).post('/users').send(expected[0]);
        await request(app.callback()).post('/users').send(expected[1]);

        const response = await request(app.callback()).get('/users');
        expect(response.status).toBe(200);

        response.body.users.forEach((user: User, key: number) => {
            delete user.id; // The id is added internally
            expect(user.username).toEqual(expected[key].username);
            expect(user.email).toEqual(expected[key].email);
            expect(user.password).not.toBeDefined();
        });
    });
});

describe('Creating a user', () => {
    it("creates a new user successfully", async () => {
        // Create a user
        const expected: User = {
            username: "Test9",
            email: "test@test.org",
            password: "TheTester"
        };
        const response = await request(app.callback()).post('/users').send(expected);
        expect(response.status).toBe(200);

        // Check the user was created and get the user's id
        const actual = db.get('users').find({username: expected.username}).value();

        expect(actual.username).toEqual(actual.username);
        expect(actual.email).toEqual(actual.email);
        expect(actual.password).toBeDefined();

        // Check the expected id was returned
        expect(response.body).toStrictEqual({id: actual.id});
    });

    it("errors trying to duplicate user", async () => {
        const expected: User = {
            username: "Test9",
            email: "test@test.org",
            password: "TheTester"
        };
        await request(app.callback()).post('/users').send(expected);
        const response = await request(app.callback())
            .post('/users')
            .send(expected);

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual(jsonError('Duplicate', 'The user already exists'));
    });

    // TODO: This could be tested at the unit level
    it("errors if required fields are missing", async () => {
        const response = await request(app.callback())
            .post('/users')
            .send({
                email: 'test@test.org',
                password: 'TheTester'
            });
        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual(jsonError('Invalid', 'Missing fields: username'));
    });

    it("hashes the password correctly", async () => {
        // Create a user
        const expected: User = {
            username: "Test9",
            email: "test@test.org",
            password: "TheTester"
        };
        const response = await request(app.callback()).post('/users').send(expected);
        expect(response.status).toBe(200);

        // Get the user from the db
        const actual = db.get('users').find({username: expected.username}).value();
        expect(actual.password).not.toEqual(expected.password);

        // Verify the hash matches the original password
        expect(await checkPassword(expected.password, actual.password)).toBe(true);
    });
});

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

describe('Deleting a user', () => {
    let jwt: string;

    /* This is overkill currently, but seems preferably to a temporary beforeAll() which will
    make this necessary anyway should further tests be added. Each test should be using a
    clean db. */

    beforeEach(async () => {
        prepareDb(users);
        const expected = {
            username: "Test5",
            password: "TheTester",
        };
        const response = await request(app.callback()).post('/auth').send(expected);
        jwt = response.body.token;
    });

    it("errors deleting a missing user", async () => {
        expect(jwt).toBeDefined();
        const id = 'nonsense';
        const response = await request(app.callback())
            .delete(`/users/${id}`)
            .set('Authorization', `Bearer ${jwt}`);
        expect(response.status).toBe(404);
        expect(response.body).toEqual(jsonError('Not found', `No user was found with id: ${id}`));
    });

    it("prevents users from deleting a user other than themselves", async () => {
        expect(jwt).toBeDefined();
        const response = await request(app.callback())
            .delete(`/users/${users[0].id}`)
            .set('Authorization', `Bearer ${jwt}`);
        expect(response.status).toBe(401);
        expect(response.body).toEqual(jsonError('Unauthorised', `You may only delete your own credentials`));
    });

    it("deletes a user successfully", async () => {
        expect(jwt).toBeDefined();
        const authenticatedResponse = await request(app.callback())
            .delete(`/users/${users[1].id}`)
            .set('Authorization', `Bearer ${jwt}`);
        expect(authenticatedResponse.status).toBe(200);
    });
});
