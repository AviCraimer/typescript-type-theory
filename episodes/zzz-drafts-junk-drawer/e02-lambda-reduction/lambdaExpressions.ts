export type Lambda = FreeVariable | Application | Abstraction;

type Variable = string;
type FreeVariable = Variable;

//Bound Variable
export type VariableBound = `˚{string}`;

export function isBound(x: any) {
    if (typeof x === "string") {
        return x.indexOf("˚") === 0;
    } else {
        return false;
    }
}

export function Var(name: string, free?: true): FreeVariable;
export function Var(name: string, free?: false): VariableBound;
export function Var(name: string, free?: undefined): FreeVariable;
export function Var(name: string, free?: boolean): Variable {
    free = free ?? true;
    name = name.replaceAll("˚", "");
    //Add symbol for bound variables
    name = free ? name : `˚${name}`;

    return name;
}

export type Application = {
    readonly role: "Application";
    func: Lambda;
    argument: Lambda;
    toString: () => string;
};

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

export type Abstraction = {
    readonly role: "Abstraction";
    parameter: VariableBound;
    body: Lambda;
    toString: () => string;
};

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
