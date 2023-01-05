import {
    Lambda,
    VariableBound,
    Abstraction,
    Application,
    Var,
    isBound,
    apply,
    abstract,
    substitution,
    print,
} from "./lambdaExpressions";
import { cloneDeep, isEqual } from "lodash";

console.log("\n".repeat(15));
//
//
//
//
//
//
//
//
//
//
//
//
// TypeScript Type Theory
//
// Episode 2
//
// LAMBDA REDUCTION
//
// Created by Avi Craimer
//
//

//
//
//
//
//

export const alpha = (
    abs: Abstraction,
    boundVar: VariableBound
): Abstraction => {
    return {
        ...abs,
        parameter: boundVar,
        body: substitution(abs.body, abs.parameter, boundVar),
    };
};

//A redex is an application with an abstraction as a function
export type Redex = Application & {
    func: Abstraction;
};

export const isRedex = (expression: Lambda): boolean => {
    if (
        typeof expression !== "string" &&
        expression.role === "Application" &&
        typeof expression.func !== "string" &&
        expression.func.role === "Abstraction"
    ) {
        return true;
    } else {
        return false;
    }
};

const beta1 = (expression: Lambda): Lambda => {
    if (isRedex(expression)) {
        const redex: Redex = expression as Redex;
        const abs = redex.func;
        //Handle bound variable renaming

        return substitution(abs.body, abs.parameter, redex.argument);
    }
    return expression;
};

//Define some commonly used free variables
const x = "x";
const y = "y";
const z = "z";
const w = "w";
const f = "f";
const g = "g";
const h = "h";

// console.log(apply(f, x).toString());
// console.log(abstract(x, apply(f, x)).toString());
// console.log(abstract(f, apply(f, x)).toString());

// console.log(
//     apply(x, abstract(f, abstract(x, apply(f, x, y))), z, w).toString()
// );

const abs1 = abstract(f, abstract(x, apply(f, x, y)));
const redex = apply(abs1, z);

console.log(redex.toString());
console.log(beta1(redex).toString());
console.log(apply(beta1(redex), w).toString());
console.log(beta1(apply(beta1(redex), w)).toString());

//Demo the problem with beta1
//
console.log("\n", apply(abs1, abstract(x, x)).toString());
console.log(beta1(apply(abs1, abstract(x, x))).toString());
const badSubstitution = beta1(apply(abs1, abstract(x, x)));
console.log(apply(badSubstitution, z).toString());
console.log(beta1(apply(badSubstitution, z)).toString());
//
//

const getUniqueParamNames = (expression: Lambda): VariableBound[] => {
    const getParamsInExpression = (expression: Lambda): VariableBound[] => {
        if (typeof expression === "string") {
            return []; //By not returning bound variables at the variable level, we avoid capturing bound variables which come from a broader scope than the expression.
        }
        if (expression.role === "Application") {
            const { func, argument } = expression;
            return [
                ...getParamsInExpression(func),
                ...getParamsInExpression(argument),
            ];
        } else if (expression.role === "Abstraction") {
            const { parameter, body } = expression;
            return [parameter, ...getParamsInExpression(body)];
        }
        let nothing: never = expression;
        return expression;
    };

    //Get unique values
    return [...new Set(getParamsInExpression(expression))];
};

const OLD_getUniqueParamNames = (expression: Lambda): VariableBound[] => {
    const getParamsInExpression = (expression: Lambda): VariableBound[] => {
        if (typeof expression === "string") {
            return isBound(expression) ? [expression as VariableBound] : [];
        } else if (expression.role === "Application") {
            const { func, argument } = expression;
            return [
                ...getParamsInExpression(func),
                ...getParamsInExpression(argument),
            ];
        } else if (expression.role === "Abstraction") {
            const { parameter, body } = expression;
            return [parameter, ...getParamsInExpression(body)];
        }
        let nothing: never = expression;
        return expression;
    };

    //Get unique values
    return [...new Set(getParamsInExpression(expression))];
};

console.log("\n", abs1.toString());
console.log("Parameters: ", getUniqueParamNames(abs1));

export const beta = (() => {
    let x: number = 0;
    const count = () => {
        x++;
        return x;
    };

    return (expression: Lambda): Lambda => {
        if (isRedex(expression)) {
            const redex: Redex = expression as Redex;
            const { func, argument } = redex;
            const { parameter, body } = func;

            //Handle bound variable renaming

            const abstractionParameters = getUniqueParamNames(func);
            const argumentParameters = getUniqueParamNames(argument);
            const allParamsUsed = [
                ...abstractionParameters,
                ...argumentParameters,
            ];
            let newArg = argument;
            abstractionParameters.forEach((parameter) => {
                if (argumentParameters.includes(parameter)) {
                    let newParameter: VariableBound;
                    for (let i = 1; true; i++) {
                        const proposed = `${parameter}${"'".repeat(
                            i
                        )}` as unknown as VariableBound;
                        if (!argumentParameters.includes(proposed)) {
                            newParameter = proposed;
                            break;
                        }
                    }
                    newArg = substitution(newArg, parameter, newParameter);
                }
            });

            return substitution(body, parameter, newArg);
        }
        return expression;
    };
})();

//
//
////Same examples with the problem with beta
//
console.log("\n");
console.log(abs1.toString());
console.log(apply(abs1, abstract(x, x)).toString());
const abs1Substitution = beta(apply(abs1, abstract(x, x)));
console.log(abs1Substitution.toString());
console.log(apply(abs1Substitution, z).toString());
console.log(beta(apply(abs1Substitution, z)).toString());
//
//
type SubExpression = {
    parent: Application | Abstraction | undefined;
    relationship: "func" | "argument" | "body" | "root";
    subExp: Lambda;
};
//
const subExps = (
    expression: Lambda,
    order: "pre" | "post" = "post"
): SubExpression[] => {
    const subExps: SubExpression[] = [];

    const step = (
        expression: Lambda,
        parent: SubExpression["parent"] = undefined,
        relationship: SubExpression["relationship"] = "root"
    ): void => {
        if (order === "pre") {
            subExps.push({ parent, relationship, subExp: expression });
        }

        //Recursion
        if (typeof expression === "object") {
            if (expression.role === "Application") {
                step(expression.func, expression, "func");
                step(expression.argument, expression, "argument");
            }
            if (expression.role === "Abstraction") {
                step(expression.body, expression, "body");
            }
        }

        if (order === "post") {
            subExps.push({ parent, relationship, subExp: expression });
        }
    };
    step(expression);
    return subExps;
};

console.log("\nSub Expressions");
// console.log(subExps(abs1, "post").map((x) => x.toString()));

const app1 = apply(apply(abstract(x, x), z), w);
// print(app1);

print(
    ...subExps(app1).map((x) => {
        const { parent, subExp, relationship } = x;

        return `${x.subExp.toString()}  <--${relationship}--  ${
            x.parent ? x.parent.toString() : "undefined"
        }`;
    })
);

// const findRedex = (expression: Lambda): Redex | undefined => {
//     let redex: Redex | undefined;

//     if (typeof expression === "object") {
//         if (expression.role === "Application") {
//             if (isRedex(expression.argument)) {
//                 return;
//             }
//             findRedex(expression.func);
//         }
//         if (expression.role === "Abstraction") {
//             findRedex(expression.body);
//         }
//     }
// };

const normalizeApplicative = (
    expression: Lambda,
    log: boolean = false,
    maxSteps: number = 30
): Lambda => {
    const step = (expression: Lambda): Lambda => {
        expression = cloneDeep(expression);

        const subExpArray = subExps(expression, "post");
        const redexArray = subExpArray.filter(({ subExp }) => isRedex(subExp));

        if (redexArray.length === 0) {
            return expression;
        }

        const { parent, subExp: redex, relationship } = redexArray[0];

        const reduced = beta(redex);

        if (!parent && relationship === "root") {
            return reduced;
        } else if (parent) {
            if (parent.role === "Abstraction") {
                parent.body = reduced;
            } else if (
                parent.role === "Application" &&
                relationship !== "root" &&
                relationship !== "body"
            ) {
                parent[relationship] = reduced;
            }
        }
        return expression;
    };

    let counter = 0;
    let current = expression;

    let prev: Lambda = "___EMPTY___";
    while (!isEqual(current, prev)) {
        console.log(`${counter + 1} - ${current.toString()}`);
        prev = current;
        current = step(current);
        counter++;
        if (counter >= maxSteps) {
            const msg = `Could not normalize in ${maxSteps} steps`;
            throw new Error(msg);
        }
    }

    return current;
};

console.log("\nNormalize");
const exp2 = apply(abstract(x, apply(x, y)), apply(abstract(z, z), f, y));
const M = abstract(f, apply(f, f));
// normalizeApplicative(exp2, true);

normalizeApplicative(apply(M, M), true, 5);

//
//
//
//
//
//
//
//
//
//
///

console.log("\n\n\n\n");
