//New as of May 17 2023

export type LambdaExpr = Abstraction | Variable | Application;

export type LambdaChild<L extends LambdaExpr = LambdaExpr> = {
    childFreeVars: Variable[]; //Used to check if a variable is fresh for a replacement
    childExpr: L;
};

export type BaseLambda<Meta extends {}> = {
    children: LambdaChild[];
    syntax: string; // Indicates the kind of syntax represented by the object
} & Meta; // Pass in metalanguage info which can be used to add types, etc.;

export type Variable<Meta extends {} = {}> = BaseLambda<{
    syntax: "variable";
    name: string;
    children: never[];
}> &
    Meta;

export type Abstraction<Meta extends {} = {}> = BaseLambda<{
    syntax: "abstraction";
    boundVar: Variable;
    children: [body: LambdaChild];
}> &
    Meta;

export type Application<Meta extends {} = {}> = BaseLambda<{
    syntax: "application";
    children: [func: LambdaChild, argument: LambdaChild];
}> &
    Meta;

export const isVar = (x: LambdaExpr): x is Variable => {
    if (x.syntax === "variable") {
        return true;
    } else {
        return false;
    }
};

export const isAbs = (x: LambdaExpr): x is Abstraction => {
    if (x.syntax === "abstraction") {
        return true;
    } else {
        return false;
    }
};

export const isApp = (x: LambdaExpr): x is Application => {
    if (x.syntax === "application") {
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
        syntax: "variable",
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
        syntax: "abstraction",
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
        syntax: "application",
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

export const appBranches = <App extends Application>(
    app: App
): [
    func: App["children"][0]["childExpr"],
    arg: App["children"][1]["childExpr"]
] => {
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
        //A.K.A.: The hard part!
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
            //The fresh var should be distinct from the bound variables in replacement. It's okay if it is the same as an inner bound variable since it will just be shadowed as normal.
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

export const alphaEq = (
    lambda1: LambdaExpr,
    lambda2: LambdaExpr,
    boundVarCount: number = 0
): Boolean => {
    if (isAbs(lambda1) && isAbs(lambda2)) {
        const canonicalBoundVar = Var("" + boundVarCount, true);
        const body1 = lambda1.children[0].childExpr;
        const body2 = lambda2.children[0].childExpr;
        const newBody1 = substitute(body1, canonicalBoundVar, lambda1.boundVar);
        const newBody2 = substitute(body2, canonicalBoundVar, lambda2.boundVar);
        console.log("1.");
        printExpr(lambda1);
        printExpr(newBody1);
        console.log(2);
        printExpr(lambda2);
        printExpr(newBody2);
        return alphaEq(newBody1, newBody2, boundVarCount + 1);
    } else if (isApp(lambda1) && isApp(lambda2)) {
        const [func1, arg1] = appBranches(lambda1);
        const [func2, arg2] = appBranches(lambda2);
        return (
            alphaEq(func1, func2, boundVarCount) &&
            alphaEq(arg1, arg2, boundVarCount)
        );
    } else if (isVar(lambda1) && isVar(lambda2)) {
        return lambda1.name === lambda2.name;
    } else {
        return false;
    }
};

//This type defines a beta reducible lambda expression
type Redex = Application & {
    children: [LambdaChild<Abstraction>, LambdaChild];
};

const isRedex = (lambda: LambdaExpr): lambda is Redex => {
    if (isApp(lambda)) {
        const [func, arg] = appBranches(lambda);
        if (isAbs(func)) {
            return true;
        }
    }
    return false;
};

export const betaStep = (redex: Redex) => {
    const [func, arg] = appBranches(redex);
    const body = func.children[0].childExpr;
    return substitute(body, arg, func.boundVar);
};

export const betaReduce = (lambda: LambdaExpr, maxSteps = 20) => {
    const tracker = { hasBeenReduced: false, count: 0 };

    const inner = (lambda: LambdaExpr): LambdaExpr => {
        if (isRedex(lambda)) {
            tracker.hasBeenReduced = true;
            return betaStep(lambda);
        } else if (isApp(lambda)) {
            const [func, arg] = appBranches(lambda);
            return application(inner(func), inner(arg));
        } else if (isAbs(lambda)) {
            const body = lambda.children[0].childExpr;
            return abstraction(lambda.boundVar, inner(body));
        } else if (isVar(lambda)) {
            return lambda;
        }
        let x: never = lambda;
        return x;
    };

    let current = lambda;
    while (
        tracker.count === 0 ||
        (tracker.hasBeenReduced === true && tracker.count < maxSteps)
    ) {
        tracker.hasBeenReduced = false;

        current = inner(current);

        tracker.count = tracker.count + 1;
        if (tracker.count === maxSteps) {
            console.log("max steps reached");
        }
    }
    return current;
};

// To do
// Make get free vars function rather than tracking free vars in children
// Simpilifies the structure of many functions, allows mapping directly over children expressions
// Make a nicer interface for building expressions

export const app = (...lambdas: LambdaExpr[]): Application => {
    return lambdas.reduce((a, b) => {
        return application(a, b);
    }) as Application;
};

export function var_(names: string, numberingAllowed?: boolean): Variable;
export function var_(names: string[], numberingAllowed?: boolean): Variable[];
export function var_(
    names: string | string[],
    numberingAllowed = false
): Variable | Variable[] {
    if (typeof names === "string") {
        return Var(names, numberingAllowed);
    }
    if (names.length === 0) {
        throw new Error("Empty array passed to variable constructor.");
    } else {
        const variables: Variable[] = names.map((name) =>
            Var(name, numberingAllowed)
        );
        return [...new Set(variables)];
    }
}

export function abs(
    variables: Variable | Variable[] | string | string[],
    expression: LambdaExpr,
    visualOrder = true
) {
    let vars: Variable[];
    if (typeof variables === "string") {
        vars = [Var(variables)];
    } else if (Array.isArray(variables) && variables.length === 0) {
        //Abstracting in no variables is just leaving the expression unchanged
        return expression;
    } else if (Array.isArray(variables) && typeof variables[0] === "string") {
        vars = var_(variables as string[]);
    } else if (Array.isArray(variables)) {
        vars = variables as Variable[];
    } else {
        vars = [variables];
    }

    // Visual order means that the array elements have the same order as the visual output after abstraction

    // e.g.,
    // λ(x).[(λ(y).[(w)(y)])(x)]
    // visual order => ["x", "y"]
    // construction order => ["y", "x"]

    // Visual order is the reverse of the order of construction of iterated abstraction
    visualOrder && vars.reverse();

    let result = expression;
    vars.forEach((x) => {
        result = abstraction(x, result);
    });

    return result;
}

export const lam = {
    Var: var_,
    abs,
    app,
    alphaEq,
    betaReduce,
    isVar,
    isAbs,
    isApp,
    lambdaToString,
};
