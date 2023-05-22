import { testLambdaArr, lambdaTestJSON } from "./fixture";
import { abstraction, lam, LambdaMethods } from "../classicNamedCalculus";

const { mkLambdaFn, lambdaToString } = lam;

// const compareExpressionStrings: LambdaMethods<
//     boolean,
//     [{ stringExpression: string}]
// > =  {
//     variable: (x, _, {stringExpression}) => {
//         return lambdaToString(x) === stringExpression
//     },
//     abstraction: (absExp, inner, {stringExpression}) => {
//         console.log( `
//   My Version: ${lambdaToString(absExp)}
// Test Version: ${stringExpression}
//         `)
//     },
//     application: () => {

//     }

// };

// console.log(testLambdaArr.length, lambdaTestJSON.length);

testLambdaArr.forEach((lambda, i) => {
    console.log(`
  My Version: ${lambdaToString(lambda)}
Test Version: ${lambdaTestJSON[i].stringExpression}
        `);
});
