import {StringMap} from "../types/main";

export const checkMissingFields = (data: StringMap, fields: string[]) =>
    fields.reduce((acc: string[], field: string) => {
        if (!data[field]) {
            acc.push(field);
        }
        return acc;
}, []);