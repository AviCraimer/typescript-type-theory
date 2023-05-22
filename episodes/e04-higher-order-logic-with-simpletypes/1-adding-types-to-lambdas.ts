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
type TypeExpr = BaseTypeSymbol<any> | FunctionType<any, any>;
type Term =
    | TermVariable<any>
    | TermAbstraction<any, any>
    | TermApplication<any>;

type FunctionType<
    Domain extends TypeExpr,
    Codomain extends TypeExpr
> = BaseLambda<{
    syntax: "hom_type";
    typeSystemRole: "TypeExpr";
    domain: Domain;
    codomain: Codomain;
}>;

type BaseTypeSymbol<Sym extends string> = Variable<{
    typeSystemRole: "TypeExpr";
    name: Sym;
}>;

//Type Constructors
const baseT = <const Sym extends string>(name: Sym): BaseTypeSymbol<Sym> => {
    return {
        ...lam.Var(name),
        typeSystemRole: "TypeExpr",
        name,
    };
};

const A = baseT("A");

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
type TermVariable<T extends TypeExpr> = Variable<{
    typeSystemRole: "term";
    inType: T;
}>;

type TermAbstraction<
    Domain extends TypeExpr,
    Codomain extends TypeExpr
> = Abstraction<{
    typeSystemRole: "term";
    inType: FunctionType<Domain, Codomain>;
    boundVar: TermVariable<Domain>;
}>;

type BodyType<Abs> = Abs extends TermAbstraction<infer _, infer Codomain>
    ? Codomain extends FunctionType<infer BodyD, infer BodyC>
        ? FunctionType<BodyD, BodyC>
        : Codomain // Used for TermVariables and TermApplications
    : never;

type TypeEq<T, S> = [T, S] extends [S, T] ? true : false;

type ReduceApplication<
    Arg extends TypeExpr,
    Func extends FunctionType<Arg, any>
> = Func extends FunctionType<infer _, infer Codomain> ? Codomain : never;

const reduceApplicaiton ():TypeExpr => {

}//Now I need to reduce the type expression at the JS value level


type ABFun = FunctionType<BaseTypeSymbol<"A">, BaseTypeSymbol<"B">>;
type A = BaseTypeSymbol<"A">;
type B = BaseTypeSymbol<"B">;

type ABFun_B = ReduceApplication<A, ABFun>;
// type ABFun_B = ReduceApplication<B, ABFun>; //Type 'ABFun' does not satisfy the constraint 'FunctionType<A, any>'

type TermApplication<Type extends TypeExpr> = Application<{
    syntax: "application";
    typeSystemRole: "term";
    func: TypeExpr,
    arg: TypeExpr,
    inType: Type; // This is the reduced type
}>;

const tApp = <Arg extends TypeExpr,
    Func extends FunctionType<Arg, any>>(lam1: Func, lam2: Arg) => {
        return {
            syntax: "application";
    typeSystemRole: "term";
    func: lam1,
    arg: lam2
    inType: reduceApplication(lam1, lam2)  ;
    }
}
//fix it up

