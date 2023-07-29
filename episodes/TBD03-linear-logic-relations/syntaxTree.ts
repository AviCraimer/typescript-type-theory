const unaryOps = {
    neg: "¬",
    converse: "⫯",
    linNeg: "~",
} as const;

const binaryOps = {
    par: "⅋", // "⪤",
    comp: "▸",
    and: "&",
    or: "∨",
    linImp: "⊸",
    linImpLeft: "⟜",
    imp: "⊃",
} as const;

//TODO
// const nAryOps = {
//     and: "&",
//     or: "∨",
// };

type BinaryOpName = keyof typeof binaryOps;
type UnaryOpName = keyof typeof unaryOps;
type OpName = BinaryOpName | UnaryOpName;

const allOps: {
    [opName in OpName]: opName extends BinaryOpName
        ? (typeof binaryOps)[opName]
        : opName extends UnaryOpName
        ? (typeof unaryOps)[opName]
        : never;
} = {
    ...unaryOps,
    ...binaryOps,
} as const;

type AllOps = typeof allOps;

type AtomicRelation = {
    type: "atomic relation";
    name: string;
    converseName: string;
};

const atom = (name: string, converse: string): AtomicRelation => {
    return {
        type: "atomic relation",
        name,
        converseName: converse,
    };
};

type Relation = AtomicRelation | CompositeRelation;

type CompositeRelation = UnaryComposite | BinaryComposite;
type Operation = UnaryOp | BinaryOp;

type UnaryOp = (typeof unaryOps)[keyof typeof unaryOps];

type UnaryComposite = {
    type: "composite";
    operation: UnaryOp;
    children: [Relation];
};

type BinaryOp = (typeof binaryOps)[keyof typeof binaryOps];

type BinaryComposite = {
    type: "composite";
    operation: BinaryOp;
    children: [Relation, Relation];
};

type SpecificComp<Op extends Operation> = CompositeRelation & {
    operation: Op;
};

export type SpecificComp2<
    Outer extends UnaryOp,
    Inner extends Operation
> = SpecificComp<Outer> & {
    children: [SpecificComp<Inner>];
};

export type SpecificComp3<
    Outer extends UnaryOp,
    Inner1 extends UnaryOp,
    Inner2 extends Operation
> = SpecificComp<Outer> & {
    children: [SpecificComp2<Inner1, Inner2>];
};

const isOp =
    <Op extends Operation>(op: Op) =>
    (relation: Relation): relation is SpecificComp<Op> => {
        return "children" in relation && relation.operation === op;
    };

const opCheck: {
    [opName in OpName]: (
        relation: Relation
    ) => relation is SpecificComp<AllOps[opName]>;
} = {
    par: isOp(allOps.par),
    comp: isOp(allOps.comp),
    and: isOp(allOps.and),
    or: isOp(allOps.or),
    linImp: isOp(allOps.linImp),
    linImpLeft: isOp(allOps.linImpLeft),
    imp: isOp(allOps.imp),
    neg: isOp(allOps.neg),
    converse: isOp(allOps.converse),
    linNeg: isOp(allOps.linNeg),
};

const opCheckLevel2 =
    <Outer extends UnaryOpName, Inner extends OpName>(
        outer: Outer,
        inner: Inner
    ) =>
    (rel: Relation): rel is SpecificComp2<AllOps[Outer], AllOps[Inner]> => {
        if (isAtomic(rel)) {
            return false;
        }

        return opCheck[outer](rel) && opCheck[inner](rel.children[0]);
    };

const opCheckBranch =
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
        if (isAtomic(rel) || !opCheck[outer](rel)) {
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

const opCheckLevel3 =
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
        if (isAtomic(rel)) {
            return false;
        }

        return (
            opCheck[outer](rel) &&
            opCheck[inner1](rel.children[0]) &&
            opCheck[inner2](rel.children[0].children[0])
        );
    };

type RelationCheck<R extends Relation> = (rel: Relation) => rel is R;

const unionChecks = <R1 extends Relation, R2 extends Relation>(
    a: RelationCheck<R1>,
    b: RelationCheck<R2>
): RelationCheck<R1 | R2> => {
    return (rel: Relation): rel is R1 | R2 => a(rel) || b(rel);
};

const intersectChecks = <R1 extends Relation, R2 extends Relation>(
    a: RelationCheck<R1>,
    b: RelationCheck<R2>
): RelationCheck<R1 & R2> => {
    return (rel: Relation): rel is R1 & R2 => a(rel) && b(rel);
};

const isAtomic = (relation: Relation): relation is AtomicRelation => {
    if (relation.type === "atomic relation") {
        return true;
    } else {
        return false;
    }
};

const isUnary = (relation: Relation): relation is UnaryComposite => {
    if (
        !isAtomic(relation) &&
        Object.values(unaryOps).includes(relation.operation as UnaryOp)
    ) {
        return true;
    } else {
        return false;
    }
};

const isBinary = (relation: Relation): relation is BinaryComposite => {
    if (
        !isAtomic(relation) &&
        Object.values(binaryOps).includes(relation.operation as BinaryOp)
    ) {
        return true;
    } else {
        return false;
    }
};

const applyUnary =
    <Op extends UnaryOp>(op: Op) =>
    (relation: Relation): SpecificComp<Op> => {
        return {
            type: "composite",
            operation: op,
            children: [relation],
        };
    };

const applyBinary =
    <Op extends BinaryOp>(op: Op) =>
    (...relations: [Relation, Relation]): SpecificComp<Op> => {
        return {
            type: "composite",
            operation: op,
            children: [...relations],
        };
    };

type ApplyOp<Op extends Operation> = (
    ...relations: SpecificComp<Op>["children"]
) => SpecificComp<Op>;

const opApp: {
    [opName in keyof AllOps]: ApplyOp<AllOps[opName]>;
} = {
    par: applyBinary(allOps.par),
    comp: applyBinary(allOps.comp),
    and: applyBinary(allOps.and),
    or: applyBinary(allOps.or),
    linImp: applyBinary(allOps.linImp),
    linImpLeft: applyBinary(allOps.linImpLeft),
    imp: applyBinary(allOps.imp),
    neg: applyUnary(allOps.neg),
    converse: applyUnary(allOps.converse),
    linNeg: applyUnary(allOps.linNeg),
};

const toStr = (relation: Relation): string => {
    if (relation.type === "atomic relation") {
        return relation.name;
    } else if (
        opCheck.converse(relation) &&
        relation.children[0].type === "atomic relation"
    ) {
        return relation.children[0].converseName;
    } else if (isUnary(relation)) {
        return `${relation.operation}(${toStr(relation.children[0])})`;
    } else if (isBinary(relation)) {
        return `(${toStr(relation.children[0])} ${relation.operation} ${toStr(
            relation.children[1]
        )})`;
    }

    let x: never = relation;
    return relation;
};

const printRel = (rel: Relation | undefined) => {
    console.log(rel ? toStr(rel) : "undefined");
};

export {
    opApp,
    opCheck,
    allOps,
    toStr,
    atom,
    printRel,
    opCheckLevel2,
    opCheckBranch,
    opCheckLevel3,
    unionChecks,
    intersectChecks,
};
export type { Relation, SpecificComp };
