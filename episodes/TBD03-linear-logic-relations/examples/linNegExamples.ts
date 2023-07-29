import { linNegRewrite } from "../rewrite";
import { allOps, opApp, printRel, atom } from "../syntaxTree";

const { linNeg, neg, converse } = allOps;

const R = atom("R", "Ř");
const form1 = opApp.neg(opApp.converse(R));
const rewrite1 = linNegRewrite(form1);
// printRel(form1);
// printRel(rewrite1);

const form2 = opApp.converse(opApp.neg(R));
const rewrite2 = linNegRewrite(form1);
// printRel(form2);
// printRel(rewrite2);

const normalForm = opApp.linNeg(R);
const rewriteNormal = linNegRewrite(normalForm);
printRel(normalForm);
printRel(rewriteNormal);

const rewrite = linNegRewrite(form1);
