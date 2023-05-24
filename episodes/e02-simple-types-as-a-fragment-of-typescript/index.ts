//
//
//
//
//
//
//
//
//
//
// TypeScript Type Theory
//
// Episode 2
//
// SIMPLE TYPES AS A FRAGMENT OF TYPESCRIPT TYPES
//
// Created by Avi Craimer
//
//
export type _SimpleType_ =
    | BaseType<boolean | string | number>
    | FunctionType<[any, any]>;
//
//
//
//
//
//
//
//
// Church style type theory
export type RawBaseTypes = number | boolean | string;

// It will be convenient if all our simple types are expressed as types with a single generic type argument
export type BaseType<DataType extends RawBaseTypes> = DataType;

// Note we use any in this definition to avoid circular reference error from TS.
export type ChurchSimpleType =
    | BaseType<RawBaseTypes>
    | FunctionType<[any, any]>;

type TypePair = [
    BaseType<any> | FunctionType<[any, any]>,
    BaseType<any> | FunctionType<[any, any]>
];

export type FunctionType<DomainCodomain extends TypePair> =
    DomainCodomain extends [infer Domain, infer Codomain]
        ? (arg: Domain) => Codomain
        : never;

// One of the first computer science oriented versions of type theory was created by Alonzo Church, the mathematician who invented lambda calculus as a model of computation.

//Examples
export type BinaryOperation = FunctionType<
    [number, FunctionType<[number, number]>]
>;

// We only have single argument functions, but it isn't a limitation because we can have a function return another function to take both arguments one at a time.
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
export type SingletonType = typeof singletonValue;

export type EmptyType = never;

// Product
export type Product<
    T1 extends SimpleType = SimpleType,
    T2 extends SimpleType = SimpleType
> = {
    pi1: T1;
    pi2: T2;
};

export type CoproductInjection = "i1" | "i2";

export type I1<T extends SimpleType> = {
    injection: "i1";
    value: T;
};

export type I2<T extends SimpleType> = {
    injection: "i2";
    value: T;
};

export type Coproduct<
    T1 extends SimpleType = SimpleType,
    T2 extends SimpleType = SimpleType
> = I1<T1> | I2<T2>;

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

// Our extended system of simple types is as follows. In a later episode, we'll use these to demonstrate the propositions as types principle for propositional logic.
export type SimpleType =
    | ChurchSimpleType
    | SingletonType
    | EmptyType
    | Coproduct<any, any> // any is needed to avoid circular reference
    | Product<any, any>;

export type IsSimpleSubtype<T> = T extends SimpleType ? true : false;
