import Router from 'koa-router';
import {jsonError} from '../utils/errors';
import jsonwebtoken from 'jsonwebtoken';
import {checkPassword, secret} from '../utils/security';
import {checkMissingFields} from '../utils/validation';

const authRoutes = new Router({prefix: '/auth'});

/**
 * @name: /users
 * @example input: {
 *   username: test
 *   password: 123
 * }
 * @example output: {
 *   token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoiMTZxejczMXA2azZl
 *          MTV6cXEiLCJleHBpcmVzSW4iOiIxaCIsImlhdCI6MTU4MTE5Nzk3M30.3-_Ao1UgtKp3x9kcNF75XWVo7_
 *          cQ77HA0nKdjsum7UA
 * }
 *
 * Verifies the given credentials and returns a JWT to use in later requests (as a Bearer token)
 * Users are only allowed to delete their own account.
 *
 * @returns {{token: ""} | JsonError}
 */
authRoutes.post('/', async (ctx) => {
    const {db} = ctx.state;

    // First verify we have a user and pass
    const fields: string[] = ['username', 'password'];
    const missing = checkMissingFields(ctx.request.body, fields);

    if (missing.length) {
        ctx.status = 401;
        // Let's be vague about what's missing...
        ctx.body = jsonError('Unauthorised', 'Both a username and password are required');
        return;
    }

    const {username, password} = ctx.request.body;

    const user = db.get('users').find({username}).value();
    if (!user) {
        ctx.status = 401;
        ctx.body = jsonError('Unauthorised', 'Could not authenticate with the credentials provided');
        return;
    }

    // Check password valid
    if (await checkPassword(password, user.password)) {
        // Sign and return a jwt
        ctx.body = {token: jsonwebtoken.sign({data: user.id, expiresIn: "1h"}, secret)};
    } else {
        ctx.status = 401;
        ctx.body = jsonError('Unauthorised', 'Could not authenticate with the credentials provided');
    }
});

export default authRoutes;