import { copyCore, objEq } from "./utils";

export type Lambda = Variable | Application | Abstraction;

type Variable = FreeVariable | BoundVariable;

const inessentialLambdaProps = ["deBruijnNumber"] as const;
type CommonLambda = {
    toString(): string;
    getDeBruijnNumber(): number;
    eq(E: Lambda): boolean; //Compares the lambda with another, ignoring inessential properties
    deBruijnNumber?: number;
};

//Copies a lambda expression removing all optional properties.
const copyLambda = <E extends Lambda>(exp: E): E => {
    return copyCore<typeof inessentialLambdaProps[number]>(
        inessentialLambdaProps
    )(exp) as E;
};

const lambdaEq = objEq(inessentialLambdaProps);
const lambdaEqMethod = function (this: Lambda, exp: Lambda): boolean {
    return lambdaEq(this, exp);
};

//Takes a pure function for getting a DeBruijn Number from a lambda expression and returns a method to be used as the getDeBruijnNumber method. Note that the returned method has a side effect of storing the results in a property. This means that quality checking must ignore the optional "deBruijnNumber" property.
const makeGetDeBruijnNumberFn = <E extends Lambda>(
    callback: (exp: E) => number
) => {
    const getDeBruijnNumber = function (this: E) {
        if ("deBruijnNumber" in this) {
            return this.deBruijnNumber;
        }

        //The call back will be specific to the type of lambda expression in question
        const num = callback(this);

        //Remember the number to avoid uncessary recursion
        this.deBruijnNumber = num;
        return num;
    };
    return getDeBruijnNumber;
};

type BoundVariable = Readonly<{
    role: "Bound Variable";
    deBruijnIndex: number; //This is equal to the DeBruijn Number of the lambda expression that binds the variable
}> &
    CommonLambda;

type FreeVariable = Readonly<
    CommonLambda & {
        role: "Free Variable";
        name: string;
    }
> &
    CommonLambda;

const freeVarTemplate: FreeVariable = {
    name: "",
    role: "Free Variable",
    toString() {
        return this.name;
    },
    getDeBruijnNumber: makeGetDeBruijnNumberFn(() => 0),
    deBruijnNumber: 0,
    eq: lambdaEqMethod,
};

export function Var(name: string): FreeVariable {
    // The cursive '𝓍' unicode symbol is reserved for bound variable display
    name = name.replaceAll("𝓍", "");

    return { ...freeVarTemplate, name };
}

const getBoundVarSymbol = (index: number) => {
    const unicodeSymbols = ["𝓍", "𝓎", "𝓏", "𝓌"];

    const length = unicodeSymbols.length;

    const numeral = Math.ceil(index / length - 1);

    const symIndex = index % length > 0 ? (index % length) - 1 : length;

    return `${unicodeSymbols[symIndex]}${numeral > 0 ? numberal : ""}`;
};

const boundVarTemplate: BoundVariable = {
    role: "Bound Variable",
    toString() {
        return getBoundVarSymbol(this.deBruijnIndex);
    },
    getDeBruijnNumber: makeGetDeBruijnNumberFn(() => 0),
    deBruijnNumber: 0,
    deBruijnIndex: 1,
    eq: lambdaEqMethod,
};

export function boundVar(index: number): BoundVariable {
    return { ...boundVarTemplate, deBruijnIndex: index };
}

//****Composite Lambda Expressions - Application and Abstraction***

//Gives the coordinate of a sub-expression by walking the tree from a root.
type ExpressionCoordinates = ("func" | "argument" | "body")[];

export type Application = Readonly<{
    role: "Application";
    func: Lambda;
    argument: Lambda;
}> &
    CommonLambda;

const applicationTemplate: Application = {
    role: "Application",
    func: Var("x"),
    argument: Var("x"),
    toString() {
        return `${this.func.toString()}(${this.argument.toString()})`;
    },
    getDeBruijnNumber: makeGetDeBruijnNumberFn(function (exp: Application) {
        return Math.max(
            exp.func.getDeBruijnNumber(),
            exp.argument.getDeBruijnNumber()
        );
    }),
    eq: lambdaEqMethod,
};

export const apply = (...args: Lambda[]): Application => {
    if (args.length < 2) {
        throw new Error("Cannot apply with fewer than two lambda arguments");
    }

    const applyOnce = (func: Lambda, argument: Lambda): Application => {
        return { ...applicationTemplate, func, argument };
    };

    let current = applyOnce(args[0], args[1]);

    args.forEach((arg, i) => {
        if (i > 1) {
            current = applyOnce(current, arg);
        }
    });

    return current;
};

const isBound = (exp: Lambda): exp is BoundVariable =>
    exp.role === "Bound Variable";

const isFree = (exp: Lambda): exp is FreeVariable =>
    exp.role === "Free Variable";

const isVariable = (exp: Lambda): exp is Variable =>
    isFree(exp) || isBound(exp);

// To create an abstraction we need substitution.
// export const substitution = (
//     expression: Lambda,
//     replace: Variable,
//     substitute: Lambda,
// ): Lambda => {
//     if (isVariable(expression)) {
//         //Variable
//         if (expression.eq(replace)) {
//             //You are replacing the expression which is a free variable
//             if (isFree(replace) && !isBound(substitute)) {
//                 throw new Error(
//                     "You can only replace a free variable with a bound variable."
//                 );
//             }
//             //Substitutes for a variable
//             return substitute;
//         } else {
//             //Otherwise return it unmodified
//             return expression;
//         }
//     } else if (expression.role === "Abstraction") {
//         const {  body } = expression;

//         return {
//             ...expression,
//             parameter:
//                 isBound(substitute) && replace === expression.parameter
//                     ? (substitute as VariableBound)
//                     : expression.parameter,
//             body: substitution(body, replace, substitute),
//         };
//     } else if (expression.role === "Application") {
//         //Application
//         const { func, argument } = expression;

//         return {
//             ...expression,
//             func: substitution(func, replace, substitute),
//             argument: substitution(argument, replace, substitute),
//         };
//     }
//     const nothing: never = expression; //So TypeScript knows undefined will never be implicitly returned by the function.
//     return nothing;
// };

//In this case, we are just replacing free variables with bound variables. We don't need to worry about re-indexing.
const freeVarSubstitution = (body: Lambda, variable: FreeVariable) => {
    const bound = boundVar(body.getDeBruijnNumber() + 1);
    const inner = (exp: Lambda): Lambda => {
        if (exp.eq(variable)) {
            return bound;
        } else if (exp.role === "Abstraction") {
            return { ...exp, body: inner(exp.body) };
        } else if (exp.role === "Application") {
            return {
                ...exp,
                func: inner(exp.func),
                argument: inner(exp.argument),
            };
        }
        return exp;
    };
    return inner(body);
};

export type Abstraction = Readonly<{
    role: "Abstraction";
    body: Lambda;
    getParameter(): BoundVariable;
}> &
    CommonLambda;

const abstractionTemplate: Abstraction = {
    role: "Abstraction",
    body: Var("x"),
    toString() {
        return `ʎ(${this.getParameter().toString()}).[ ${this.body.toString()} ]`;
    },
    getDeBruijnNumber: makeGetDeBruijnNumberFn(function (exp: Abstraction) {
        return exp.body.getDeBruijnNumber() + 1;
    }),
    eq: lambdaEqMethod,
    getParameter() {
        return boundVar(this.getDeBruijnNumber());
    },
};

export const abstract = (
    prevExpression: Lambda,
    variable: FreeVariable
): Abstraction => {
    //This is the deBruijnNumber of the new lambda abstraction, which is also, the deBruijnIndex of it's bound variable instances. This number creates the binding link between the lambda abstraction and it's variables.

    const body = freeVarSubstitution(prevExpression, variable);

    return { ...abstractionTemplate, body };
};

export const print = (...objs: any[]) => {
    objs.forEach((obj) => console.log(obj.toString()));
};

///Tests
const x = Var("x");
const y = Var("y");
const z = Var("z");
const w = Var("w");

const appExpression = apply(x, y, apply(z, w));
const absX = abstract(appExpression, Var("x"));
const absY = abstract(absX, Var("y"));

console.log(appExpression.toString());

console.log(absY.toString());
