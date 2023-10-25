export type NoInstance<T> = T & { __notInstantiated__: never };

//Not needed so far. Has issues when applied to arrays.
export type WithInstance<T> = DistributiveOmit<T, "__notInstantiated__">;

export type DistributiveOmit<T, K extends keyof any> = T extends any
    ? Omit<T, K>
    : never;

// Switches from co-variant to contra-variant
type Contra<T> = T extends any ? (arg: T) => void : never;

type InferContra<T> = [T] extends [(arg: infer I) => void] ? I : never;

//Picks a single element from a union
type PickOne<T> = InferContra<InferContra<Contra<Contra<T>>>>;

export type UnionToTuple<T> = PickOne<T> extends infer U
    ? Exclude<T, U> extends never
        ? [T]
        : [...UnionToTuple<Exclude<T, U>>, U]
    : never;

type Merge<A, B> = {
    [K in keyof A & keyof B]: A[K] | B[K];
} & Omit<A, keyof A & keyof B> &
    Omit<B, keyof A & keyof B>;

type teste222 = ResolveType<Merge<{ foo: 3 }, { bar: 4; foo: { baz: 4 } }>>;

export type ShallowDistributeUnion<U> = ResolveShallow<
    U extends [infer Head, ...infer Rest]
        ? Rest extends any[]
            ? Merge<
                  Head extends any ? { [K in keyof Head]: Head[K] } : never,
                  ShallowDistributeUnion<Rest>
              >
            : never
        : {}
>;

type Foo1 = { foo: 1; obj: { bar: 1 } };
type Foo2 = { foo: 2; obj: { bar: { baz: 2 } } };

type Result = ShallowDistributeUnion<UnionToTuple<Foo1 | Foo2>>;

// type DistributeUnionShallow<T> = {
//     [K in KnownKeys<UnionToIntersection<T>>]: T extends infer U
//         ? U extends any
//             ? K extends keyof U
//                 ? U[K]
//                 : never
//             : never
//         : never;
// };

// type test = DistributeUnionShallow<
//     { foo: "a" | "b"; bar: { baz: 2 } } | { foo: "a" | "c"; bar: { baz: 3 } }
// >;

// type test = {
//     foo: "a" | "b" | "c";
//     bar:
//         | {
//               baz: 2;
//           }
//         | {
//               baz: 3;
//           };
// };

// type Foo1 = { foo: 1; obj: { bar: 1 } };
// type Foo2 = {
//     foo: 2;
//     obj: { bar: { baz: 2 } };
// };

// type test2 = DistributeUnionShallow<
//   | {
//       foo: 1;
//       obj: { bar: 1 } }
//   | {
//       foo: 2;
//       obj: { bar: { baz: 2 } };
//      }
// >
// ;

export type TypeEq<T, S> = [T, S] extends [S, T] ? true : false;

export type Assert<Test extends true> = Test;

export type ResolveType<T> = T extends object
    ? { [K in keyof T]: ResolveType<T[K]> }
    : T;

export type ResolveShallow<T> = T extends object ? { [K in keyof T]: T[K] } : T;
