//New as of May 17 2023

type LambdaExpr = Abstraction | Variable | Application;

type LambdaChild<L extends LambdaExpr = LambdaExpr> = {
    childFreeVars: Variable[]; //Used to check if a variable is fresh for a replacement
    childExpr: L;
};

type BaseLambda<M extends {}> = {
    children: LambdaChild[];
    meta: M; // Pass in metalanguage info which can be used to add types, etc.
};

type Variable<M extends { syntax: "variable" } = { syntax: "variable" }> =
    BaseLambda<M> & {
        name: string;
        children: never[];
    };

type Abstraction<
    M extends { syntax: "abstraction" } = { syntax: "abstraction" }
> = BaseLambda<M> & {
    boundVar: Variable;
    children: [body: LambdaChild];
};

type Application<
    M extends { syntax: "application" } = { syntax: "application" }
> = BaseLambda<M> & {
    children: [func: LambdaChild, argument: LambdaChild];
};

export const isVar = (x: LambdaExpr): x is Variable => {
    if (x.meta.syntax === "variable") {
        return true;
    } else {
        return false;
    }
};

export const isAbs = (x: LambdaExpr): x is Abstraction => {
    if (x.meta.syntax === "abstraction") {
        return true;
    } else {
        return false;
    }
};

export const isApp = (x: LambdaExpr): x is Application => {
    if (x.meta.syntax === "application") {
        return true;
    } else {
        return false;
    }
};

let regexEndsWithVarNumber = /_\d+$/;

//Constructs a free variable
//By default it cannot end with an underscore followed by numbers.
export const Var = (name: string, numberingAllowed = false): Variable => {
    if (
        !numberingAllowed &&
        regexEndsWithVarNumber.test(name) &&
        name.endsWith("_")
    ) {
        throw Error(
            `You tried to create a new variable with a disallowed name: ${name}`
        );
    }

    return {
        meta: { syntax: "variable" },
        name,
        children: [],
    };
};

const deduplicateVariables = (vars: Variable[]) => {
    const obj: { [x in string]: Variable } = {};
    vars.forEach((v) => (obj[v.name] = v));
    return Object.values(obj);
};

export const excludeVariables = (
    varList: Variable[],
    varsToRemove: Variable[]
) => {
    const toRemoveNames: Set<string> = new Set();
    varsToRemove.forEach((v) => toRemoveNames.add(v.name));
    return varList.filter((v) => !toRemoveNames.has(v.name));
};

const getChildFreeVars = (child: LambdaExpr) => {
    if (isVar(child)) {
        return [child];
    } else if (isAbs(child)) {
        const { boundVar } = child;

        //All variables free in the body of the abstraction are free in the abstraction except the bound variable
        return excludeVariables(child.children[0].childFreeVars, [boundVar]);
    } else if (isApp(child)) {
        const funcVars = child.children[0].childFreeVars;
        const argVars = child.children[1].childFreeVars;
        return deduplicateVariables([...funcVars, ...argVars]);
    }
    let x: never = child;
    return child;
};

export const getBoundVars = (child: LambdaExpr): Variable[] => {
    if (isVar(child)) {
        return [];
    } else if (isAbs(child)) {
        const { boundVar } = child;

        return deduplicateVariables([
            boundVar,
            ...getBoundVars(child.children[0].childExpr),
        ]);
    } else if (isApp(child)) {
        const [func, arg] = appBranches(child);

        const funcVars = getBoundVars(func);
        const argVars = getBoundVars(arg);

        return deduplicateVariables([...funcVars, ...argVars]);
    }
    let x: never = child;
    return child;
};

export const abstraction = (
    variable: Variable,
    lambda: LambdaExpr
): Abstraction => {
    return {
        meta: { syntax: "abstraction" },
        boundVar: variable,
        children: [
            {
                childExpr: lambda,
                childFreeVars: getChildFreeVars(lambda),
            },
        ],
    };
};

export const application = (
    first: LambdaExpr,
    second: LambdaExpr
): Application => {
    return {
        meta: { syntax: "application" },
        children: [
            {
                childExpr: first,
                childFreeVars: getChildFreeVars(first),
            },
            {
                childExpr: second,
                childFreeVars: getChildFreeVars(second),
            },
        ],
    };
};

type LambdaMethods<Return, Args extends unknown[]> = {
    variable: (
        x: Variable,
        inner: (lambda: LambdaExpr, ...args: Args) => Return,
        ...args: Args
    ) => Return;
    application: (
        x: Application,
        inner: (lambda: LambdaExpr, ...args: Args) => Return,
        ...args: Args
    ) => Return;
    abstraction: (
        x: Abstraction,
        inner: (lambda: LambdaExpr, ...args: Args) => Return,
        ...args: Args
    ) => Return;
};

//<I extends LambdaExpr, R extends LambdaExpr>
const mkLambdaFn =
    <Return, Args extends unknown[]>(fns: LambdaMethods<Return, Args>) =>
    (lambda: LambdaExpr, ...args: Args) => {
        const inner = (lambda: LambdaExpr, ...innerArgs: Args | []): Return => {
            const extraArgs = (innerArgs.length ? innerArgs : args) as Args;

            if (isVar(lambda)) {
                return fns.variable(lambda, inner, ...extraArgs);
            } else if (isApp(lambda)) {
                return fns.application(lambda, inner, ...extraArgs);
            } else if (isAbs(lambda)) {
                return fns.abstraction(lambda, inner, ...extraArgs);
            }
            let x: never = lambda;
            return lambda;
        };

        return inner(lambda);
    };

export const lambdaToStringMethods: LambdaMethods<string, []> = {
    variable: (variable) => {
        return variable.name;
    },
    abstraction: (abs, inner) => {
        const body = abs.children[0].childExpr;
        const bodyStr = inner(body);

        return `λ(${inner(abs.boundVar)}).[${bodyStr}]`;
    },
    application: (app, inner) => {
        return `(${inner(app.children[0].childExpr)})(${inner(
            app.children[1].childExpr
        )})`;
    },
};

export const lambdaToString = mkLambdaFn(lambdaToStringMethods);

export const printExpr = (lambdaExp: LambdaExpr) => {
    // console.log("\n");
    console.log(lambdaToString(lambdaExp));
};

export const childFVToString = (childExpr: LambdaChild) => {
    return childExpr.childFreeVars.map((v) => lambdaToString(v)).join(", ");
};

export const childFVsToString = (lambda: LambdaExpr) => {
    return lambda.children
        .map(
            (c, i) => (i > 0 ? "\n" : "") + `child ${i}: ` + childFVToString(c)
        )
        .join("");
};

export const printChildFV = (lambda: LambdaExpr) => {
    console.log("\n");
    console.log(childFVsToString(lambda));
};

export const appBranches = (
    app: Application
): [func: LambdaExpr, arg: LambdaExpr] => {
    return [app.children[0].childExpr, app.children[1].childExpr];
};

//Later I'll make a lambdaEq function that uses alpha equality but for now, we'll stick to variable equality since it is simple
export const varEq = (x: Variable, y: Variable) => {
    return x.name === y.name;
};

export const varIn = (x: Variable, vars: Variable[]) => {
    const varNames = new Set(vars.map((v) => v.name));
    return varNames.has(x.name);
};

//e.g.,    [a, a_1, a_2]
export const filterVarsByName = (vars: Variable[], name: string) => {
    name = name.replace(regexEndsWithVarNumber, "");

    let toKeep: Set<Variable> = new Set();

    vars.forEach(
        (x) =>
            //string either is name or it starts with name and ends with variable number pattern.
            (x.name === name ||
                (x.name.startsWith(name) &&
                    regexEndsWithVarNumber.test(x.name))) &&
            toKeep.add(x.name === name ? Var(`${name}_0`, true) : x)
    );

    return [...toKeep];
};

export const getFreshVar = (vars: Variable[], name: string) => {
    name = name.replace(regexEndsWithVarNumber, "");
    const current = filterVarsByName(vars, name);

    const currentNumbers = current
        .map((x) => Number(x.name.slice(x.name.lastIndexOf("_") + 1)))
        .sort();

    let firstGap: number;
    let prevNum: number = 0;
    for (let index = 0; index < currentNumbers.length; index++) {
        const num = currentNumbers[index];

        if (num - prevNum > 1) {
            firstGap = prevNum + 1;
            break;
        }
        prevNum = num;
    }
    firstGap = firstGap! ?? prevNum + 1;

    return Var(name + "_" + firstGap, true);
};

export const substitutionMethods: LambdaMethods<
    LambdaExpr,
    [replacementExpr: LambdaExpr, varToReplace: Variable]
> = {
    variable: (variable, _, replacementExpr, varToReplace) => {
        return varEq(variable, varToReplace) ? replacementExpr : variable;
    },
    abstraction: (abs, inner, replacementExpr, varToReplace) => {
        const { boundVar } = abs;

        let replacementChildFreeVars = replacementExpr.children
            .map((c) => c.childFreeVars)
            .reduce((a, b) => [...a, ...b], []);

        const body = abs.children[0].childExpr;

        let freshBody: LambdaExpr = body;

        let freshVar: Variable = abs.boundVar;
        if (varEq(boundVar, varToReplace)) {
            //The bound variable of the abstraction shadows the variable to replace so we do no substitution
            return abs;
        } else if (
            ///Does not meet freshness condition
            varIn(boundVar, replacementChildFreeVars)
        ) {
            //The fresh var should be distinct from the bound variables in replacement. It's okay if it is the same as an inner bound variale since it will just be shadowed as normal.
            freshVar = getFreshVar(replacementChildFreeVars, boundVar.name);

            //This has to be done on the body because it will be skipped in substitution if it is done on the abstraction with that bound var
            freshBody = inner(body, freshVar, boundVar);
        }

        const replacedBody = inner(freshBody, replacementExpr, varToReplace);

        return abstraction(freshVar, replacedBody);
        //Do I have to deal with updating the lists of free variables!
        //Maybe no since they'll get build up through replacement
    },
    application: (app, inner, replacementExpr, varToReplace) => {
        const [func, arg] = appBranches(app);
        return application(
            inner(func, replacementExpr, varToReplace),
            inner(arg, replacementExpr, varToReplace)
        );
    },
};

export const substitute = mkLambdaFn(substitutionMethods);

// const subBoundMethods: LambdaMethods<
//     LambdaExpr,
//     [boundVarToReplace: BoundVarSubExpr, replacement: LambdaExpr]
// > = {
//     boundVar: (lambda, _, boundVarToReplace, replacement) => {
//         if (lambda === boundVarToReplace) {
//             return replacement;
//         } else {
//             return lambda;
//         }
//     },
//     freeVar: (lambda) => {
//         return lambda;
//     },
//     application: (lambda, inner) => {
//         return application(inner(lambda.argument), inner(lambda.func));
//     },
//     abstraction: (lambda, inner, boundVarToReplace) => {
//         if (lambda.boundVar === boundVarToReplace) {
//             //We don't substitute into inner lambdas with the same bound variable name, since the variables are always bound to the nearest lambda with the same name. This is called 'variable shadowing' in programming.
//             return lambda;
//         } else {
//             return {
//                 ...lambda,
//                 body: inner(lambda),
//             };
//         }
//     },
//     substitution: (lambda) => {
//         //Not sure what are the algebraic laws of substituting into a substitution

//         //TODO to do TBD
//         return lambda;
//     },
// };

// export const subForBound = mkLambdaFn(subBoundMethods);

type Redex = Application & {
    children: [LambdaChild<Abstraction>, LambdaChild];
};

//A beta reducible lambda expression is called a redex
// const isRedex = (lambda: LambdaExpr): lambda is Redex => {
//     return isApp(lambda) && isAbs(lambda.func);
// };

// const betaStepMethods: LambdaMethods<LambdaExpr, []> = {
//     boundVar: (lambda) => {
//         return lambda;
//     },
//     freeVar: (lambda) => {
//         return lambda;
//     },
//     application: (lambda, inner) => {
//         if (isRedex(lambda)) {
//             const abs = lambda.func;

//             return subForBound(abs.body, abs.boundVar, lambda.argument);
//         } else {
//             return application;
//         }
//     },
//     abstraction: (lambda, inner) => {
//         return {
//             ...lambda,
//             body: inner(lambda),
//         };
//     },
//     substitution: (lambda) => {
//         //Not sure what are the algebraic laws of substituting into a substitution

//         //TODO to do TBD
//         return lambda;
//     },
// };

// export const betaStep = mkLambdaFn(betaStepMethods); //Need to test it!!

// export const betaReduce = (lambda: LambdaExpr, maxSteps = 10, log = true) => {
//     let count = 0;
//     let prev: LambdaExpr = lambda;

//     while (count < maxSteps) {
//         const current = betaStep(lambda);

//         printExpr(prev);

//         if (lambdaToString(current) === lambdaToString(prev)) {
//             return current;
//         }
//         prev = current;
//         count++;
//     }

//     console.log("max steps reached in beta reduce");
// };

//Turning each expression into strings without using bound variable names (only numbers) then comparing.
// export const alphaEq = (expr1: LambdaExpression, expr2: LambdaExpression) => {
//     return lambdaToString(expr1, false) === lambdaToString(expr2, fa);
// };

//For episode 03
//source: https://sookocheff.com/post/fp/evaluating-lambda-expressions/

// export const boundVarSubstitution = (
//     abs: AbsExpr,
//     argument: LambdaExpr
// ): LambdaExpr => {
//     const { lambda } = abs;
//     const { binderNumber, body } = lambda;

//     // Naively without any re-numbering
//     const inner = (current: LambdaExpr): LambdaExpr => {
//         if (typeof current === "string") {
//             return current;
//         } else if (typeof current === "number") {
//             return current === binderNumber ? argument : current;
//         } else if ("func" in current) {
//             return {
//                 func: inner(current.func),
//                 argument: inner(current.argument),
//             };
//         } else if ("binderNumber" in current) {
//             return {
//                 ...current,
//                 body: inner(current.body),
//             };
//         }
//         let x: never = current;
//         return x;
//     };
//     return inner(body);
// };

//Iterative evaluation by substitution
//Normal Order, evaluates functions from left to right and from outer most to inner most.
//Think of it as evaluating functions first, before evaluating the arguments to a function

//Note: My numbering system is different from de Bruijn numbering. That uses the distance from the binding lambda to the bound variables so that different instances of the same  bound variables in an expression are represented with different numbes. A way to think of this is that each bound variable token is like a map telling you how to find it's binder from where it is in the expression. The binder itself does not have any number associated with it.
