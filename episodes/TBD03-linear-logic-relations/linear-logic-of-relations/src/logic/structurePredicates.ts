import {
    Relation,
    SpecificComp,
    SpecificComp2,
    SpecificComp3,
    AllOps,
    BinaryOpName,
    OpName,
    UnaryOpName,
    opCheck,
} from "./syntaxTree";

export const opCheckLevel2 =
    <Outer extends UnaryOpName, Inner extends OpName>(
        outer: Outer,
        inner: Inner
    ) =>
    (rel: Relation): rel is SpecificComp2<AllOps[Outer], AllOps[Inner]> => {
        if (opCheck.atom(rel)) {
            return false;
        }

        return opCheck[outer](rel) && opCheck[inner](rel.children[0]);
    };

export const opCheckBranch =
    <
        Outer extends BinaryOpName,
        InnerLeft extends OpName | "",
        InnerRight extends OpName | ""
    >(
        outer: Outer,
        innerLeft: InnerLeft,
        innerRight: InnerRight
    ) =>
    (
        rel: Relation
    ): rel is SpecificComp<AllOps[Outer]> & {
        children: [
            InnerLeft extends ""
                ? Relation
                : InnerLeft extends OpName
                ? SpecificComp<AllOps[InnerLeft]>
                : never,
            InnerRight extends ""
                ? Relation
                : InnerRight extends OpName
                ? SpecificComp<AllOps[InnerRight]>
                : never
        ];
    } => {
        if (opCheck.atom(rel) || !opCheck[outer](rel)) {
            return false;
        }
        const left =
            innerLeft === ""
                ? true
                : opCheck[innerLeft as OpName](rel.children[0]);
        const right =
            innerRight === ""
                ? true
                : opCheck[innerRight as OpName](rel.children[1]!); // This ! is justified because we know the outer operation is binary
        return left && right;
    };

export const opCheckLevel3 =
    <
        Outer extends UnaryOpName,
        Inner1 extends UnaryOpName,
        Inner2 extends OpName
    >(
        outer: Outer,
        inner1: Inner1,
        inner2: Inner2
    ) =>
    (
        rel: Relation
    ): rel is SpecificComp3<AllOps[Outer], AllOps[Inner1], AllOps[Inner2]> => {
        if (opCheck.atom(rel)) {
            return false;
        }

        return (
            opCheck[outer](rel) &&
            opCheck[inner1](rel.children[0]) &&
            opCheck[inner2](rel.children[0].children[0]) // TODO Check this
        );
    };

type RelationCheck<R extends Relation> = (rel: Relation) => rel is R;

export const unionChecks = <R1 extends Relation, R2 extends Relation>(
    a: RelationCheck<R1>,
    b: RelationCheck<R2>
): RelationCheck<R1 | R2> => {
    return (rel: Relation): rel is R1 | R2 => a(rel) || b(rel);
};

export const intersectChecks = <R1 extends Relation, R2 extends Relation>(
    a: RelationCheck<R1>,
    b: RelationCheck<R2>
): RelationCheck<R1 & R2> => {
    return (rel: Relation): rel is R1 & R2 => a(rel) && b(rel);
};
