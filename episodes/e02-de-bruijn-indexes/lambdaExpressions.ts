import _, { cloneDeep } from "lodash";
import { lambdaEqMethod, reservedChars } from "./utils";

export type LambdaTerm = Variable | Application | Abstraction;
export type LambdaExpression = LambdaTerm | BoundVariable;

type Variable = FreeVariable | BoundVariable;

type ToStringOption = "names" | "indexes" | "both";
type CommonLambda = {
    toString(withIndexes?: ToStringOption): string;
    getDeBruijnNumber(): number;
    eq(E: LambdaExpression): boolean; //Compares the lambda with another, ignoring inessential properties
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
    getDeBruijnNumber: () => 0,
    eq: lambdaEqMethod,
};

export function Var(name: string): FreeVariable {
    // Enforce that no free variable can use the special symbols used for bound variables. This is more for readability than functionality, since a free variable with the name 𝓍 would not be equal to a bound variable with that display symbol.
    reservedChars.forEach((char) => {
        name = name.replaceAll(char, "");
    });

    return { ...freeVarTemplate, name };
}

type BoundVariable = Readonly<{
    role: "Bound Variable";
}> & {
    deBruijnIndex: number; //This is equal to the DeBruijn Number of the lambda expression that binds the variable
    boundVarName?: string;
} & CommonLambda;

const boundVarTemplate: BoundVariable = {
    role: "Bound Variable",
    toString(withIndexes: ToStringOption = "names") {
        if (withIndexes === "names" && this.boundVarName) {
            return "˚" + this.boundVarName;
        } else if (withIndexes === "both" && this.boundVarName) {
            return "˚" + this.boundVarName + this.deBruijnIndex;
        } else {
            return "˚" + this.deBruijnIndex;
        }
    },
    getDeBruijnNumber: () => 0, // Always zero
    deBruijnIndex: NaN, //Placeholder
    eq: lambdaEqMethod,
};

export function boundVar(
    deBruijnIndex: number,
    boundVarName?: string
): BoundVariable {
    const bound = { ...boundVarTemplate, deBruijnIndex };
    if (boundVarName) {
        bound.boundVarName = boundVarName;
    }
    return bound;
}

//****Composite LambdaTerm Expressions - Application and Abstraction***

export type Application = Readonly<{
    role: "Application";
    func: LambdaExpression;
    argument: LambdaExpression;
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
    getDeBruijnNumber() {
        return Math.max(
            this.func.getDeBruijnNumber(),
            this.argument.getDeBruijnNumber()
        );
    },
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

const freeVarSubstitution = (
    body: LambdaTerm,
    variable: FreeVariable,
    deBruijnIndex: number
) => {
    //Any time a new lambda is introduced we increment the De Bruign Number by 1 and use this as the index for the lambda's bound variable.
    const bound = boundVar(deBruijnIndex, variable.name);

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
    body: LambdaExpression;
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
    getDeBruijnNumber() {
        return this.body.getDeBruijnNumber() + 1;
    },
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
    prevTerm: LambdaTerm,
    ...vars: FreeVariable[]
): Abstraction => {
    //This is the DeBruijn number of the new lambda abstraction, which is also, the DeBruijn index of it's bound variable instances. This number creates the binding link between the lambda abstraction and it's variables.

    const abstractOnce = (prevTerm: LambdaTerm, variable: FreeVariable) => {
        const abs = {
            ...abstractionTemplate,
            freeVarAbstractedOver: variable,
            body: prevTerm, //Set it to this temporarily.
        };
        //Bind the method so it can be passed to bound variables
        abs.getDeBruijnNumber = abs.getDeBruijnNumber.bind(abs);
        abs.body = freeVarSubstitution(
            prevTerm,
            variable,
            abs.getDeBruijnNumber()
        );
        return abs;
    };

    return vars.reduce(abstractOnce, prevTerm) as Abstraction;
};

type AbsBoundVars = {
    [deBruijnIndex in number]: BoundVariable[];
};



//Takes a bound variable and and expression to substitude for the bound variable. Then it recursively descends through the tree and returns a lambda term that is the result of the substitution with De Bruijn Indexes updated.
const boundVarSubstitution = (bound: BoundVariable, expToSub: LambdaExpression) =>
    function inner(
        exp: LambdaExpression,
        toUpdate: AbsBoundVars
    ): LambdaExpression {
        if (exp.eq(bound)) {
            return expToSub;
        }

        if (exp.role === "Bound Variable") {
            // A different bound variable
            const newBound: typeof exp = cloneDeep(exp)(
                //Note, we clone here since we'll be mutating within the function when we update the indexes.
                (toUpdate[exp.deBruijnIndex] ?? [].push(newBound)

                return newBound
            ).push(newBound);
            return
        } else if (exp.role === "Free Variable") {
            return exp
        }
        else if (exp.role === "Application") {
            return apply(
                inner(exp.func, toUpdate),
                inner(exp.argument, toUpdate)
            );
        } else if (exp.role === "Abstraction") {
            const subbed = inner(exp.body, toUpdate);
            const newDeBruijnIndex = subbed.getDeBruijnNumber();
            toUpdate[exp.getDeBruijnNumber()]!.forEach(
                (bound) => (bound.deBruijnIndex = newDeBruijnIndex)
            );
        }



            return exp


    };

const beta1 = (redex: LambdaExpression) => {};
