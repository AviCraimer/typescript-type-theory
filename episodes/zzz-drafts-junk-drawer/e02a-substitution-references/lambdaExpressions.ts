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
    // freeVars: FreeVars;
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

type FreeVariable = Variable & { binder?: never };
type BoundVariable = Variable & { binder: Abstraction } & WithParent;

const isFreeVar = (exp: LambdaExpression): exp is FreeVariable =>
    exp.syntax === "Variable" && !("binder" in exp);

// type FreeVars = {
//     [name in string]: Variable[];
// };

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
} & CommonLambdaProps &
    ParentAware;

const emptyArray: never[] = [];
// const emptyObject: Variable["freeVars"] = {};
//Lambda Term Introduction Functions

//Introduce a Free Variable Lambda Term

export function Var(name: string): Variable & LambdaTerm {
    const v: FreeVariable & LambdaTerm = {
        syntax: "Variable",
        name,
        children: emptyArray,
        // freeVars: {},
        parent: undefined,
    };

    // const freeVars: FreeVars = {
    //     [v.name]: [v],
    // };

    // v.freeVars = freeVars;
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
        // freeVars: {},
        parent,
        binder,
    };
}

// //Helper function for combining free variable objects
// const combineFreeVars = (fv1: FreeVars, fv2: FreeVars): FreeVars => {
//     const combined: FreeVars = {};

//     const varNames = [...new Set([...Object.keys(fv1), ...Object.keys(fv2)])];

//     varNames.forEach((name) => {
//         const vars1 = fv1[name] ?? [];
//         const vars2 = fv2[name] ?? [];
//         const vars = [...new Set([...vars1, ...vars2])];
//         combined[name] = vars;
//     });
//     return combined;
// };

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
        // freeVars: combineFreeVars(funcExp.freeVars, argExp.freeVars),
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

//Return halt to halt the recursion branch.
type LambdaOperation<T> = (exp: LambdaExpression, results: T[]) => void;

export const recursiveTraversal =
    <T>(callback: LambdaOperation<T>, prePost: "pre" | "post" = "pre") =>
    (exp: LambdaExpression): T[] => {
        //Results array can be used or ignored
        const results: T[] = [];

        const inner = (exp: LambdaExpression) => {
            if (prePost === "pre") {
                //Apply callback before recursively descending. This means parent before child
                callback(exp, results);
            }

            exp.children.forEach(inner);

            if (prePost === "post") {
                // Apply callback after recursively descending, this means the leaves (variables) are first.
                callback(exp, results);
            }
        };

        inner(exp);
        return results;
    };

const isComposite = (exp: LambdaExpression): exp is Application | Abstraction =>
    ["Application", "Abstraction"].includes(exp.syntax);

const addFreeVar: (varName: string) => LambdaOperation<FreeVariable> =
    (varName) => (exp, results) => {
        if (isFreeVar(exp) && varName === exp.name) {
            results.push(exp);
        }
    };

//Returns free variables instances for a given lambda expression
export const getFreeVarInstances = (varName: string) =>
    recursiveTraversal(addFreeVar(varName));

const addBoundVar: (binder: Abstraction) => LambdaOperation<BoundVariable> =
    (binder) => (exp, results) => {
        if (isBoundVar(exp) && exp.binder === binder) {
            results.push(exp);
        }
    };

export const getBoundVariableInstances = (binder: Abstraction) =>
    recursiveTraversal(addBoundVar(binder));

export const abstract = (
    abstractOver: LambdaTerm,
    ...vars: string[]
): Abstraction & LambdaTerm => {
    const [variableName, ...rest] = vars;

    const body: LambdaExpression & ParentAware = cloneDeep(abstractOver);

    //We substitute by variable name, note that only free variables are considered.
    const toSubstitute = getFreeVarInstances(variableName)(body);
    //Remove the free variables being abstracted over.
    // delete body.freeVars[variableName];

    const abs: Abstraction & LambdaTerm = {
        syntax: "Abstraction",
        parent: undefined,
        boundVariableName: variableName, //Needed for printing to string in case there are no instances of hte bound variable in the body of the abstraction.
        boundVarInstances: [],
        children: [body],
        // freeVars: body.freeVars,
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

    //TODO:
    //I need to find all bound variable instances that are not bound by binders inside the argument,
    //Idea, if I use a closure with a function to get the binder rather than a property, then the binder is preserved when I copy the bound variables.

    //For each bound variable instance, we add the argument copy to its parent
    const argCopies = absCopy.boundVarInstances.map((bVar) => {
        const argCopy = cloneDeep(argument);

        argCopy.parent = bVar.parent; //Preserve reference
        bVar.parent.parentExp.children[bVar.parent.childIndex] = argCopy;
        if (isBoundVar(argCopy)) {
            //Preserve link to binder, if the argument is a bound variable
            argCopy.binder = (argument as BoundVariable).binder;
        }
        return argCopy;
    });

    // absCopy.boundVarInstances.forEach((bVar) => {
    // const argCopy = cloneDeep(argument);

    // argCopy.parent = bVar.parent; //Preserve reference
    // bVar.parent.parentExp.children[bVar.parent.childIndex] = argCopy;
    // argCopies.push(argCopy);
    // });

    //We take the body of the abstraction after substitution as our new expression.
    const newExpression = absCopy.children[0];

    //If a bound variable is substituted into another expression, as can happen with a redex reduced inside the scope of an outer abstraction, then the outer binding lambda needs to have its boundVariableInstances updated.
    if (isBoundVar(argument)) {
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

    ///I just realized, what if the argument is not a bound variable, but it has children that are bound variables. Then this won't work. I need to rethink this. Man it is tricky!

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
