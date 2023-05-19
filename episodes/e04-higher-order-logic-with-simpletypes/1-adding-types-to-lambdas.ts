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
type TypeExpr = BaseTypeSymbol | FunctionType<any, any>;

type FunctionType<
    Domain extends TypeExpr,
    Codomain extends TypeExpr
> = BaseLambda<{
    syntax: "hom_type";
    typeSystemRole: "TypeExpr";
    domain: Domain;
    codomain: Codomain;
}>;

type BaseTypeSymbol = Variable<{
    typeSystemRole: "TypeExpr";
}>;

//Type Constructors
const baseT = (name: string): BaseTypeSymbol => {
    return {
        ...lam.Var(name),
        typeSystemRole: "TypeExpr",
    };
};

const homT = <T1 extends TypeExpr, T2 extends TypeExpr>(
    type1: T1,
    type2: T2
): FunctionType<T1, T2> => {
    return {
        syntax: "hom_type",
        typeSystemRole: "TypeExpr",
        domain: type1,
        codomain: type2,
    };
};

// Define our simply typed lambda terms
type TermVariable = Variable<{
    typeSystemRole: "term";
    inType: TypeExpr;
}>;

type TermAbstraction<
    Domain extends TypeExpr,
    Codomain extends TypeExpr
> = Abstraction<{
    typeSystemRole: "term";
    inType: FunctionType<Domain, Codomain>;
}> & { boundVar: TermVariable };

type TApplication = Application<{
    syntax: "application";
    typeSystemRole: "term";
    inType: TypeExpr;
}>;

//TODO: After I refactor the free vars and children come back to this.
// Use intersections to mirror the internal language types wtih TypeScript types using generics.
