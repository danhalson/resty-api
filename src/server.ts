import runApp from './app';
import FileSync from 'lowdb/adapters/FileSync';
import low from 'lowdb';

import Schema from './types/Schema';
import {Config} from './types/main';

const runServer = ({port, dbFile}: Config) => {
    // Setup lowdb
    const adapter = new FileSync<Schema>(dbFile);
    const db = low(adapter);
    db.defaults({users: []}).write();

    // Create a Server instance
    const app = runApp(db);
    const server = app.listen(port, () => {
        console.info(`Listening on: http://localhost:${port}`);
    });

    return {server, app, db};
};

export default runServer;