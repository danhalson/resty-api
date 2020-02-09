import runServer from './server';
import {Config} from './types/main';

const config: Config = {
    port: Number(process.env.PORT) || 3000,
    dbFile: 'db_users.json'
};

export const {server, app, db} = runServer(config);