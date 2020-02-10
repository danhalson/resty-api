import Koa, {Context} from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import logger from 'koa-logger';
import authRoutes from './routes/authRoutes';
import {userRoutesPublic, userRoutesProtected} from './routes/userRoutes';
import {secret} from './utils/security';
import jwt from 'koa-jwt';
import {LowdbSync} from 'lowdb';
import {Schema} from './types';

const coreRoutes = new Router();

/**
 * @name: /healthcheck
 * @example output: {status: 'ok'}
 *
 * A simple endPoint to check the server is live
 *
 * @returns {{status: 'ok'}}
 */
coreRoutes.get('/healthcheck', async (ctx: Context) => {
    ctx.body = {status: 'ok'};
});

const runApp = (db: LowdbSync<Schema>): Koa => {
    const app = new Koa();

    // Add the db instance to the state
    app.use(async (ctx, next) => {
        ctx.state.db = db
        await next();
    });

    app.use(logger()); // TODO: Only log for development
    app.use(bodyParser());

    // Combine our routes
    [coreRoutes, authRoutes, userRoutesPublic].forEach(routes => {
        app.use(routes.routes());
        app.use(routes.allowedMethods());
    });

    // This approach is as per koa-jwt docs, the koa .unless() implementation doesn't provide enough
    // flexibility. A better approach, ideally at the route definition, level would be nice.
    app.use(jwt({secret}));

    app.use(userRoutesProtected.routes());
    app.use(userRoutesProtected.allowedMethods());

    return app;
}

export default runApp;