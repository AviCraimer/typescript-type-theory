import {
    Expr,
    MetaExpr,
    ExprBroadest,
    Arity,
    GetChildrenConstraint,
} from "./Expr";

type ExprFormer<ExpT extends ExprBroadest> = {
    name: ExpT["type"];
    arity: ExpT["arity"];
    exprType: ExpT;
    // Below: a shorter name suitable for a programming interface
    keyName: string;

    // A string value is for a fixed symbol, e.g., '+'
    // The finite key is for a fixed set of strings that are allowed, which are provided to the instance
    // The infinite key is for unbounded sets of numbers of strings, e.g., for variables names or numeric constants.
    symbol: ExpT["arity"] extends 0 ? { useLeaf: true } : string;
    infix: boolean;
};

type ExprFactory<ExF extends ExprFormer<ExprBroadest>> = (
    Former: ExF
) => ExF extends ExprFormer<infer Ex> ? Ex : never;

// type ExpressionFamilyParams<Types> = {
//     name: string; // Name of the family
//     formers: InductiveFormer<Types>[]; //
// };

type Expression<Types, ExpF extends ExpressionFamilyParams<Types>> = {
    metaType: "Expression";
    former: ExpF["formers"][number];
    children: (Expression<Types, ExpF> | ExpressionSyntaxVar)[];
};

// Narrowing of expression requiring no syntax variables
type ExpressionConcrete<
    Types,
    ExpF extends ExpressionFamilyParams<Types>
> = Expression<Types, ExpF> & {
    children: Expression<Types, ExpF>[];
};

// Narrowing of expression requiring only syntax variables, hence it is an expression template.
type ExpressionTemplate<
    Types,
    ExpF extends ExpressionFamilyParams<Types>
> = Expression<Types, ExpF> & {
    children: ExpressionSyntaxVar[];
};

type Rewrite = {};

// type ExpressionFamily<Nullary extends NullaryFormer[], Unary extends UnaryFormer[], Binary extends BinaryFormer[], NAry extends NAryFormer[]> =   {
//     name: string;
//     formers: {};
// };

type NullaryFormer = InductiveFormer & { arity: "nullary"; infix: false };

type UnaryFormer = InductiveFormer & {
    arity: "unary";
    infix: false;
    symbol: string;
};

type BinaryFormer = InductiveFormer & { arity: "binary"; symbol: string };

type NAryFormer = InductiveFormer & { arity: "n-ary"; symbol: string };

const getformExp = () => {};
