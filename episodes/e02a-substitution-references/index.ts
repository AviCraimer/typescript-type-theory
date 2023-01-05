import {
    Abstraction,
    abstract,
    Var,
    apply,
    print,
    reduceRedex,
    LambdaExpression,
    Reducible,
    LambdaTerm,
} from "./lambdaExpressions";
import "./lambdaExpressions";

const x = Var("x");
const y = Var("y");
const z = Var("z");
const w = Var("w");
const f = Var("f");
const g = Var("g");
const h = Var("h");

// console.log(x.freeVars);

// print(apply(x, y, apply(z, w)));

const example1 = abstract(apply(x, y, apply(z, x)), "x", "y");
print(example1);

const afterSub1 = reduceRedex(apply(example1, apply(g, h)) as Reducible);

console.log("after sub");
print(example1, afterSub1);

const afterSub2 = reduceRedex(apply(afterSub1, apply(f, x)) as Reducible);

print(afterSub2);

const innerLambdaApplication = abstract(apply(abstract(x, "x"), f), "f");

// const [idx, fBound] = innerLambdaApplication.children[0].children;

// print(innerLambdaApplication); //[λ˚f.[λ˚x.˚x](˚f)]

reduceRedex(innerLambdaApplication.children[0]);
// print(innerLambdaApplication);
//[λ˚f.˚f(˚f)]
//This looks correct, but the λ˚f will not have the new bound variables as instances. So it needs to be updated.

print(innerLambdaApplication);
// print(innerLambdaApplication.children[0].children[1]);
console.log(
    innerLambdaApplication.boundVarInstances[0] ===
        innerLambdaApplication.children[0]
);

// console.log(
//     innerLambdaApplication.boundVarInstances[0].parent.childIndex,
//     innerLambdaApplication.children[0].children[1].parent?.childIndex
// );

// console.log(innerLambdaApplication.boundVarInstances.length);

// Variable Capture / Shadowing

//Gabriella's hard case
// print(y);

// print(abstract(y, x));

// const hardCaseStep1 = abstract(y, x, y);
// print(hardCaseStep1);

// const hardCaseStep2 = apply(hardCaseStep1, x);

// print(hardCaseStep2);
