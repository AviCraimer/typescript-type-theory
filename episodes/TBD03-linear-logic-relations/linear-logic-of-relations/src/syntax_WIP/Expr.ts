import { NoInstance } from "./Utility";

export type Arity = 0 | 1 | 2 | 3 | "n";

type GetChildrenConstraint<N extends Arity> = N extends 0
    ? []
    : N extends 1
    ? [unknown]
    : N extends 2
    ? [unknown, unknown]
    : N extends 3
    ? [unknown, unknown, unknown]
    : N extends "n"
    ? unknown[]
    : never;

type TypedList<
    Types extends string[],
    BaseType extends {} = {}
> = Types extends []
    ? []
    : Types extends [string]
    ? [{ type: Types[0] } & BaseType]
    : Types extends [string, string]
    ? [{ type: Types[0] } & BaseType, { type: Types[1] } & BaseType]
    : Types extends [string, string, string]
    ? [
          { type: Types[0] } & BaseType,
          { type: Types[1] } & BaseType,
          { type: Types[2] } & BaseType
      ]
    : ({ type: Types[number] } & BaseType)[];

export type GetArity<Children extends any[]> = Children extends
    | [any, any, any]
    | [any, any]
    | [any]
    | []
    ? Children["length"]
    : "n";

export type Expr<
    Type extends string,
    A extends Arity,
    ChildTypes extends GetChildrenConstraint<A>
> = {
    metaType: "expression";
    arity: A;
    type: Type;

    //The second argument here is a half-measure, the type of each child will be set correctly, but not the child types of the child.
    children: ChildTypes;
    // We only have leaf values for arity zero expressions
    leaf: ChildTypes extends [] ? any : undefined;
};

// example,

// Number
// Numbers as nullary expressions
// plus and minus as binary expressions

type MyNumber = Expr<"Number", 0, []> & { leaf: number };

const five: MyNumber = {
    metaType: "expression",
    arity: 0,
    type: "Number",
    children: [],
    // We only have leaf values for arity zero expressions
    leaf: 5,
};

type NumberExprType = "Number" | "Plus" | "Minus";

type NumberExpr = Expr<NumberExprType, 0 | 2, [] | [NumberExpr, NumberExpr]>;

type Plus = Expr<"Plus", 2, [NumberExpr, NumberExpr]>;

type Minus = Expr<"Minus", 2, [NumberExpr, NumberExpr]>;

const fivePlusFive: Plus = {
    metaType: "expression",
    arity: 2,
    type: "Plus",
    children: [five, five],
    leaf: undefined,
};

const fiveMinusFivePlusFive: Minus = {
    metaType: "expression",
    arity: 2,
    type: "Minus",
    children: [five, fivePlusFive],
    leaf: undefined,
};

export type MetaExpr<E extends Expr<string, Arity, any>> = Omit<
    E,
    "metaType" | "children" | "leaf"
> & {
    metaType: "metaExprVariable";
    metaVarName: string;
    children?: NoInstance<{ ChildrenTypes: E["children"] }>; // This is included to make it easy to extract the type of children from the meta-variable
};

export type MetaExprChildTypes<
    MExp extends MetaExpr<Expr<string, Arity, unknown[]>>
> = Exclude<MExp["children"], undefined>["ChildrenTypes"];

type NumberMetaExpr = MetaExpr<NumberExpr>;

const metaExpression: NumberMetaExpr = {
    metaType: "metaExprVariable",
    metaVarName: "X",
    arity: 2,
    type: "Plus",
};

type NumberChildTypes = MetaExprChildTypes<NumberMetaExpr>;

type ResolveType<T> = T extends object
    ? { [K in keyof T]: ResolveType<T[K]> }
    : T;

//
