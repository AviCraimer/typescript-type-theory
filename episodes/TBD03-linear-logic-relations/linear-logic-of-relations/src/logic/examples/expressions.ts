import { opApp, atom, printRel } from "../syntaxTree";

export const R = atom("R", "Ř");
export const S = atom("S", "Š");
export const T = atom("T", "Ť");

printRel(R);
const conR = opApp.converse(R);
printRel(conR);
const conConR = opApp.converse(conR);
printRel(conConR);

const RS = opApp.comp(R, S);
printRel(RS);
const conRS = opApp.comp(conR, S);
printRel(conRS);

const cRParS = opApp.par(conR, S);
printRel(cRParS);

const complex1 = opApp.linImp(opApp.and(cRParS, T), RS);
printRel(complex1);

export const examples1 = {
    R,
    S,
    conR,
    conConR,
    RS,
    conRS,
    cRParS,
    complex1,
};
