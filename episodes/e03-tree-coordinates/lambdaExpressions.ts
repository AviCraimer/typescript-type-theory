import { cloneDeep } from "lodash";
import { getHash } from "./utils";
//Any complex lambda expression has branches with other lambda expressions, named as follows

const appliedFunctionBranch = Symbol("applied function");
const argumentBranch = Symbol("passed argument");
const abstractionBodyBranch = Symbol("Abstraction Body");

type LambdaBranches =
    | typeof appliedFunctionBranch
    | typeof argumentBranch
    | typeof abstractionBodyBranch;

//Tree coordinates are a sequence of instructions to follow branches to a node inside the lambda expression tree.
type ExpressionCoordinates = LambdaBranches[];
type LambdaSubExpression = {
    [hash in string]: Set<ExpressionCoordinates>;
};

export type Variable = {
    role: "Variable";
    variableName: string;
    binder: Abstraction | undefined; //Free variables do not have a binder, their instances are evaluated relative to the global context.
    instances: LambdaSubExpression;
    toString: () => string;
};

export type FreeVariable = Variable & { binder: undefined };
export type BoundVariable = Variable & { binder: Abstraction };

//Instead of using a string we now use an object marked as a bound variable instance.
export type VariableInstance = {
    readonly role: "Variable Instance";
    variable: Variable;
    toString: () => string;
};

export type FreeVariableInstance = VariableInstance & {
    variable: FreeVariable;
};

export type Lambda = FreeVariableInstance | Application | Abstraction;

export type Application = {
    readonly role: "Application";
    func: Lambda;
    argument: Lambda;
    toString: () => string;
};

export type Abstraction = {
    readonly role: "Abstraction";
    parameter: Variable;
    // When an abstraction is formed, it will always use a new variable that points to the abstraction itself as the binder. Instances of the free variable that are abstracted over, will be replaced by instances of the new variable.
    body: Lambda;
    toString: () => string;
};

type ContextInterface = {
    freeVariable: (v: string) => void;

    //Lambda introduction methods
    fVar: (freeVariable: string) => VariableInstance;
    app: (f: Lambda, x: Lambda) => Application;
    abs: (f: Lambda, v: string) => Abstraction;
};

const variableNameGeneratorFn = function* (
    nameAccumulator: Set<string>,
    prefix: string = ""
) {
    const paramLetters = ["x", "y", "z", "w", "u", "v"];
    let paramIndex = 0;
    let variableNumber = 0;

    while (true) {
        const name = `${prefix}${paramLetters[paramIndex]}${
            variableNumber ? "_" + variableNumber : ""
        }`;
        nameAccumulator.add(name);
        yield name;
        if (paramIndex + 1 === paramLetters.length) {
            paramIndex = 0;
            variableNumber++;
        } else {
            paramIndex++;
        }
    }
};

class Context implements ContextInterface {
    private freeVariables: { [variableName in string]: FreeVariable } = {};
    private usedNames: Set<string> = new Set();
    private freeVariableName = variableNameGeneratorFn(this.usedNames);
    private boundVariableName = variableNameGeneratorFn(this.usedNames, "˚");
    private lambdaExpressions: { [hash in string]: Lambda } = {};

    mkVariable(name?: string | undefined, binder?: undefined): FreeVariable;
    mkVariable(name?: string | undefined, binder?: Abstraction): BoundVariable;
    mkVariable(
        name: string | undefined,
        binder: Abstraction | undefined
    ): Variable {
        //If the variable has a binder autogenerate a new bound variables name.
        //If the variable is free
        const variableName = binder
            ? this.boundVariableName.next().value
            : name ?? this.freeVariableName.next().value;

        return {
            role: "Variable",
            binder,
            instances: [],
            variableName,
            toString: () => variableName,
        };
    }

    private freeVariable(name: string | undefined = undefined): FreeVariable {
        if (name) {
            //Remove bound variable unicode symbol
            name = name.replaceAll("˚", "");
            if (name in this.freeVariables) {
                return this.freeVariables[name];
            }
            this.usedNames.add(name);
        } else if (name === "") {
            throw new Error(
                "Cannot use an empty string as a free variable name"
            );
        }

        const newVariable = this.mkVariable(name);
        const { variableName } = newVariable;

        this.freeVariables[variableName] = newVariable;

        return newVariable;
    }

    //Returns the hash for the added expression
    private addLambdaExp(exp: Lambda): string {
        const hash = getHash(exp.toString());
        if (!this.lambdaExpressions[hash]) {
            this.lambdaExpressions[hash] = cloneDeep(exp);
        }
        return hash;
    }

    //String argument can be used to retrieve instances of free variables by name
    private getLambdaExp(lambda: string | Lambda | { hash: string }) {
        let hash: string;
        if (typeof lambda === "string") {
            hash = getHash(lambda);
        } else if ("hash" in lambda) {
            hash = lambda.hash;
        } else {
            hash = getHash(lambda.toString());
        }
        if (!this.lambdaExpressions[hash]) {
            console.log("Input for lambda expression is undefined: ", lambda);
            throw new Error(`lambda expression cannot be found.`);
        }

        return this.lambdaExpressions[hash];
    }

    //Lambda introduction methods
    freeVariableExp(name: string | undefined) {
        const variable = this.freeVariable(name);

        const instance: FreeVariableInstance = {
            role: "Variable Instance",
            variable,
            toString: variable.toString,
        };

        const hash = this.addLambdaExp(instance);
        let subExp: Set<ExpressionCoordinates>;
        if (!variable.instances[hash]) {
            subExp = new Set();
            //Empty expression coordinates indicate that the root expression is the free variable
            subExp.add([]);
            variable.instances[hash] = subExp;
        }

        return hash;
    }

    abstractionExp(
        prevExpression: Parameters<typeof this.getLambdaExp>[0],
        freeVar: string | FreeVariable
    ): Abstraction {
        const expression = this.getLambdaExp(prevExpression);

        // I need to separate the display logic for toString, and the hash logic.
        // The hash logic must serialize in a way that does not depend on the names of the bound variables so that the hash is alpha equivalence invariant

        //The display string will use the variables names.

        //Note that the hash should also not depend on what free variable was abstracted over, since abstracting over different free variables can produce the same lambda term when neither variable is present in the term being abstracted over.
    }
    applicationExp(f: Lambda, x: Lambda): Application {}
}

export const apply = (...args: Lambda[]): Application => {
    if (args.length < 2) {
        throw new Error("Cannot apply with fewer than two lambda arguments");
    }

    const applyOnce = (func: Lambda, argument: Lambda): Application => {
        return {
            role: "Application",
            func,
            argument,
            toString,
        };
    };

    let current = applyOnce(args[0], args[1]);

    args.forEach((arg, i) => {
        if (i > 1) {
            current = applyOnce(current, arg);
        }
    });

    return current;
};

// console.log(apply(x, y, apply(z, w)).toString());

// Any object we can form that fits this type will be a valid lambda expression.
function toString(this: Abstraction | Application): string {
    if (this.role === "Abstraction") {
        const { parameter, body } = this;
        return `[ λ${parameter} . ${body.toString()} ]`;
    } else if (this.role === "Application") {
        const { func, argument } = this;
        return `${func.toString()} (${argument.toString()})`;
    }
    const nothing: never = this;
    return nothing;
}

//To create an abstraction we need substitution.
export const substitution = (
    expression: Lambda,
    replace: Variable,
    substitute: Lambda | VariableBound
): Lambda => {
    if (typeof expression === "string") {
        //Variable
        if (expression === replace) {
            if (!isBound(replace) && !isBound(substitute)) {
                throw new Error(
                    "You can only replace a free variable with a bound variable."
                );
            }

            return substitute;
        } else {
            //Otherwise return it unmodified
            return expression;
        }
    } else if (expression.role === "Abstraction") {
        const { parameter, body } = expression;

        return {
            ...expression,
            parameter:
                isBound(substitute) && replace === expression.parameter
                    ? (substitute as VariableBound)
                    : expression.parameter,
            body: substitution(body, replace, substitute),
        };
    } else if (expression.role === "Application") {
        //Application
        const { func, argument } = expression;

        return {
            ...expression,
            func: substitution(func, replace, substitute),
            argument: substitution(argument, replace, substitute),
        };
    }
    const nothing: never = expression; //So TypeScript knows undefined will never be implicitly returned by the function.
    return nothing;
};

export const abstract = (
    variable: FreeVariable,
    expression: Lambda
): Abstraction => {
    const parameter = Var(variable, false);
    const body = substitution(expression, variable, parameter);

    return {
        role: "Abstraction",
        parameter,
        body,
        toString,
    };
};

export const print = (...objs: any[]) => {
    objs.forEach((obj) => console.log(obj.toString()));
};
