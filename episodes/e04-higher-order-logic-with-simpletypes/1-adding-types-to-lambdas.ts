import {
    lam,
    LambdaExpr,
    Variable,
    Application,
    Abstraction,
    BaseLambda,
} from "../TBD01-lambda-substitution/index";

// Remember our TypeScript compiler based version of Church's simply type lambda calculus.

// We will now so something similar with lambdas
export type TypeExpr = BaseTypeSymbol<any> | FunctionType<any, any>;

export type FunctionType<
    Domain extends TypeExpr = TypeExpr,
    Codomain extends TypeExpr = TypeExpr
> = BaseLambda<{
    syntax: "FunctionType";
    typeSystemRole: "TypeExpr";
    domain: Domain;
    codomain: Codomain;
}>;

// Gets the type of the domain of a function type, useful for constructing abstractions
export type Domain<FunType> = FunType extends FunctionType<
    infer Domain,
    infer _
>
    ? Domain
    : never;

// Gets the type of the codomain of a function type, useful for constructing abstractions
export type Codomain<FunType> = FunType extends FunctionType<
    infer _,
    infer Codomain
>
    ? Codomain
    : never;

export type BaseTypeSymbol<Sym extends string> = Variable<{
    typeSystemRole: "TypeExpr";
    name: Sym;
}>;

//Type Constructors
export const baseT = <const Sym extends string>(
    name: Sym
): BaseTypeSymbol<Sym> => {
    return {
        ...lam.Var(name),
        typeSystemRole: "TypeExpr",
        name,
    };
};

export const funcType = <T1 extends TypeExpr, T2 extends TypeExpr>(
    type1: T1,
    type2: T2
): FunctionType<T1, T2> => {
    return {
        syntax: "FunctionType",
        typeSystemRole: "TypeExpr",
        domain: type1,
        codomain: type2,
    };
};

// Simply Typed Terms

export type Term<Type extends TypeExpr = TypeExpr> =
    | TermVariable<Type>
    | TermAbstraction<
          Type extends FunctionType<Domain<Type>, Codomain<Type>> ? Type : never
      >
    | TermApplication<Type>;

// Define our simply typed lambda terms
export type TermVariable<T extends TypeExpr> = Variable<{
    typeSystemRole: "term";
    ofType: T;
}>;

// Constants are quite similar to variables but they differ in that special rules can apply to them and they never appear as bound to lambdas
// In addition, we cannot perform lambda abstraction over constants, but this will be enforced in the abstraction constructor below.
export type Constant<Type extends TypeExpr> = Variable<{
    typeSystemRole: "constant";
    name: string; // Unlike variable names which are arbitrary identifiers, the names of constants, e.g., "=" have structural meaning in the system
    ofType: Type;
}>;

// We have no general constructor for constants since the constants that may be constructed are specific to different languages implemented within the general type system
// The main constant we'll use in higher-order logic will be the equality constant

export type TypedLambda<Type extends TypeExpr = TypeExpr> =
    | Term<Type>
    | Constant<Type>;
//Although it looks like we've introduced a new kind of syntax, from the perspective of the untyped lambda calculus we haven't changed anything. From the perspective of the untyped calculus and beta-reduction we have simply introduced a some additional free variables.

//Extracts the type of a term
export type OfType<Ter> = Ter extends Term<infer TermType> ? TermType : never;

// Constructs variables.
// In a system with constants, the variables should not be allowed to have the same name as the constants.
export const tVar = <Type extends TypeExpr>(
    name: string,
    typeExp: Type
): TermVariable<Type> => {
    return {
        ...lam.Var(name),
        typeSystemRole: "term",
        ofType: typeExp,
    };
};

export type TermAbstraction<
    Type extends FunctionType<Domain<Type>, Codomain<Type>>
> = Abstraction<{
    typeSystemRole: "term";
    ofType: Type;
    boundVar: TermVariable<Domain<Type>>;
    body: Term<Codomain<Type>>;
}>;

export const tAbs = <Type extends FunctionType<Domain<Type>, Codomain<Type>>>(
    termVar: TermVariable<Domain<Type>>,
    body: Term<Codomain<Type>>
): TermAbstraction<Type> => {
    return {
        syntax: "abstraction",
        typeSystemRole: "term",
        boundVar: termVar,
        body: body,
        // Tricky type errorr about instantiations with a different subtype. Would be good to get to the bottom of it. But I think it's safe for now since I know the types match up.

        //@ts-ignore
        ofType: funcType(
            termVar.ofType as Domain<Type>,
            body.ofType as Codomain<Type>
        ),
    };
};

export type TypeEq<T, S> = [T, S] extends [S, T] ? true : false;

export type TermApplication<Type extends TypeExpr> = Application<{
    syntax: "application";
    typeSystemRole: "term";
    func: TypeExpr;
    arg: TypeExpr;
    ofType: Type; // This is the reduced type
}>;

export const tApp = <
    Func extends Term<FunctionType>,
    Arg extends Domain<OfType<Func>>
>(
    // Note the order of the type arguments is reversed from the function arguments
    lam1: Func,
    lam2: Arg
) => {
    return {
        syntax: "application",
        typeSystemRole: "term",
        func: lam1,
        arg: lam2,
        ofType: lam1.ofType.codomain, //Based on the type level reduction rule for applications
    };
};
