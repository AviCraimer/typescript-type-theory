import { cloneDeep } from "lodash";
import { copyCore, objEq } from "./utils";

export type LambdaTerm = Variable | Application | Abstraction;
export type LambdaExpression = LambdaTerm | BoundVariable;

type Variable = FreeVariable | BoundVariable;

//The properties in this array will be ignored when comparing lambda expressions for equality
const inessentialLambdaProps = [
    "deBruijnNumber",
    "boundVarName",
    "freeVarAbstractedOver",
] as const;

type ToStringOption = "names" | "indexes" | "both";
type CommonLambda = {
    toString(withIndexes?: ToStringOption): string;
    getDeBruijnNumber(): number;
    eq(E: LambdaTerm): boolean; //Compares the lambda with another, ignoring inessential properties
    deBruijnNumber?: number;
};

const copyLambda = <E extends LambdaExpression>(
    exp: E,
    preserveDeBruijn: boolean = false
): E => {
    if (preserveDeBruijn === false) {
        return copyCore<typeof inessentialLambdaProps[number]>([
            "deBruijnNumber",
        ])(exp) as E;
    } else {
        return cloneDeep(exp) as E;
    }
};

const lambdaEq = objEq(inessentialLambdaProps);
const lambdaEqMethod = function (
    this: LambdaExpression,
    exp: LambdaExpression
): boolean {
    return lambdaEq(this, exp);
};

//Takes a pure function for getting a DeBruijn Number from a lambda expression and returns a method to be used as the getDeBruijnNumber method. Note that the returned method has a side effect of storing the results in a property. This means that quality checking must ignore the optional "deBruijnNumber" property.
const makeGetDeBruijnNumberFn = <E extends LambdaExpression>(
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

//The characters in this array cannot be used in free variable names
const reservedChars = [
    "˚",
    "λ",
    "@",
    " ",
    "\n",
    ".",
    "[",
    "]",
    "(",
    ")",
] as const;

export function Var(name: string): FreeVariable {
    // Enforce that no free variable can use the special symbols used for bound variables. This is more for readability than functionality, since a free variable with the name 𝓍 would not be equal to a bound variable with that display symbol.
    reservedChars.forEach((char) => {
        name = name.replaceAll(char, "");
    });

    return { ...freeVarTemplate, name };
}

type BoundVariable = Readonly<{
    role: "Bound Variable";
    deBruijnIndex: number; //This is equal to the DeBruijn Number of the lambda expression that binds the variable
}> & {
    boundVarName?: string;
} & CommonLambda;

const boundVarTemplate: BoundVariable = {
    role: "Bound Variable",
    toString(withIndexes: ToStringOption = "names") {
        if (withIndexes === "names" && this.boundVarName) {
            return "˚" + this.boundVarName;
        } else if (withIndexes === "both" && this.boundVarName) {
            return this.boundVarName + "@" + this.deBruijnIndex;
        } else {
            return "˚" + this.deBruijnIndex;
        }
    },
    getDeBruijnNumber: makeGetDeBruijnNumberFn(() => 0),
    deBruijnNumber: 0,
    deBruijnIndex: 1,
    eq: lambdaEqMethod,
};

export function boundVar(index: number, boundVarName?: string): BoundVariable {
    const bound = { ...boundVarTemplate, deBruijnIndex: index };
    if (boundVarName) {
        bound.boundVarName = boundVarName;
    }
    return bound;
}

//****Composite LambdaTerm Expressions - Application and Abstraction***

export type Application = Readonly<{
    role: "Application";
    func: LambdaTerm;
    argument: LambdaTerm;
}> &
    CommonLambda;

const applicationTemplate: Application = {
    role: "Application",
    func: Var("x"),
    argument: Var("x"),
    toString(withIndexes: ToStringOption = "names") {
        return `${this.func.toString(withIndexes)}(${this.argument.toString(
            withIndexes
        )})`;
    },
    getDeBruijnNumber: makeGetDeBruijnNumberFn(function (exp: Application) {
        return Math.max(
            exp.func.getDeBruijnNumber(),
            exp.argument.getDeBruijnNumber()
        );
    }),
    eq: lambdaEqMethod,
};

export const apply = (...args: LambdaTerm[]): Application => {
    if (args.length < 2) {
        throw new Error("Cannot apply with fewer than two lambda arguments");
    }

    const applyOnce = (func: LambdaTerm, argument: LambdaTerm): Application => {
        return { ...applicationTemplate, func, argument };
    };

    return args.reduce(applyOnce) as Application;
};

const isBound = (exp: LambdaTerm): exp is BoundVariable =>
    exp.role === "Bound Variable";

const isFree = (exp: LambdaTerm): exp is FreeVariable =>
    exp.role === "Free Variable";

const isVariable = (exp: LambdaTerm): exp is Variable =>
    isFree(exp) || isBound(exp);

//In this case, since we are just replacing free variables with bound variables. We don't need to worry about updating the De Bruijn Numbers.
const freeVarSubstitution = (body: LambdaTerm, variable: FreeVariable) => {
    //Any time a new lambda is introduced we increment the De Bruign Number by 1 and use this as the index for the lambda's bound variable.
    const bound = boundVar(body.getDeBruijnNumber() + 1, variable.name);

    //We recursively generate a new expression with the bound variable substituting the given free variable.
    const inner = (exp: LambdaTerm): LambdaTerm => {
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
    body: LambdaTerm;
    getParameter(): BoundVariable;
    freeVarAbstractedOver?: FreeVariable;
}> &
    CommonLambda;

const abstractionTemplate: Abstraction = {
    role: "Abstraction",
    body: Var("x"),
    freeVarAbstractedOver: Var("x"),
    toString(withIndexes: ToStringOption = "names") {
        return `λ(${this.getParameter().toString(
            withIndexes
        )}).[${this.body.toString(withIndexes)}]`;
    },
    getDeBruijnNumber: makeGetDeBruijnNumberFn(function (exp: Abstraction) {
        return exp.body.getDeBruijnNumber() + 1;
    }),
    eq: lambdaEqMethod,
    //Returns the bound variable for the expression
    getParameter() {
        return boundVar(
            this.getDeBruijnNumber(),
            this?.freeVarAbstractedOver?.name
        );
    },
};

export const abstract = (
    prevExpression: LambdaTerm,
    ...vars: FreeVariable[]
): Abstraction => {
    //This is the DeBruijn number of the new lambda abstraction, which is also, the DeBruijn index of it's bound variable instances. This number creates the binding link between the lambda abstraction and it's variables.

    const abstractOnce = (
        prevExpression: LambdaTerm,
        variable: FreeVariable
    ) => {
        return {
            ...abstractionTemplate,
            freeVarAbstractedOver: copyLambda(variable),
            body: freeVarSubstitution(prevExpression, variable),
        };
    };

    return vars.reduce(abstractOnce, prevExpression) as Abstraction;
};
