//New as of May 14 2023

// [λ˚y.[λ˚x.˚x(˚y)](g(˚y))]
//   [2.[  1.(1( 2)](3 (2))]
//   [2.[ ((3 (2))( 2)]]   sub
//   [1.[ ((2 (1))( 1)]]   renumber

type LambdaSubExpr =
    | Abstraction
    | FreeVarSubExpr
    | BoundVarSubExpr
    | Application;

type FreeVarSubExpr = string;
type BoundVarSubExpr = number;

type Abstraction = {
    binderNumber: number;
    boundVarName: string; // This is just for printing, not used for display or equality comparison
    body: LambdaSubExpr;
};

type Application = {
    func: LambdaSubExpr;
    argument: LambdaSubExpr;
};

// Free variables have unique names, and are indexed by names
// Bound vars may repeat names and may repeat free variables names.
type FreeVariables = Set<FreeVarSubExpr>;

type LambdaExpression = {
    freeVars: FreeVariables;
    depth: number; // The highest number of bound variable or equivlently the number of lambda abstractions

    //You can't have a bound variable as the top level expression it must occur as a sub-expression of a sub-expression.
    lambda: Exclude<LambdaSubExpr, BoundVarSubExpr>;
};

type AbsExpr = LambdaExpression & { lambda: Abstraction };
type AppExpr = LambdaExpression & { lambda: Application };
type VarExpr = LambdaExpression & { lambda: FreeVarSubExpr };

export const freeVariable = (name: string): VarExpr => {
    return {
        freeVars: new Set([name]),
        lambda: name,
        depth: 0,
    };
};

//Only deals with the partial lambda terms (sub-expressions)
// depth provided is the depth of the lambda expression being substituted into, so the new bound variable is one greater
const subFreeWithBound = (
    lambda: LambdaSubExpr,
    freeVarToken: string,
    depth: number
) => {
    const boundToken: BoundVarSubExpr = depth + 1;

    const inner = (lambda: LambdaSubExpr): LambdaSubExpr => {
        if (typeof lambda === "string" && freeVarToken === lambda) {
            return boundToken;
        } else if (typeof lambda === "object" && "binderNumber" in lambda) {
            const { binderNumber } = lambda;
            return {
                binderNumber,
                boundVarName: freeVarToken,
                body: inner(lambda.body),
            };
        } else if (typeof lambda === "object" && "func" in lambda) {
            return {
                func: inner(lambda.func),
                argument: inner(lambda.argument),
            };
        }
        //For bound variables just return
        return lambda;
    };

    return inner(lambda);
};

export const abstraction = (name: string, expr: LambdaExpression): AbsExpr => {
    const { lambda, freeVars } = expr;

    const shouldSub = freeVars.has(name);

    //Substitute if the named free variable is in the lambda
    const body = shouldSub
        ? subFreeWithBound(lambda, name, expr.depth)
        : lambda;

    const binderNumber = expr.depth + 1;
    const abs: Abstraction = {
        binderNumber,
        boundVarName: name,
        body,
    };

    const newFreeVars = new Set(freeVars);
    newFreeVars.delete(name);

    return {
        freeVars: newFreeVars,
        depth: binderNumber,
        lambda: abs,
    };
};

const union = <T, S>(set1: Set<T>, set2: Set<S>) => new Set([...set1, ...set2]);

export const application = (
    first: LambdaExpression,
    second: LambdaExpression
): AppExpr => {
    const newFreeVars = union(first.freeVars, second.freeVars);

    console.log("new free vars", newFreeVars);

    const app: Application = {
        func: first.lambda,
        argument: second.lambda,
    };

    return {
        //I think I use the depth of the first argument since any abstraction over an application would number based on the highest binder in the function.
        depth: first.depth,
        lambda: app,
        freeVars: newFreeVars,
    };
};

// const isFullExpr = (thing: LambdaExpression | LambdaSubExpr): thing is LambdaExpression => typeof thing === 'object' &&  "freeVars" in thing

// const printLambda = (thing: LambdaExpression | LambdaSubExpr) =>  {

//     if (isFullExpr(thing)) {

//     }

//     if (typeof thing === "string" || )
//         if ("freeVars" in thing) {
//             return printLambda(thing.lambda);
//         } else if ("binderNumber" in thing) {
//         }

// }

const boundVariableUnicodeSymbol = "˚" as const;

const boundVariableString = (number: number, name?: string) => {
    if (name) {
        return `${boundVariableUnicodeSymbol + name}_${number}`;
    } else {
        return boundVariableUnicodeSymbol + number;
    }
};

export const subExprToString = (
    lambda: LambdaSubExpr,
    useBoundVarNames = true,
    currentBoundVar: { [x in BoundVarSubExpr]: FreeVarSubExpr } = {}
): string => {
    if (typeof lambda === "string") {
        return lambda;
    } else if (typeof lambda === "number") {
        const name = currentBoundVar[lambda];

        if (!name) {
            throw Error(
                "no name printing bound variable. This is a bug in the subExptTOString function"
            );
        }
        return boundVariableString(lambda, useBoundVarNames ? name : undefined);
    } else if ("func" in lambda) {
        return `(${subExprToString(
            lambda.func,
            useBoundVarNames,
            currentBoundVar
        )})(${subExprToString(
            lambda.argument,
            useBoundVarNames,
            currentBoundVar
        )})`;
    } else if ("binderNumber" in lambda) {
        const newBoundVar = {
            ...currentBoundVar,
            [lambda.binderNumber]: lambda.boundVarName,
        };
        const bodyStr = subExprToString(
            lambda.body,
            useBoundVarNames,
            newBoundVar
        );

        return `λ(${boundVariableString(
            lambda.binderNumber,
            useBoundVarNames ? lambda.boundVarName : undefined
        )}).[${bodyStr}]`;
    }

    let x = lambda;
    return x;
};

export const exprToString = (
    lambdaExp: LambdaExpression,
    useBoundVarNames = true
) => {
    const { lambda } = lambdaExp;

    return subExprToString(lambda, useBoundVarNames);
};

export const printExpr = (
    lambdaExp: LambdaExpression,
    useBoundVarNames = true
) => {
    console.log("\n");
    console.log(exprToString(lambdaExp, useBoundVarNames));
};

//Turning each expression into strings without using bound variable names (only numbers) then comparing.
export const alphaEq = (expr1: LambdaExpression, expr2: LambdaExpression) => {
    return exprToString(expr1, false) === exprToString(expr2, false);
};

//For episode 03
//source: https://sookocheff.com/post/fp/evaluating-lambda-expressions/

export const boundVarSubstitution = (
    abs: AbsExpr,
    argument: LambdaSubExpr
): LambdaSubExpr => {
    const { lambda } = abs;
    const { binderNumber, body } = lambda;

    // Naively without any re-numbering
    const inner = (current: LambdaSubExpr): LambdaSubExpr => {
        if (typeof current === "string") {
            return current;
        } else if (typeof current === "number") {
            return current === binderNumber ? argument : current;
        } else if ("func" in current) {
            return {
                func: inner(current.func),
                argument: inner(current.argument),
            };
        } else if ("binderNumber" in current) {
            return {
                ...current,
                body: inner(current.body),
            };
        }
        let x: never = current;
        return x;
    };
    return inner(body);
};

//Iterative evaluation by substitution
//Normal Order, evaluates functions from left to right and from outer most to inner most.
//Think of it as evaluating functions first, before evaluating the arguments to a function

//Note: My numbering system is different from de Bruijn numbering. That uses the distance from the binding lambda to the bound variables so that different instances of the same  bound variables in an expression are represented with different numbes. A way to think of this is that each bound variable token is like a map telling you how to find it's binder from where it is in the expression. The binder itself does not have any number associated with it.
