import { lam } from "../classicNamedCalculus";

const { Var, app, abs, printExpr, betaReduce } = lam;

const z = Var("z");
const x = Var("x");
const y = Var("y");
const w = Var("w");

const xy = app(x, y);
const absX = abs(x, xy);

// printExpr(x);
// printExpr(xy);
// printExpr(absX);

const xz = app(x, z);
const xw = app(x, w);
const xyxz = app(xy, xz);
const xyxzAbs = abs(x, xyxz);
const xyxzAbsAbs = abs(y, xyxzAbs);

const toReduce1 = app(absX, w);
// printExpr(toReduce1);
// printExpr(betaReduce(toReduce1));
// printExpr(xyxzAbs);
// console.log(getBoundVars(xyxzAbsAbs));

const toReduce2 = app(xyxzAbsAbs, x); //That is wrong

printExpr(toReduce2);
const reduced2 = betaReduce(toReduce2);
printExpr(reduced2);
console.log("\n\n");
// (λ(y).[λ(x).[((x)(y))((x)(z))]])(x)
// λ(x).[((x)(x))((x)(z))]
// Error, the x has gotten captured

const toReduce3 = app(xyxzAbsAbs, abs(w, app(x, y)), x);
printExpr(toReduce3);
printExpr(betaReduce(toReduce3));
