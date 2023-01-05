import { isEqualWith } from "lodash";
import type { LambdaExpression } from "./lambdaExpressions";

type MaybePropertyName = string | number | symbol | undefined;
//Gets a function to check deep equality for two objects, with keys to ignore curried in.
export const objEq =
    (ignoreKeys: MaybePropertyName[] | readonly MaybePropertyName[] = []) =>
    (obj1: {}, obj2: {}) => {
        return isEqualWith(
            obj1,
            obj2,
            (_: {}, __: {}, key: MaybePropertyName | undefined) => {
                if (ignoreKeys.includes(key)) {
                    return true;
                }
            }
        );
    };

//The properties in this array will be ignored when comparing lambda expressions for equality
const inessentialLambdaProps = [
    "boundVarName",
    "freeVarAbstractedOver",
] as const;

const lambdaEq = objEq(inessentialLambdaProps);
export const lambdaEqMethod = function (
    this: LambdaExpression,
    exp: LambdaExpression
): boolean {
    return lambdaEq(this, exp);
};

export const print = (...objs: any[]) => {
    objs.forEach((obj) => console.log(obj.toString()));
};

export const printI = (...objs: any[]) => {
    objs.forEach((obj) => console.log(obj.toString("indexes")));
};

export const printB = (...objs: any[]) => {
    objs.forEach((obj) => console.log(obj.toString("both")));
};

//The characters in this array cannot be used in free variable names
export const reservedChars = [
    "˚",
    "λ",
    "@",
    " ",
    "\n",
    ".",
    "[",
    "]",
    "(",
    ")",
] as const;
