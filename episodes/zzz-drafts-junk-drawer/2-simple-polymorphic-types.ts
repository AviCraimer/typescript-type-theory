import {
    SimpleType,
    Product,
    EmptyType,
    IsSimpleSubtype,
} from "./1-simple-types-and-extensions";

// It is not possible to use TS to explicitly define the type of all polymorphic types over SimpleTypes.

//Because you cannot have a generic type variable which is itself a generic type.
// e.g.,

//Here we try to use conditional types to say that T must take a SimpleType argument to constrct a SimpleType, but it fails with an error:
// Type 'T' is not generic
// This is because TypeScript does not (yet) support higher-kinded types.
type SimpleTypeConstructorAttempt<
    T,
    S extends SimpleType
> = T<S> extends SimpleType ? T : never;

type SimpleTypeConstructorAttempt2<
    T,
    S extends SimpleType
> = T<S> extends SimpleType ? T : never;

// However, using English as an informal meta-meta-language, we can describe the set of (single argument) polymorphic simple types as follows:

// A generic type that take a generic parameter that extends simple type and which always is a simple type.

type ProductRight<T extends SimpleType> = Product<any, T>;
type ProductLeft<T extends SimpleType> = Product<T, any>;
type Projection1<T extends SimpleType> = T extends Product<infer A, any>
    ? A
    : EmptyType;

// Unfortunately, we can't rely on the TS compiler to check that a function is staying with our sub-type system of Simple Types.

//For example we can easily violate the boundaries of the system with a type constructor appears to conform to our constraint:
type Foo<T extends SimpleType> = { foo: T };

//However, we can check case by case if the resulting type stays in the bounds of SimpleType using "any"

type CheckFoo = IsSimpleSubtype<Foo<any>>; // false
type CheckProductRight = IsSimpleSubtype<ProductRight<any>>; // true
type CheckProjection1 = IsSimpleSubtype<Projection1<any>>; // true

// A simple type constructor is a type with n type variables to extend SimpleType and which when <any> is substituted for all it's type arguments is a type that extends SimpleType, which can be manually checked in each case with IsSimpleType.

type SimpleTypeConstructor<T extends SimpleType> = T;

// Given any 1-arguement simple type constructor we can define ad hoc polymorphic functions

type PolymorphicFunction = <Arg extends SimpleType>(
    x: Arg
) => SimpleTypeConstructor<Arg>;

// The return type is constructed from the argument type. An example is the identity function

const simpleTypeIdentity = <Arg extends SimpleType>(
    x: Arg
): SimpleTypeConstructor<Arg> => x;

// We could of course have made Arg the return type directly, but we show it this way to illustrate the general pattern.
