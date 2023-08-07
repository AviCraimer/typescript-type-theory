export type NoInstance<T> = T & { __notInstantiated__: never };

//Not needed so far. Has issues when applied to arrays.
export type WithInstance<T> = DistributiveOmit<T, "__notInstantiated__">;

export type DistributiveOmit<T, K extends keyof any> = T extends any
    ? Omit<T, K>
    : never;

export type TypeEq<T, S> = [T, S] extends [S, T] ? true : false;

export type Assert<Test extends true> = Test;
