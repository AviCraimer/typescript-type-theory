import { opApp, atom, toStr, allOps, opCheck } from "./syntaxTree";
import { describe, it } from "vitest";

const R = atom("R", "Ř");
const S = atom("S", "Š");
const T = atom("T", "Ť");

const conR = opApp.converse(R);
const conConR = opApp.converse(conR);
const negConR = opApp.neg(conR);
const linNegNegR = opApp.linNeg(opApp.neg(R));
const RS = opApp.comp(R, S);
const cRParS = opApp.par(conR, S);
const complex1 = opApp.linImp(opApp.and(cRParS, T), RS);

describe("Testing toStr for syntax trees, this does a pretty good job of testing the syntax tree structure itself without getting bogged down in the details of object structur", () => {
    it.concurrent("Atomic relations and converses to string", ({ expect }) => {
        expect(toStr(R)).toBe("R");
        expect(toStr(conR)).toBe("Ř");
    });

    it.concurrent("Unary operations to string", ({ expect }) => {
        expect(toStr(conConR)).toBe(allOps.converse + `(${"Ř"})`);
        expect(toStr(negConR)).toBe(allOps.neg + `(${"Ř"})`);
        expect(toStr(linNegNegR)).toBe(
            `${allOps.linNeg}(${allOps.neg}(${"R"}))`
        );
    });

    it.concurrent("Binary operations to string", ({ expect }) => {
        expect(toStr(RS)).toBe(`(R ${allOps.comp} S)`);
        expect(toStr(complex1)).toBe(
            `(((Ř ${allOps.par} S) ${allOps.and} T) ${allOps.linImp} (R ${allOps.comp} S))`
        );
    });
});

describe("Basic operation checking", () => {
    it.concurrent("opChecking", ({ expect }) => {
        expect(opCheck.atom(R)).toBe(true);
        expect(opCheck.atom(complex1)).toBe(false);
        expect(opCheck.neg(R)).toBe(false);
        expect(opCheck.converse(R)).toBe(false);
        expect(opCheck.and(R)).toBe(false);
    });

    it.concurrent("opChecking", () => {});
    it.concurrent("opChecking", () => {});
});
