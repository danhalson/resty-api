import path from 'path';
import {readFileSync} from 'fs';
import bcrypt from 'bcryptjs';

/**
 * Hashes a string
 */
export const hashPassword = (password: string): string => {
    return bcrypt.hashSync(password, 8);
};

/**
 * Checks a password against a hash
 */
export const checkPassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
}

// TODO: An environment variable set in the package.json would be better
export const secret = readFileSync(`${path.resolve(__dirname)}/../../secret.key`).toString('utf8');