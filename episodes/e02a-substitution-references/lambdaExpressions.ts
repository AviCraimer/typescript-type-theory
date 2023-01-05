import { cloneDeep } from "lodash";

//A Lambda term is a complete stand-alone lambda expression
export type LambdaTerm = (Application | Abstraction | Variable) & {
    parent: undefined;
};

//A lambda expression may be a sub-expression of a larger term and it may contain variables bound by the larger term that it is a part of which prevents it from being self-standing.
export type LambdaExpression =
    | Application
    | Abstraction
    | Variable
    | BoundVariable;

type LambdaSyntaxTypes = "Application" | "Abstraction" | "Binder" | "Variable";

type CommonLambdaProps = {
    syntax: LambdaSyntaxTypes;
    freeVars: FreeVars;
    children: LambdaExpression[];
};

type ParentAware = {
    parent: { parentExp: LambdaExpression; childIndex: number } | undefined;
};
type WithParent = {
    parent: { parentExp: LambdaExpression; childIndex: number };
};

type Variable = {
    name: string;
    syntax: "Variable";
    children: never[];
} & CommonLambdaProps &
    ParentAware;

type BoundVariable = Variable & { binder: Abstraction } & WithParent;

type FreeVars = {
    [name in string]: Variable[];
};

export type Abstraction = {
    syntax: "Abstraction";
    boundVarInstances: BoundVariable[];
    boundVariableName: string;
    children: [body: LambdaExpression];
} & CommonLambdaProps &
    ParentAware;

export type Application = CommonLambdaProps & {
    syntax: "Application";
    children: [func: LambdaExpression, argument: LambdaExpression];
    freeVars: FreeVars;
} & CommonLambdaProps &
    ParentAware;

const emptyArray: never[] = [];
const emptyObject: Variable["freeVars"] = {};
//Lambda Term Introduction Functions

//Introduce a Free Variable Lambda Term

export function Var(name: string): Variable & LambdaTerm {
    const v: Variable & LambdaTerm = {
        syntax: "Variable",
        name,
        children: emptyArray,
        freeVars: {},
        parent: undefined,
    };

    const freeVars: FreeVars = {
        [v.name]: [v],
    };

    v.freeVars = freeVars;
    return v;
}

export function boundVar(
    name: string,
    binder: Abstraction,
    parent: WithParent["parent"]
): BoundVariable {
    return {
        syntax: "Variable",
        name,
        children: emptyArray,
        freeVars: {},
        parent,
        binder,
    };
}

//Helper function for combining free variable objects
const combineFreeVars = (fv1: FreeVars, fv2: FreeVars): FreeVars => {
    const combined: FreeVars = {};

    const varNames = [...new Set([...Object.keys(fv1), ...Object.keys(fv2)])];

    varNames.forEach((name) => {
        const vars1 = fv1[name] ?? [];
        const vars2 = fv2[name] ?? [];
        const vars = [...new Set([...vars1, ...vars2])];
        combined[name] = vars;
    });
    return combined;
};

function applyOnce(
    func: LambdaExpression,
    arg: LambdaExpression
): Application & LambdaTerm {
    //We copy the terms and change the type to expression, this will allow us to set the parent.
    const funcExp: LambdaExpression & ParentAware = cloneDeep(func);
    const argExp: LambdaExpression & ParentAware = cloneDeep(arg);

    const app: Application & LambdaTerm = {
        syntax: "Application",
        children: [funcExp, argExp],
        freeVars: combineFreeVars(funcExp.freeVars, argExp.freeVars),
        parent: undefined,
    };

    funcExp.parent = { parentExp: app, childIndex: 0 };
    argExp.parent = { parentExp: app, childIndex: 1 };

    return app;
}

export const apply = (
    func: LambdaTerm,
    ...args: LambdaTerm[]
): Application & LambdaTerm => {
    const [argument, ...rest] = args;

    const app = applyOnce(func, argument);

    if (rest.length === 0) {
        return app;
    } else {
        return apply(app, ...rest);
    }
};

export const abstract = (
    abstractOver: LambdaTerm,
    ...vars: string[]
): Abstraction & LambdaTerm => {
    const [variableName, ...rest] = vars;

    const body: LambdaExpression & ParentAware = cloneDeep(abstractOver);

    //We substitute by variable name, note that only free variables are considered.
    const toSubstitute = body.freeVars[variableName] ?? [];
    //Remove the free variables being abstracted over.
    delete body.freeVars[variableName];

    const abs: Abstraction & LambdaTerm = {
        syntax: "Abstraction",
        parent: undefined,
        boundVariableName: variableName, //Needed for printing to string in case there are no instances of hte bound variable in the body of the abstraction.
        boundVarInstances: [],
        children: [body],
        freeVars: body.freeVars,
    };

    //For each free variable with the given name, replace it with a bound variable.
    toSubstitute.forEach((freeVar) => {
        const parent: WithParent["parent"] = {
            parentExp: freeVar.parent ? freeVar.parent.parentExp : abs,
            childIndex: freeVar.parent ? freeVar.parent.childIndex : 0,
        };
        const bound = boundVar(variableName, abs, parent);

        parent.parentExp.children[parent.childIndex] = bound;
        abs.boundVarInstances.push(bound);
    });

    body.parent = { parentExp: abs, childIndex: 0 };

    if (rest.length === 0) {
        return abs;
    } else {
        return abstract(abs, ...rest);
    }
};

const toString = (exp: LambdaExpression): string => {
    switch (exp.syntax) {
        case "Abstraction":
            return `[λ˚${exp.boundVariableName}.${toString(exp.children[0])}]`;
        case "Application":
            return `${toString(exp.children[0])}(${toString(exp.children[1])})`;
        case "Variable":
            return "binder" in exp ? "˚" + exp.name : exp.name;
    }
};

export const print = (...toPrint: (string | LambdaExpression)[]) => {
    toPrint.forEach((x) => {
        if (typeof x === "string") {
            console.log(x);
        } else {
            console.log(toString(x));
        }
    });
};

const isBoundVar = (lambda: LambdaExpression): lambda is BoundVariable =>
    lambda.syntax === "Variable" && "binder" in lambda;

export type Reducible = Application & {
    children: [Abstraction, LambdaExpression];
};

//Substitute an argument into a lambda abstraction. This will mutate the larger expression if the redex has a parent so make sure to copy the lambda term before calling this function to avoid unwanted mutation.
export const reduceRedex = (redex: Reducible) => {
    const [abstraction, argument] = redex.children;

    const { parent } = redex;
    const absCopy = cloneDeep(abstraction);

    const argCopies: LambdaExpression[] = [];
    //For each bound variable instance, we add the argument copy to its parent
    absCopy.boundVarInstances.forEach((bVar) => {
        const argCopy = cloneDeep(argument);
        if ("binder" in argument && "binder" in argCopy) {
            argCopy.binder = argument.binder;
        }
        argCopy.parent = bVar.parent; //Preserve reference
        bVar.parent.parentExp.children[bVar.parent.childIndex] = argCopy;
        argCopies.push(argCopy);
    });

    //We take the body of the abstraction after substitution as our new expression.
    const newExpression = absCopy.children[0];

    //If a bound variable is substituted into another expression, it's binding lambda needs to have its boundVariableInstances updated.
    if (argument.syntax === "Variable" && "binder" in argument) {
        const { binder } = argument;
        const boundVarSet = new Set(binder.boundVarInstances);
        //We remove the bound variable that has been applied
        boundVarSet.delete(argument);

        console.log("argCopies", argCopies[0].parent?.parentExp.syntax);
        //We add any argument copies as these become new bound variables under the lambda
        binder.boundVarInstances = [
            ...boundVarSet,
            ...(argCopies as BoundVariable[]),
        ];
    }

    /*
    [λ˚f.[λ˚x.˚x](˚f)]
    argCopies Abstraction
    [λ˚f.˚f(˚f)]

    Mistake here, When f is substituted for x, it should not result in [λ˚f.˚f(˚f)] but [λ˚f.˚f]

    Because the parent of the expression [λ˚x.˚x] is the Application [λ˚x.˚x](˚f) which is supposed to be elimitated but instead it is just getting it's first child replaced with ˚f, while also keeping it's second child.
    */

    if (parent) {
        const { parentExp, childIndex } = parent;

        //Add the body of the abstraction (which has already been modified by the substitutions to the )
        parentExp.children[childIndex] = newExpression;
        //Parent reverse reference
        newExpression.parent = { parentExp, childIndex };
    } else {
        //No parent now that outer abstraction has been eliminated.
        newExpression.parent = undefined;
    }
    return newExpression;
};
