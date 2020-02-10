import Koa from 'koa';
import {Server} from 'http';
import {LowdbSync} from 'lowdb';

export interface StringMap {
    [key: string]: string;
}

export interface Config {
    port: number;
    dbFile: string;
}

export interface AppInstances {
    server: Server;
    app: Koa;
    db: LowdbSync<Schema>;
}

export interface Schema {
    users: User[];
}

export interface User {
    id?: string; // This is an internal property
    username: string;
    email: string;
    password: string;
}

export interface JsonError {
    status: string;
    message: string;
}