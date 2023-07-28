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
// Episode 3
//
// PROPOSITIONAL LOGIC WITH BOOLEAN TYPES
//
// Created by Avi Craimer
//
//
export type LogicalProposition = AtomicProposition | TruthFunctionalProposition;
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
//
// Here we'll build up a propositional logic by defining special types for propositions and logical connectives (a.k.a. truth-functions).

// In a later episode we'll see how propositional logical can equivalently be expressed in terms of type instantiation

export type Atom<TVal extends boolean> = {
    syntax: "Atom";
    symbol: string;
    tVal: TVal;
    // truth-value.
    // Only atomic propositions are explicitly assigned truth values.
    // The other truth values are derived via truth-functions
};

// At the type level we can ignore the content of the proposition and we only have to consider two classes of propositions, those that are true and those that are false.
export type True = Atom<true>;
export type False = Atom<false>;

// At the value level we can use the "symbol" field to write our sentence
export const theSkyIsBlue: True = {
    syntax: "Atom",
    symbol: "The sky is blue",
    tVal: true,
};

const pigsFly: False = {
    syntax: "Atom",
    symbol: "Pigs fly",
    tVal: false,
};

// These should not be used in the names of Atoms
type ReservedStrings = "&" | "∨" | "⊃" | "¬" | "(" | ")";

type Proposition =
    | Atom<boolean>
    | {
          symbol: "&" | "∨" | "⊃"; // and | or | if then
          syntax: "TruthFunction";
          components: [Proposition, Proposition];
          tVal: boolean;
      }
    | {
          symbol: "¬"; // symbol for negation
          syntax: "TruthFunction";
          components: [Proposition];
          tVal: boolean;
      };

type AtomicProposition = Atom<boolean>;

// A truth functional proposition is built from other propositions via a truth function
type TruthFunctionalProposition = Exclude<Proposition, Atom<boolean>>;

// Intuitively, we can think of a truth function has having the type
type TruthFunctionIntuition = (TValP: boolean) => (TValQ: boolean) => boolean;

// But since we aren't going to use any runtime JavaScript functions for this logic we will define the types a using type functions instead.

// A truth function takes either one or two proposition arguments (the components above) and maps the truth values of the components to a new truth value.

// For convenience we make utility type function to extract the tVal property from two propositions.
type TruthVals<P extends Proposition, Q extends Proposition> = [
    P["tVal"],
    Q["tVal"]
];

// With two boolean variables we have 2^2 = 4 possible permutations.

// Therefore we specify a truth-function by explicitly listing the output boolean based on a every possible pair of input booleans.

// In logic, this way of representing a truth function is called the truth table method.

// A truth table gives us a truth value for every ordered pair of the truth values for component propositions P and Q. We can write a truth table type function very directly using conditional types.

// The type argument Column give us the definition of the outputs of our truth-function

// prettier-ignore
type TruthTable<Column extends [boolean, boolean, boolean, boolean], P extends Proposition, Q extends Proposition > =
    TruthVals<P,Q> extends [true, true] ? Column[0]  :
    TruthVals<P,Q> extends [true, false]?  Column[1] :
    TruthVals<P,Q> extends [false, true]?  Column[2] :
    TruthVals<P,Q> extends [false, false]?  Column[3] : never

// Now let's define the four basic logical connectives and, or, if then, and not

type AndTruthFunc<P extends Proposition, Q extends Proposition> = TruthTable<
    [true, false, false, false], // P & Q is only true when both components are true
    P,
    Q
>;

type OrTruthFunc<P extends Proposition, Q extends Proposition> = TruthTable<
    [true, true, true, false], // P or Q is only false when both components are false
    P,
    Q
>;

// If P then Q is only false Q is true and P is false
type IfThenTruthFunc<P extends Proposition, Q extends Proposition> = TruthTable<
    [true, false, true, true],
    P,
    Q
>;

// For negation there's only one propositional argument. It just flips the truth value
type NotTruthFunc<P extends Proposition> = P["tVal"] extends true
    ? false
    : true;

// Having defined out truth functions, we can move on to define the types of the truth-functional propositions we will build with these connectives.

// Since we want to see the actual truth values of proposition types in our editor we need to force the TypeScript compiler to resolve the types completely with this recursive resolve type function.
type ResolveType<T> = T extends object
    ? { [K in keyof T]: ResolveType<T[K]> }
    : T;

// This is just for convenience to avoid re-writing these shared properties
type TruthFunctionSyntax = {
    syntax: "TruthFunction";
};

export type And<
    P extends Proposition,
    Q extends Proposition
> = TruthFunctionSyntax & {
    symbol: "&";
    components: [P, Q];
} & ResolveType<{
        tVal: AndTruthFunc<P, Q>;
    }>;

type TrueTrue = And<True, True>;
type FalseFalse = And<False, False>;

type FFandTT = And<FalseFalse, TrueTrue>;
type FFandFalse = And<FalseFalse, False>;

const SkyAndPigs: And<typeof theSkyIsBlue, typeof pigsFly> = {
    syntax: "TruthFunction",
    symbol: "&",
    components: [theSkyIsBlue, pigsFly],
    // tVal: true  // type error
    tVal: false,
};

export type Or<
    P extends Proposition,
    Q extends Proposition
> = TruthFunctionSyntax & {
    symbol: "∨";
    components: [P, Q];
} & ResolveType<{
        tVal: OrTruthFunc<P, Q>;
    }>;

export type IfThen<
    P extends Proposition,
    Q extends Proposition
> = TruthFunctionSyntax & {
    symbol: "⊃";
    components: [P, Q];
} & ResolveType<{
        tVal: IfThenTruthFunc<P, Q>;
    }>;

export type Not<P extends Proposition> = TruthFunctionSyntax & {
    symbol: "¬";
    components: [P];
} & ResolveType<{
        tVal: NotTruthFunc<P>;
    }>;

// Let's make sure that our export type definitions for atoms and composite propositions are actually subtypes of our general Proposition type.
type IsSubtype<A, B> = A extends B ? true : false;

type TestAtomAsProp = IsSubtype<Atom<boolean>, Proposition>;
type TestAndAsProp = IsSubtype<And<Proposition, Proposition>, Proposition>;
type TestOrAsProp = IsSubtype<Or<Proposition, Proposition>, Proposition>;
type TestIfThenAsProp = IsSubtype<
    IfThen<Proposition, Proposition>,
    Proposition
>;
type TestNotAsProp = IsSubtype<Not<Proposition>, Proposition>;

// Example

// False ∨ (True & True)
type FFandFalse_or_TrueTrue = Or<False, TrueTrue>;

//Logical Truths  (Truth Functional Truths)
// A proposition is logically true if every assignment of truth-values to it's atoms yields the truth of the whole statement

// Consider  (¬P ∨ P)
type NotPOrP<P extends Proposition> = Or<Not<P>, P>;

// We can test this by trying it with P = True and P = False
type PAssignedTrue = NotPOrP<True>["tVal"];

type PAssignedFalse = NotPOrP<False>["tVal"];

// We have just given a semantic proof of (¬P ∨ P)

// prettier-ignore
type PImpliesPorQ<P extends Proposition, Q extends Proposition>
= IfThen<P, Or<P, Q> >; // P ⊃ (P ∨ Q)

type PImpliesPorQ_TT = PImpliesPorQ<True, True>["tVal"];
type PImpliesPorQ_TF = PImpliesPorQ<True, False>["tVal"];
type PImpliesPorQ_FT = PImpliesPorQ<False, True>["tVal"];
type PImpliesPorQ_FF = PImpliesPorQ<False, False>["tVal"];

// We can manually check that they are all true.

// It would be nice not to have to check each result separately.

// To be a logical truth, we need all truth value assignments to come out true
type AllTrue = [true, true, true, true];

// Type extension in both directions is type equality
export type TypeEq<T, S> = [T, S] extends [S, T] ? true : false;

// We check all variable assignments for true.
type SemanticProofInTwoVars<
    TruthValueAssignments extends [boolean, boolean, boolean, boolean]
> = TypeEq<TruthValueAssignments, AllTrue>;

type ProofOfPImpliesPorQ = SemanticProofInTwoVars<
    [PImpliesPorQ_TT, PImpliesPorQ_TF, PImpliesPorQ_FT, PImpliesPorQ_FF]
>;

// Just to show that our satisfaction solver works to exclude things that are not logically true, let's try out the defining truth values for the connective &
type TestAndForLogicalTruth = SemanticProofInTwoVars<
    [true, false, false, false]
>; // false

// More complex logical proofs can be expressed using the biconditional or logical equivalence relation.

// Logical Equivalence
//  P ⇔ Q  means by definition  (P ⊃ Q) & (Q ⊃ P)
type Biconditional<P extends Proposition, Q extends Proposition> = And<
    IfThen<P, Q>,
    IfThen<Q, P>
>;

// DeMorgan's Law Asserts the Logical Truth of an interesting logical equivalence
//  ¬(P & Q) ⇔ (¬P ∨ ¬Q)
// It is not the case that "P and Q" means the same logically as neither P nor Q
type DeMorgan<P extends Proposition, Q extends Proposition> = Biconditional<
    Not<And<P, Q>>,
    Or<Not<P>, Not<Q>>
>;

// Unfortunately we have to do this part manually since we TypeScript doesn't let us apply type arguments to generic type parameters (i.e., it lacks higher-kinded types as in Haskell)
type assignment1 = DeMorgan<True, True>["tVal"];
type assignment2 = DeMorgan<True, False>["tVal"];
type assignment3 = DeMorgan<False, True>["tVal"];
type assignment4 = DeMorgan<False, False>["tVal"];

type ProofOfDeMorgansLaw = SemanticProofInTwoVars<
    [assignment1, assignment2, assignment3, assignment4]
>; // true
