import { opCheckLevel2, opCheckLevel3 } from "../structurePredicates";
import { opApp, atom } from "../syntaxTree";

const R = atom("R", "Ř");
const S = atom("S", "Š");
const T = atom("T", "Ť");

const negConverseR = opApp.neg(opApp.converse(R));

const converseNegR = opApp.converse(opApp.neg(R));

const normalForm = opApp.linNeg(R);

const converseNegCheck = opCheckLevel2("converse", "neg");
const negConverseCheck = opCheckLevel2("neg", "converse");

console.log(converseNegCheck(converseNegR)); // true
console.log(negConverseCheck(converseNegR)); // false
console.log(negConverseCheck(negConverseR)); // true
console.log(converseNegCheck(negConverseR)); // false
console.log(converseNegCheck(R)); // false

const converseNegCompCheck = opCheckLevel3("converse", "neg", "comp");

const example1 = opApp.converse(opApp.neg(opApp.comp(R, S)));

console.log(converseNegCompCheck(example1)); // true
console.log(converseNegCompCheck(converseNegR)); // false
console.log(converseNegCompCheck(S)); // false
