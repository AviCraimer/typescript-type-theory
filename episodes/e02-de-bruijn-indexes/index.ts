import { apply, abstract, Var } from "./lambdaExpressions";
import { print } from "./utils";
console.log("\n".repeat(10));
const x = Var("x");
const y = Var("y");
const z = Var("z");
const w = Var("w");
const f = Var("f");
const g = Var("g");
const h = Var("h");

// Variable Capture / Shadowing

//Gabriella's hard case
print(y);

print(abstract(y, x));

const hardCaseStep1 = abstract(y, x, y);
print(hardCaseStep1);

const hardCaseStep2 = apply(hardCaseStep1, x);

print(hardCaseStep2);
// "λ(˚y).[λ(˚x).[˚y]](x)"

// print("after beta-reduction: λ(˚x).[x]");

//Notice that you can't construct λ(˚x).[x] from the bottom-up, you can only reach it thorugh beta-rection

const attempt1 = abstract(x, x);

// print(attempt1);

const hardCase = abstract(hardCaseStep2, x);

print("\n", hardCase);

// λ(˚x).[λ(˚y).[λ(˚x).[˚y]](˚x)]")
//Beta-reduce
// λ(˚x).[λ(˚x).[˚x]]

// In JavaScript and most programming languages, when there is variable name shadowing, we always use the inner most scope where the variable name is assigned.

const fn1 = (x: Symbol) => (x: number) => x + 4;

//However, this isn't the case for our lambda term hard case. Here, the outer bound x is referenced by the bound x in the body of the inner function.

// We can disambiguate by adding numbers to index the variable names like so:

// λ(˚x@2).[λ(˚x@1).[˚x@2]]

// These are called De Bruijn indexes, originally described by Nicolaas Govert de Bruijn in a paper you'll find in the Github folder for this episode.

//We start by counting the number of lambda abstractions nested inside of an expression. I'll call this the De Bruijn number of the expression. When building lambda terms, we can propagae the De Bruijn number upwards from variables.

// Variables have De Bruijn number
// Applications have De Bruijn number equal to the maximum of either the number of either function or the argument
// Abstractions have De Bruijn number of the body of the abstraction plus 1.
// The De Bruijn number of an abstraction is used as the  De Bruijn index of the variables that are bound to that abstraction.

//Examples

console.log("variable:", x.getDeBruijnNumber(), "\n");
print(hardCaseStep1, "number: " + hardCaseStep1.getDeBruijnNumber(), "");
print(hardCaseStep2, "number: " + hardCaseStep2.getDeBruijnNumber());

// print("λ(˚x).[λ(˚y).[λ(˚x).[˚y]](˚x)]");

// print(`λ(˚x).[λ(˚y).[λ(˚x).[˚y]](˚x)]`);
// console.log(hardCase.toString());
console.log(hardCase.toString("both"));

//After substitution
// λ(x@3).[[λ(x@1).[x@3]]]

///Tests

// const appExpression = apply(x, y, apply(z, w));
// const absX = abstract(appExpression, Var("x"));
// const absY = abstract(
//     abstract(abstract(abstract(absX, Var("y")), Var("z")), Var("w")),
//     Var("x")
// );
// const absYList = abstract(
//     appExpression,
//     Var("x"),
//     Var("y")
//     // Var("z"),
//     // Var("w"),
//     // Var("x")
// );

// console.log(appExpression.toString());

// console.log(absY.toString());
// console.log(absY.toString());
// console.log(absYList.toString("indexes"));
// console.log(absY.toString("both"));

// const absA = abstract(Var("a"), Var("a"));

// const absB = abstract(Var("b"), Var("b"));

// console.log(absA.toString(), " Indexes:", absA.toString("indexes"));
// console.log(absB.toString(), " Indexes:", absB.toString("indexes"));
// console.log(absA.eq(absB));

// const appF = apply(Var("f"), Var("c"));
// console.log(appF.toString());

// const absAppFInC = abstract(appF, Var("c"));
// console.log(absAppFInC.toString());
// console.log(absAppFInC.toString("indexes"));
// console.log(absAppFInC.toString("both"));

//Talk by Gabrielle Gozales (link in the description)

// const absAppFInCInF = abstract(appF, Var("c"), Var("f"));

// console.log(absAppFInCInF.toString("both"));

//Gabriella's hard case

// const hardCaseStep1 = abstract(Var("y"), Var("x"), Var("y"));
// console.log(hardCaseStep1.toString());

// const hardCaseStep2 = apply(hardCaseStep1, Var("x"));
// console.log(hardCaseStep2.toString());

// const nope1 = abstract(Var("x"), Var("x"));

// console.log(nope1.toString());

// result: λ(˚x).[˚x]
// Want we get from beta-reduction is:  λ(˚x).[x]
// In Indexes  λ(˚1).[x]

// const hardCase = abstract(hardCaseStep2, Var("x"));
// console.log(hardCase.toString());
// console.log(hardCase.toString("both"));

//After substitution
// λ(x@3).[[λ(x@1).[x@3]]]

print("\n".repeat(2));
