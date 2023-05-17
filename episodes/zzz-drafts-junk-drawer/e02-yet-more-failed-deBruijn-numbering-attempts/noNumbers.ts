//New as of May 15 2023

type LambdaSubExpr =
    | Abstraction
    | FreeVarSubExpr
    | BoundVarSubExpr
    | Substitution
    | Application;

type FreeVarSubExpr = string;
const boundVariableUnicodeSymbol = "˚" as const;
type BoundVarSubExpr = `${typeof boundVariableUnicodeSymbol}${string}`;

type Abstraction = {
    boundVar: BoundVarSubExpr;
    body: LambdaSubExpr;
};

type Application = {
    func: LambdaSubExpr;
    argument: LambdaSubExpr;
};

type Substitution = {
    boundVarToReplace: BoundVarSubExpr;
    replacement: LambdaSubExpr;
    lambdaToSubInto: LambdaSubExpr;
};

type LambdaExpression = FreeVarSubExpr | Application | Abstraction;

export const isBoundVar = (x: LambdaSubExpr): x is BoundVarSubExpr => {
    if (typeof x === "string" && x.startsWith(boundVariableUnicodeSymbol)) {
        return true;
    } else {
        return false;
    }
};

export const isFreeVar = (x: LambdaSubExpr): x is FreeVarSubExpr => {
    if (typeof x === "string" && !isBoundVar(x)) {
        return true;
    } else {
        return false;
    }
};

export const isAbs = (x: LambdaSubExpr): x is Abstraction => {
    if (typeof x === "object" && "boundVar" in x) {
        return true;
    } else {
        return false;
    }
};

export const isApp = (x: LambdaSubExpr): x is Application => {
    if (typeof x === "object" && "argument" in x) {
        return true;
    } else {
        return false;
    }
};

export const isSub = (x: LambdaSubExpr): x is Substitution => {
    if (typeof x === "object" && "variableToReplace" in x) {
        return true;
    } else {
        return false;
    }
};

export const boundVariableString = (name: string): BoundVarSubExpr => {
    return `${boundVariableUnicodeSymbol}${name}`;
};

//Used when creating abstractions to ensure that bound variables and free variables are a disjoint set. This solves the problem of requiring that lambda binder variables are fresh relative to the set of free variables of a replacement term being substituted. All bound variables are fresh since non overlap with free variables.
const subFreeWithBound = (lambda: LambdaSubExpr, freeVar: string) => {
    const boundVar = boundVariableString(freeVar);

    const inner = (lambda: LambdaSubExpr): LambdaSubExpr => {
        if (isFreeVar(lambda) && freeVar === lambda) {
            return boundVar;
        } else if (isAbs(lambda)) {
            return {
                boundVar,
                body: inner(lambda.body),
            };
        } else if (isApp(lambda)) {
            return {
                func: inner(lambda.func),
                argument: inner(lambda.argument),
            };
        } else if (isSub(lambda)) {
            return {
                ...lambda,
                lambdaToSubInto: inner(lambda.lambdaToSubInto),
            };
        } else {
            //For bound variables just return
            return lambda;
        }
    };

    return inner(lambda);
};

export const abstraction = (
    name: FreeVarSubExpr,
    lambda: LambdaExpression // You can't abstract over a lone bound variable
): Abstraction => {
    //Substitute if the named free variable is in the lambda
    const body = subFreeWithBound(lambda, name);

    return {
        boundVar: boundVariableString(name),
        body,
    };
};

const union = <T, S>(set1: Set<T>, set2: Set<S>) => new Set([...set1, ...set2]);

export const application = (
    first: LambdaSubExpr,
    second: LambdaSubExpr
): Application => {
    return {
        func: first,
        argument: second,
    };
};

type LambdaMethods<L, A extends unknown[]> = {
    boundVar: (
        x: BoundVarSubExpr,
        inner: (lambda: LambdaSubExpr) => L,
        ...args: A
    ) => L;
    freeVar: (
        x: FreeVarSubExpr,
        inner: (lambda: LambdaSubExpr) => L,
        ...args: A
    ) => L;
    application: (
        x: Application,
        inner: (lambda: LambdaSubExpr) => L,
        ...args: A
    ) => L;
    abstraction: (
        x: Abstraction,
        inner: (lambda: LambdaSubExpr) => L,
        ...args: A
    ) => L;
    substitution: (
        x: Substitution,
        inner: (lambda: LambdaSubExpr) => L,
        ...args: A
    ) => L;
};

//<I extends LambdaSubExpr, R extends LambdaSubExpr>
const mkLambdaFn =
    <L extends LambdaSubExpr, A extends unknown[]>(fns: LambdaMethods<L, A>) =>
    (lambda: LambdaSubExpr, ...args: A) => {
        const inner = (lambda: LambdaSubExpr): L => {
            if (isBoundVar(lambda)) {
                return fns.boundVar(lambda, inner, ...args);
            } else if (isFreeVar(lambda)) {
                return fns.freeVar(lambda, inner, ...args);
            } else if (isApp(lambda)) {
                return fns.application(lambda, inner, ...args);
            } else if (isAbs(lambda)) {
                return fns.abstraction(lambda, inner, ...args);
            } else if (isSub(lambda)) {
                return fns.substitution(lambda, inner, ...args);
            }
            let x: never = lambda;
            return lambda;
        };

        return inner(lambda);
    };

const subBoundMethods: LambdaMethods<
    LambdaSubExpr,
    [boundVarToReplace: BoundVarSubExpr, replacement: LambdaSubExpr]
> = {
    boundVar: (lambda, _, boundVarToReplace, replacement) => {
        if (lambda === boundVarToReplace) {
            return replacement;
        } else {
            return lambda;
        }
    },
    freeVar: (lambda) => {
        return lambda;
    },
    application: (lambda, inner) => {
        return application(inner(lambda.argument), inner(lambda.func));
    },
    abstraction: (lambda, inner, boundVarToReplace) => {
        if (lambda.boundVar === boundVarToReplace) {
            //We don't substitute into inner lambdas with the same bound variable name, since the variables are always bound to the nearest lambda with the same name. This is called 'variable shadowing' in programming.
            return lambda;
        } else {
            return {
                ...lambda,
                body: inner(lambda),
            };
        }
    },
    substitution: (lambda) => {
        //Not sure what are the algebraic laws of substituting into a substitution

        //TODO to do TBD
        return lambda;
    },
};

export const subForBound = mkLambdaFn(subBoundMethods);

type Redex = Application & {
    func: Abstraction;
};

//A beta reducible lambda expression is called a redex
const isRedex = (lambda: LambdaSubExpr): lambda is Redex => {
    return isApp(lambda) && isAbs(lambda.func);
};

const betaStepMethods: LambdaMethods<LambdaSubExpr, []> = {
    boundVar: (lambda) => {
        return lambda;
    },
    freeVar: (lambda) => {
        return lambda;
    },
    application: (lambda, inner) => {
        if (isRedex(lambda)) {
            const abs = lambda.func;

            return subForBound(abs.body, abs.boundVar, lambda.argument);
        } else {
            return application;
        }
    },
    abstraction: (lambda, inner) => {
        return {
            ...lambda,
            body: inner(lambda),
        };
    },
    substitution: (lambda) => {
        //Not sure what are the algebraic laws of substituting into a substitution

        //TODO to do TBD
        return lambda;
    },
};

export const betaStep = mkLambdaFn(betaStepMethods); //Need to test it!!

export const betaReduce = (
    lambda: LambdaSubExpr,
    maxSteps = 10,
    log = true
) => {
    let count = 0;
    let prev: LambdaSubExpr = lambda;

    while (count < maxSteps) {
        const current = betaStep(lambda);

        printExpr(prev);

        if (lambdaToString(current) === lambdaToString(prev)) {
            return current;
        }
        prev = current;
        count++;
    }

    console.log("max steps reached in beta reduce");
};

export const lambdaToString = (lambda: LambdaSubExpr): string => {
    if (typeof lambda === "string") {
        return lambda;
    } else if (isApp(lambda)) {
        return `(${lambdaToString(lambda.func)})(${lambdaToString(
            lambda.argument
        )})`;
    } else if (isAbs(lambda)) {
        const bodyStr = lambdaToString(lambda.body);

        return `λ(${lambda.boundVar}).[${bodyStr}]`;
    } else if (isSub(lambda)) {
        const { boundVarToReplace, replacement, lambdaToSubInto } = lambda;

        return `(${lambdaToString(
            lambdaToSubInto
        )}[${replacement} for ${boundVarToReplace}])`;
    }

    let x: never = lambda;
    return x;
};

export const printExpr = (lambdaExp: LambdaSubExpr) => {
    console.log("\n");
    console.log(lambdaToString(lambdaExp));
};

//Turning each expression into strings without using bound variable names (only numbers) then comparing.
// export const alphaEq = (expr1: LambdaExpression, expr2: LambdaExpression) => {
//     return lambdaToString(expr1, false) === lambdaToString(expr2, fa);
// };

//For episode 03
//source: https://sookocheff.com/post/fp/evaluating-lambda-expressions/

// export const boundVarSubstitution = (
//     abs: AbsExpr,
//     argument: LambdaSubExpr
// ): LambdaSubExpr => {
//     const { lambda } = abs;
//     const { binderNumber, body } = lambda;

//     // Naively without any re-numbering
//     const inner = (current: LambdaSubExpr): LambdaSubExpr => {
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
