// Church style type theory
type BaseType = number | boolean;

type FunctionType<
    Arg extends BaseType | FunctionType<any, any>,
    Return extends BaseType | FunctionType<any, any>
> = (arg: Arg) => Return;

type ChurchSimpleType = BaseType | FunctionType<any, any>;

//Examples
type BinaryOperation = FunctionType<number, FunctionType<number, number>>;

const add: BinaryOperation = (x) => (y) => x + y;

//We can create a utility type (not part of our official simple type system) which can test if a type is a simple type.
export type IsChurchSimpleSubtype<T> = T extends ChurchSimpleType
    ? true
    : false;

// We can define our function type as normal and then check if it falls within our simply typed fragment
const add2 = (x: number) => (y: number) => x + y;
const isEven = (x: number) => x % 2 === 0;

type CheckAdd2 = IsChurchSimpleSubtype<typeof add2>; // true
type CheckIsEven = IsChurchSimpleSubtype<typeof isEven>; // true

// Contrast
const add3 = (x: number, y: number) => x + y;
type CheckAdd3 = IsChurchSimpleSubtype<typeof add3>; // false

// add3 fails to be a simple type because it has a multi-argument function definition

// Common Additional Features of Simple Type Theories

// Terminal (Singleton) Type and Empty Type (Initial Type)

const singletonValue = Symbol("*");
export type TerminalType = typeof singletonValue;

export type EmptyType = never;

export type SimpleType =
    | ChurchSimpleType
    | Coproduct<any, any>
    | Product<any, any>
    | TerminalType
    | EmptyType;

// Product
export type Product<T1 extends SimpleType, T2 extends SimpleType> = {
    pi1: T1;
    pi2: T2;
};

export type CoproductInjection = "i1" | "i2";

type I1<T extends SimpleType> = {
    injection: "i1";
    value: T;
};

type I2<T extends SimpleType> = {
    injection: "i2";
    value: T;
};

type Coproduct<T1 extends SimpleType, T2 extends SimpleType> = I1<T1> | I2<T2>;

let stringOrNumber: Coproduct<string, number>;

stringOrNumber = {
    injection: "i1",
    value: "hello",
};

//Type error if we try to use a string value with i2
// stringOrNumber = {
//     injection: "i2",
//     value: "hello",
// };

stringOrNumber = {
    injection: "i2",
    value: 4334,
};

export type IsSimpleSubtype<T> = T extends SimpleType ? true : false;

export {};
