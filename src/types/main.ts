export interface StringMap {
    [key: string]: string;
}

export interface Config {
    port: number;
    dbFile: string;
}

export interface JsonError {
    status: string,
    message: string
}