import {
    BaseType,
    FunctionType,
    EmptyType,
    SingletonType,
    IsSimpleSubtype,
} from "./1-simple-types-and-extensions";

type Atom<TVal extends boolean> = {
    name: string;
    tVal: TVal;
    provable: TVal extends true ? SingletonType : EmptyType;
    //truth-value.
    //Only atomic propositions are explicitly assigned truth values. The other truth values are derived via truth-functions which we'll implement with TypeScript types.
};

//Takes two propositions and returns a tuple of their truth values
type TruthVals<P extends Proposition, Q extends Proposition> = [
    P["tVal"],
    Q["tVal"]
];

// prettier-ignore
type TruthTable<Column extends [boolean, boolean, boolean, boolean], P extends Proposition, Q extends Proposition > =
    TruthVals<P,Q> extends [true, true] ? Column[0]  :
    TruthVals<P,Q> extends [true, false]?  Column[1] :
    TruthVals<P,Q> extends [false, true]?  Column[2] :
    TruthVals<P,Q> extends [false, false]?  Column[3] : never

type AndTVal<P extends Proposition, Q extends Proposition> = TruthTable<
    [true, false, false, true],
    P,
    Q
>;
type OrTVal<P extends Proposition, Q extends Proposition> = TruthTable<
    [true, true, true, false],
    P,
    Q
>;
type IfThenTVal<P extends Proposition, Q extends Proposition> = TruthTable<
    [true, false, true, true],
    P,
    Q
>;

// For negation there's only one propositional argument
type NotTVal<P extends Proposition> = P["tVal"] extends true ? false : true;

type Proposition =
    | Atom<boolean>
    | {
          tVal: boolean;
          components: [Proposition, Proposition];
          tFunc: "and" | "or" | "ifThen";
          provable: SingletonType | EmptyType;
      }
    | {
          tVal: boolean;
          components: [Proposition];
          tFunc: "not";
          provable: SingletonType | EmptyType;
      };

type ResolveType<T> = T extends object
    ? { [K in keyof T]: ResolveType<T[K]> }
    : T;

type ResolveTypeOnce<T> = T extends object ? { [K in keyof T]: T[K] } : T;

// Product
export type Product<T1 extends Proposition, T2 extends Proposition> = [T1, T2];

export type CoproductInjection = "i1" | "i2";

export type I1<T extends Proposition> = {
    injection: "i1";
    value: T;
};

export type I2<T extends Proposition> = {
    injection: "i2";
    value: T;
};

export type Coproduct<
    T1 extends Proposition = Proposition,
    T2 extends Proposition = Proposition
> = I1<T1> | I2<T2>;

type And<P extends Proposition, Q extends Proposition> = {
    tFunc: "and";
    // Below ensures that the type cannot be instanciated unless it is true
    components: Product<P, Q>;
    provable: AndTVal<P, Q> extends true ? SingletonType : EmptyType;
} & ResolveType<{
    tVal: AndTVal<P, Q>;
}>;

type TrueTrue = And<Atom<true>, Atom<true>>;
type FalseFalse = And<Atom<false>, Atom<false>>;

type FFandTT = And<FalseFalse, TrueTrue>;
type FFandFalse = And<FalseFalse, Atom<false>>;

type Or<P extends Proposition, Q extends Proposition> = {
    tFunc: "or";
    // Below ensures that the type cannot be instanciated unless it is true
    provable: OrTVal<P, Q> extends true ? SingletonType : EmptyType;

    // We need to use Coproduct here because if we used Product or tuple, we would be unable to instanciate the type even though it is true.
    components: Coproduct<P, Q>;
} & ResolveType<{
    tVal: OrTVal<P, Q>;
}>;

type FFandFalse_or_TrueTrue = Or<FFandFalse, TrueTrue>;
