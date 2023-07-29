import {
    toStr,
    opApp,
    opCheck,
    atom,
    printRel,
    Relation,
    allOps,
    SpecificComp,
    SpecificComp2,
    opCheckBranch,
    opCheckLevel2,
    unionChecks,
    intersectChecks,
} from "./syntaxTree";
import { Diversity, Id, Bottom, Top } from "./constantRelations";
import { isEqual } from "lodash";

// An equivalence requires a predicate to test if the tree has the correct shape and a function to transform a tree of that shape to another shape.

type RewritePred<T extends Relation> = (rel: Relation) => rel is T;
type RewriteReplacer<T extends Relation, R extends Relation> = (rel: T) => R;

type Rewrite = <T extends Relation, R extends Relation>(
    pred: RewritePred<T>,
    replace: RewriteReplacer<T, R>
) => (rel: Relation) => R | undefined;

export const mkRewrite: Rewrite = (pred, replace) => (rel: Relation) => {
    if (pred(rel)) {
        return replace(rel);
    } else {
        return undefined;
    }
};

type LinearNegNonNormal =
    | SpecificComp2<typeof allOps.neg, typeof allOps.converse>
    | SpecificComp2<typeof allOps.converse, typeof allOps.neg>;

const linNegPred = unionChecks(
    opCheckLevel2("converse", "neg"),
    opCheckLevel2("neg", "converse")
);

// const linNegPred2: RewritePred<LinearNegNonNormal> = (
//     rel: Relation
// ): rel is LinearNegNonNormal => {
//     if (rel.type === "atomic relation") {
//         return false;
//     }

//     const form1 = opCheck.neg(rel) && opCheck.converse(rel.children[0]);
//     const form2 = opCheck.converse(rel) && opCheck.neg(rel.children[0]);

//     return form1 || form2;
// };

const linNegReplace: RewriteReplacer<
    LinearNegNonNormal,
    SpecificComp<typeof allOps.linNeg>
> = (rel) => {
    const innerRel = rel.children[0].children[0];
    return opApp.linNeg(innerRel);
};

export const linNegRewrite = mkRewrite(linNegPred, linNegReplace);

// Linear negation rules from rules

const diversityCandidate = unionChecks(
    opCheckBranch("comp", "", "neg"),
    opCheckBranch("comp", "neg", "")
);

//TODO Test this
// Prediate for the re-write rules
// R;~(R)  => Diversity
// ~(R);R  => Diversity
const equalToDiversity = (rel: Relation) => {
    if (diversityCandidate(rel)) {
        const left = rel.children[0];
        const right = rel.children[1];

        let equality: boolean = false;
        if (opCheck["neg"](left)) {
            equality = equality || isEqual(left.children[0], right);
        }
        if (opCheck["neg"](right)) {
            equality = equality || isEqual(right.children[0], left);
        }
        return equality;
    } else {
        return false;
    }
};

// Linear implication equivalence
// not(con(R);not(R)) = R linImp R = ~R par R
// not(not(R);con(R)) = R linImpLeft R = R par ~R
// Rewrite to the version with the implication

const negatedCompositionCheck = opCheckLevel2("neg", "comp");
const parRightNeg = opCheckBranch("par", "", "neg");
const parLeftNeg = opCheckBranch("par", "neg", "");

// not(con(R);not(R)) = R linImp R = ~R par R
const rightLinImpCheck = (rel: Relation) => {
    if (negatedCompositionCheck(rel)) {
        const [left, right] = rel.children[0].children;
        const { neg, converse } = opCheck;

        if (converse(left) && neg(right)) {
            return isEqual(left.children[0], right.children[0]);
        }
    }

    if (parLeftNeg(rel)) {
        const [left, right] = rel.children;
        return isEqual(left.children[0], right);
    }
    return false;
};

// not(not(R);con(R)) = R linImpLeft R = R par ~R
const leftLinImpCheck = (rel: Relation) => {
    if (negatedCompositionCheck(rel)) {
        const [left, right] = rel.children[0].children;
        const { neg, converse } = opCheck;

        if (neg(left) && converse(right)) {
            return isEqual(left.children[0], right.children[0]);
        }
    }

    if (parRightNeg(rel)) {
        const [left, right] = rel.children;
        return isEqual(left, right.children[0]);
    }
    return false;
};

//Linear implication intro

// I'm not sure if the con below is correct
// Id => con(R) linImp R <=> ~(R)parR <=> R
//Leftward imp
// Id => R linImp con(R) <=> ~(R)parR <=> R par~(R)

// Material conditional
// Id => R -> R

// Linear Distributivity

// R ; (S par T) => (R ; S) par T
//  (S par T) ;R =>  S par (T;R)

// identity = con(id)
// Unit of rel comp

// diversity = not(id) = con(diversity)

// diversity par R = R = R par diversity  -- Unit for par

// top = not(bottom)
// Unit of conjunction

// bottom = not(top)
// Unit of disjunction

// not;con = con;not = linNeg
