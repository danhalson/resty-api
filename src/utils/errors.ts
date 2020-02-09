import {JsonError} from "../types/main";

/**
 * Wraps an error for use as json output
 */
export const jsonError = (status: string, message: string): JsonError => {
    return {status, message}
};