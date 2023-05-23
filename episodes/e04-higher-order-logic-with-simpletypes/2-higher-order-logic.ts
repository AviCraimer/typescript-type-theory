import {
    TypeExpr,
    Term,
    OfType,
    BaseTypeSymbol,
    FunctionType,
    Domain,
    Codomain,
    baseT,
    funcType,
    TermVariable,
    TermAbstraction,
    TypeEq,
    TermApplication,
    tApp,
    Constant,
    tVar,
    TypedLambda,
} from "./1-adding-types-to-lambdas";

type TruthValue = BaseTypeSymbol<"TruthValue">;
const truthValueExp: TruthValue = baseT("TruthValue");

type Ind = BaseTypeSymbol<"Individuals">;
const indExp: Ind = baseT("Individuals");

// Define the Type Universe (Formation of Types)
type IsLogicBase<Type extends TypeExpr> = Type extends Ind
    ? TypeEq<Type, Ind>
    : TypeEq<Type, TruthValue>;

// prettier-ignore
type IsLogicalType<Type extends TypeExpr> =
IsLogicBase<Type> extends true
    ? true
: Type extends FunctionType<infer Domain, infer Codomain>
    ? [IsLogicalType<Domain>, IsLogicalType<Codomain>] extends [true, true]
        ?   true
    : false
: false

type LogicType<Type extends TypeExpr> = IsLogicalType<Type> extends true
    ? Type
    : never;

// For Type Safe type casting
const asLogicType = <Type extends TypeExpr>(
    tExp: LogicType<Type>
): LogicType<Type> => tExp;

//e.g., tests

type goodExamples = [
    LogicType<Ind>,
    LogicType<TruthValue>,
    LogicType<EqualityType<Ind>>,
    LogicType<FunctionType<Ind, Ind>>
];

type badExamples = [
    //All types resolve to never
    LogicType<BaseTypeSymbol<"A">>,
    LogicType<FunctionType<BaseTypeSymbol<"A">, Ind>>,
    LogicType<FunctionType<Ind, BaseTypeSymbol<"A">>>,
    LogicType<FunctionType<BaseTypeSymbol<"B">, BaseTypeSymbol<"A">>>,
    LogicType<TypeExpr>
];

const logicFunction = <A extends TypeExpr, B extends TypeExpr>(
    AExp: LogicType<A>,
    BExp: LogicType<B>
) => {
    return funcType(AExp, BExp) as LogicType<
        FunctionType<typeof AExp, typeof BExp>
    >;
};

const formationRules = [() => indExp, () => truthValueExp, logicFunction];

// Now we define all the valid lambda expressions at the value level.

// We use 'term' for everything that is not a constant.

// In this case our only constants are the equality relations which we have one for each type.

type LogicLambda<Type extends TypeExpr> = LogicTerm<Type> | EqConstant<Type>;

// A logical term is simply a simply typed lamda term with a type from our logic system
type LogicTerm<Type extends TypeExpr> = Term<LogicType<Type>>;

// Equality type has the pattern A -> A -> TruthValue, where A is any logic type
type EqualityType<Type extends TypeExpr> = LogicType<
    FunctionType<
        LogicType<Type>,
        LogicType<FunctionType<LogicType<Type>, TruthValue>>
    >
>;

// The Equality Constant is a mild extension to our simply typed lambda system
// The main reason for not simply treating it as a lambda abstraction is that a special rule of logical inference applies to it.
type EqConstant<CommonType extends TypeExpr> = Constant<
    EqualityType<CommonType>
> & { name: "="; ofType: EqualityType<CommonType> };

// Used to assert equality of individuals/objects or our logical domain
type EqInd = EqConstant<Ind>;

// Used to assert equality of truth values
type EqTruth = EqConstant<TruthValue>;

// Constructs the type expression for equality types. Note, this does not introduce any new class of types into our system since at the type level it is simply a function type.
const eqTypeExp = <Type extends TypeExpr>(
    typeExpr: LogicType<Type>
): EqualityType<Type> => {
    return logicFunction(typeExpr, logicFunction(typeExpr, truthValueExp));
};

// Constructs the value level expression which can be used to build further expressions.
// Note, we'll need to expand our system of lambda term formation as well as alpha and beta reduction to account for constants.
const eqConst = <Type extends TypeExpr>(
    typeExpr: LogicType<Type>
): EqConstant<Type> => {
    return {
        syntax: "constant",
        typeSystemRole: "term",
        name: "=",
        ofType: eqTypeExp(typeExpr),
    };
};

// Typing a Term Variable
// Note in this implementation, the same variable name can be reused in the same expression with a different type.
// For purposes of substitution and alpha-equivalence e.g., x:Ind and x:TruthValue are distinct variables.

const varTerm = <Type extends TypeExpr>(
    name: string,
    typeExpr: LogicType<Type>
) => {
    const x = tVar(name, typeExpr);
    return x;
};

const absTerm = <Type extends TypeExpr>(
    name: string,
    typeExpr: LogicType<Type>
) => {
    const x = tVar(name, typeExpr);
    return x;
};
