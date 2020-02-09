import Router from 'koa-router';
import {jsonError} from '../utils/errors';
import uniqid from 'uniqid';
import {hashPassword} from '../utils/security';
import User from '../types/User';
import {checkMissingFields} from '../utils/validation';
import * as R from 'ramda';

// TODO: Use jsdoc-route-plugin or better yet OpenAPI to improve docs

const collection = 'users';
const prefix = `/${collection}`;
const userRoutesPublic = new Router({prefix});
const userRoutesProtected = new Router({prefix});

/**
 * @name: /users
 * @example input: /users
 * @example output: [{
 *   username: test
 *   email: test@test.com
 * },
 * {
 *   username: test1
 *   email: test1@test.com
 * }]
 *
 * Gets all specified users and strips the passwords
 *
 * @returns {User[]}
 */
userRoutesPublic.get('/', async (ctx) => {
    const db = ctx.state.db;
    const users: User[] = db.get(collection);
    ctx.body = {users: users.map(user => R.omit(['password'], user))};
});

/**
 * @name: /users/:id
 * @example input: /users/16qz731p6k6e15zqq
 * @example output: {
 *   username: test
 *   email: test@test.com
 * }
 *
 * Gets the specified user and strips the password
 *
 * @returns {User | JsonError}
 */
userRoutesPublic.get('/:id', async (ctx) => {
    const db = ctx.state.db;
    const {id} = ctx.params;

    const user: User = db.get(collection).find({id}).value();
    if (!user) {
        ctx.status = 404;
        ctx.body = jsonError('Not found', `No user was found with id: ${id}`);
        return;
    }

    ctx.body = {user: R.omit(['password'], user)};
});

/**
 * @name: /users
 * @example input: {
 *   username: test
 *   password: 123
 *   email: test@test.com
 * }
 * @example output: 16qz731p6k6e15zqq
 *
 * Adds the specified user, generates an id and hashes the password.
 * Errors on missing fields & duplicates.
 *
 * @returns {{id} | JsonError}
 */
userRoutesPublic.post('/', async (ctx) => {
    const db = ctx.state.db;
    const data = ctx.request.body;

    const fields: string[] = ['email', 'password', 'username'];
    const missing = checkMissingFields(data, fields);

    if (missing.length) {
        ctx.status = 400;
        ctx.body = jsonError('Invalid', `Missing fields: ${missing.join(', ')}`);
        return;
    }

    const id = uniqid();
    const user: User = {id, ...data};

    // Check for duplicates
    const exists = db.get(collection).find({username: user.username}).value();
    if (exists) {
        ctx.status = 400;
        ctx.body = jsonError('Duplicate', 'The user already exists');
        return;
    }

    // TODO: Further validation; check email valid, check password length and mixed chars ...

    // Hash the password
    const hash = hashPassword(user.password);

    // Persist to db
    db.get(collection).push({...user, password: hash}).write();

    // Return status, including errors in json
    ctx.body = {id};
});

/**
 * @name: /users/:id
 * @example input: /users/16qz731p6k6e15zqq
 *
 * Deletes the specified user, if exists and is the logged-in user.
 *
 * @returns {{} | JsonError}
 */
userRoutesProtected.del('/:id', async (ctx) => {
    const {db, user: {data: userId}} = ctx.state;
    const {id} = ctx.params;

    if (!db.get(collection).find({id}).value()) {
        ctx.status = 404;
        ctx.body = jsonError('Not found', `No user was found with id: ${id}`);
        return;
    }

    if (userId !== id) {
        ctx.status = 401;
        // TODO: In reality we might want to hide this error
        ctx.body = jsonError('Unauthorised', `You may only delete your own credentials`);
        return;
    }

    // In a real world scenario this would probably be a logical delete
    db.get(collection).remove({id}).write();
    ctx.body = {};
});

export {
    userRoutesPublic,
    userRoutesProtected
};