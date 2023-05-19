import {
    lam,
    LambdaExpr,
    Variable,
    Application,
    Abstraction,
} from "../TBD01-lambda-substitution/index";

// Remember our TypeScript compiler based version of Church's simply type lambda calculus.

// We will now so something similar with lambdas
type TypeExpr = BaseTypeSymbol | FunctionType<any, any>;

type FunctionType<Domain extends TypeExpr, Codomain extends TypeExpr> = {
    meta: {
        syntax: "hom_type";
        typeSystemRole: "type";
    };
    domain: Domain;
    codomain: Codomain;
};

type BaseTypeSymbol = Variable<{
    syntax: "variable";
    typeSystemRole: "type";
}>;

//Type Constructors
const baseT = (name: string): BaseTypeSymbol => {
    return {
        ...lam.Var(name),
        meta: {
            syntax: "variable",
            typeSystemRole: "type",
        },
    };
};

const homT = <T1 extends TypeExpr, T2 extends TypeExpr>(
    type1: T1,
    type2: T2
): FunctionType<T1, T2> => {
    return {
        syntax: "hom_type",
        domain: type1,
        codomain: type2,
    };
};

// Define our simply typed lambda terms
type TermVariable = Variable<{
    syntax: "variable";
    typeSystemRole: "term";
    inType: TypeExpr;
}>;

type TAbstraction<D extends TypeExpr, C extends TypeExpr> = Abstraction<{
    syntax: "abstraction";
    typeSystemRole: "term";
    inType: FunctionType<any, any>;
}> & {
    boundVar: TermVariable & { meta: { inType: C } } & {
        children: [{ meta: { inType: D } }];
    }; /// LOOK HOW UGLY THIS IS!!!  GO back and fix the untyped calculus!
};

type TApplication = Application<{
    syntax: "application";
    typeSystemRole: "term";
    inType: TypeExpr;
}>;

//TODO: After I refactor the free vars and children come back to this.
// Use intersections to mirror the internal language types wtih TypeScript types using generics.
