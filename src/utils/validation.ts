import {StringMap} from "../types";

export const checkMissingFields = (data: StringMap, fields: string[]): string[] => {
    return fields.reduce((acc: string[], field: string) => {
        if (!data[field]) {
            acc.push(field);
        }
        return acc;
    }, []);
};