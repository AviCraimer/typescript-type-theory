// These are used for defining re-write rules. They represent an expression of whatever type is needed to fill the slot they are in.
// The instance property lets us have more than one expression variable. If two such syntax variables have the same instance in the same expression they represent different occurrences of syntactically identical expressions.
type ExpressionSyntaxVar = {
    metaType: "Expression syntax variable";
    instance: number | string;
};

type InductiveFormer<T> = {
    name: string;
    exprType: T; // The type of expression formed by the inductive former.
    //Below: used for accessor object to build expresses quickly
    keyName: string;
    arity: "nullary" | "unary" | "binary" | "n-ary";

    // A string value is for a fixed symbol, e.g., '+'
    // The finite key is for a fixed set of strings that are allowed, which are provided to the instance
    // The infinite key is for unbounded sets of numbers of strings, e.g., for variables names or numeric constants.
    symbol: string | { finite: Set<string> } | { infinite: number | string };
    infix: boolean;
};

type ExpressionFamilyParams<Types> = {
    name: string; // Name of the family
    formers: InductiveFormer<Types>[]; //
};

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
