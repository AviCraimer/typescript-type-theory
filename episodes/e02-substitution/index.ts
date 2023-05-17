import {
    abstraction,
    application,
    Var,
    varEq,
    varIn,
    printExpr,
    substitute,
    getChildBoundVars,
    printChildFV,
    filterVarsByName,
    excludeVariables,
    lambdaToString,
    getFreshVar,
    // subForBound,
    // boundVariableString,
    // betaStep,
    // betaReduce,
} from "./classicNamedCalculus";
console.log("\n".repeat(6));

const x = Var("x");
const x1 = Var("x_1", true);
const x134 = Var("x__134", true);
const y = Var("y");
const z = Var("z");
const w = Var("w");

// console.log(excludeVariables([x, y, z], [x, w, z]));

const xy = application(x, y);
const absX = abstraction(x, xy);

// printExpr(x);
// printExpr(xy);
// printExpr(absX);

const xz = application(x, z);
const xyxz = application(xy, xz);
const xyxzAbs = abstraction(x, xyxz);
const xyxzAbsAbs = abstraction(x, xyxzAbs);

// printExpr(xyxzAbs);
// console.log(getChildBoundVars(xyxzAbsAbs));
printExpr(xyxzAbsAbs);

const sub1 = substitute(xyxzAbsAbs, xyxz, y);

printExpr(sub1);

// printChildFV(xyxzAbs);

// console.log(getFreshVar([x1, x, y, x134, x, z], "x"));

// const sub = subForBound(absX.body, boundVariableString(x), xyxz);

// printExpr(absX);
// printExpr(sub);
// printExpr(absX);

// const absY = abstraction("y", xy);
// const absYY = application(y, absY);

// const xz = application(x, z);
// const absZ = abstraction("z", xz);
// const absZZ = application(z, absZ);
// const absZZZ = abstraction("z", absZZ);

// //Demonstrates non-capture
// const absYYY = abstraction("y", absYY);
// //Prints as λ(˚y_2).[(λ(˚y_1).[(x)(˚y_1)])(˚y_2)]
// //Notice the second abstraction over y does not capture the bound variable ˚y_1

// // const id1 = abstraction("x", x);
// // const trivAbs = abstraction("x", y);
// // console.log(x);
// // console.log(y);
// // console.log(absX);
// // console.log(JSON.stringify(xy, , 2));
// // console.log(absX);
// printExpr(absX);
// printExpr(absY);
// printExpr(absYYY);
// printExpr(absZZZ);
// printExpr(absYYY, false);

// const subZ = boundVarSubstitution(absYYY, z.lambda);

// console.log(subExprToString(subZ));
