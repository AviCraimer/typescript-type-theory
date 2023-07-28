// Work in progress

//
import {
    SimpleType,
    FunctionType,
    BaseType,
    Product,
    Coproduct,
    EmptyType,
    SingletonType,
    singletonValue,
    RawBaseType,
} from "../e02-simple-types-as-a-fragment-of-typescript";

import {
    TypeEq,
    False,
    True,
    And,
    Or,
    IfThen,
    Not,
} from "../e03-propositional-logic-with-booleans";

type BooleanNot<T extends boolean> = TypeEq<T, boolean> extends true
    ? never
    : T extends true
    ? false
    : true;

// Ensures we have to pass in a single truth value
type TestWithTwoTruthValues = BooleanNot<boolean>;
type NotTrue = BooleanNot<true>;
type NotFalse = BooleanNot<false>;

type NotTypeEq<T, S> = BooleanNot<TypeEq<T, S>>;

type TestNotEq = NotTypeEq<string | "literal", string>;

// Curry-Howard Isomorphism - Propositions as Types

type IsFalse<T> = T extends EmptyType ? true :  T extends (x: any) => EmptyType ? true :  false;

type EmptyIsFalse = IsTrue<EmptyType>
type sdfsd  = IsTrue<FunctionType<[SimpleType, EmptyType]>>
type ssdds = IsTrue<SimpleType>
type sdds = IsTrue<Exclude<EmptyType, SimpleType>>

type IsTrue<T> = IsFalse<T> extends false ? true : false

// In propositions-as-types, we say that every type corresponds to a proposition, and every type which has at least one value is true. Another way to say this is that any type which is not equivalent to the empty type is true.

// We can define a mapping from syntax in propositional logic to types in our simple type system
type CurryHoward = {
    proposition: SimpleType;
    atomicProposition: BaseType<number | boolean> | SingletonType | EmptyType;
    truth: IsTrue<SimpleType>;
    logicalFalsehood: EmptyType;
    logicalTruth: SingletonType;
    and: Product<SimpleType, SimpleType>;
    or: Coproduct<SimpleType, SimpleType>;
    ifThen: FunctionType<[SimpleType, SimpleType]>;
    negation: FunctionType<[SimpleType, EmptyType]>;
};

// The only think that is missing here, is that truth itself is defined as a type being non-empty.

// Types  <=>  Propositions

// Note the crucial difference that coproduct does not support the law of the excluded middle.

type EmptyCoproduct = Coproduct<
    EmptyType,
    FunctionType<[EmptyType, EmptyType]>
>;

// The corresponding truth functional proposition is true.
type FalseOrNotFalse = Or<False, Not<False>>;


type EmptyFunction = FunctionType<[EmptyType, EmptyType]>

const x: EmptyFunction = (d) => {empty:  }

type sddsd = IsFalse<EmptyFunction>