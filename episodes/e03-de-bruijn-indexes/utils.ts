import { isEqual, isEqualWith, omit, cloneDeepWith, clone } from "lodash";
//@ts-ignore
import omitDeep from "omit-deep-lodash";
import { isDeepStrictEqual } from "util";
declare function omitDeep<T extends object, K extends string>(
    input: T,
    ...props: K[]
): OmitDeep<T, K>;
export type OmitDeep<T, K extends string | number | symbol> = {
    [P in Exclude<keyof T, K>]: T[P] extends object ? OmitDeep<T[P], K> : T[P];
};

//Curried version of omit deep makes it easy to copy objects while omitting given property keys.
export const copyCore =
    <K extends string = never>(omit: K[] | readonly K[] = []) =>
    <T extends object>(obj: T) => {
        return omitDeep(obj, ...omit);
    };

type MaybePropertyName = string | number | symbol | undefined;

//Gets a function to deep equality match two objects, with keys to ignore curried in.
export const objEq =
    (ignoreKeys: MaybePropertyName[] | readonly MaybePropertyName[] = []) =>
    (obj1: {}, obj2: {}) => {
        return isEqualWith(
            obj1,
            obj2,
            (_: {}, __: {}, key: MaybePropertyName | undefined) => {
                if (ignoreKeys.includes(key)) {
                    return true;
                }
            }
        );
    };


export const print = (...objs: any[]) => {
    objs.forEach((obj) => console.log(obj.toString()));
};