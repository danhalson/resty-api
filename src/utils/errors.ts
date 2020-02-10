import {JsonError} from "../types";

/**
 * Wraps an error for use as json output
 */
export const jsonError = (status: string, message: string): JsonError => {
    return {status, message}
};