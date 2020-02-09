import {Server} from 'http';
import {unlinkSync} from 'fs';
import runServer from '../server';
import {Config} from '../types/main';

export const config: Config = {
    port: 3001,
    dbFile: 'db_users_test.json',
};

/**
 * Shuts down the server and deletes the db file
 */
export const cleanup = (_server: Server) => {
    _server.close();
    unlinkSync(config.dbFile);
};

export const {server, app, db} = runServer(config);
