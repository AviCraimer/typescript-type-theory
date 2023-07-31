export const unaryOps = {
    neg: "¬",
    converse: "⫯",
    linNeg: "~",
} as const;

export const binaryOps = {
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

export type BinaryOpName = keyof typeof binaryOps;
export type UnaryOpName = keyof typeof unaryOps;
export type OpName = BinaryOpName | UnaryOpName;

export const allOps: {
    [opName in OpName]: opName extends BinaryOpName
        ? (typeof binaryOps)[opName]
        : opName extends UnaryOpName
        ? (typeof unaryOps)[opName]
        : never;
} = {
    ...unaryOps,
    ...binaryOps,
} as const;

export type AllOps = typeof allOps;

export type AtomicRelation = {
    type: "atomic relation";
    name: string;
    converseName: string;
};

export const atom = (name: string, converse: string): AtomicRelation => {
    return {
        type: "atomic relation",
        name,
        converseName: converse,
    };
};

export type Relation = AtomicRelation | CompositeRelation;

export type CompositeRelation = UnaryComposite | BinaryComposite;
export type Operation = UnaryOp | BinaryOp;

export type UnaryOp = (typeof unaryOps)[keyof typeof unaryOps];

export type UnaryComposite = {
    type: "composite";
    operation: UnaryOp;
    children: [Relation];
};

export type BinaryOp = (typeof binaryOps)[keyof typeof binaryOps];

export type BinaryComposite = {
    type: "composite";
    operation: BinaryOp;
    children: [Relation, Relation];
};

export type SpecificComp<Op extends Operation> = CompositeRelation & {
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

export const isAtomic = (relation: Relation): relation is AtomicRelation => {
    if (relation.type === "atomic relation") {
        return true;
    } else {
        return false;
    }
};

export const isUnary = (relation: Relation): relation is UnaryComposite => {
    if (
        !isAtomic(relation) &&
        Object.values(unaryOps).includes(relation.operation as UnaryOp)
    ) {
        return true;
    } else {
        return false;
    }
};

export const isBinary = (relation: Relation): relation is BinaryComposite => {
    if (
        !isAtomic(relation) &&
        Object.values(binaryOps).includes(relation.operation as BinaryOp)
    ) {
        return true;
    } else {
        return false;
    }
};

const isOp =
    <Op extends Operation>(op: Op) =>
    (relation: Relation): relation is SpecificComp<Op> => {
        return "children" in relation && relation.operation === op;
    };

export const opCheck: {
    [opName in OpName | "atom"]: (
        relation: Relation
    ) => relation is opName extends OpName
        ? SpecificComp<AllOps[opName]>
        : AtomicRelation;
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
    atom: isAtomic,
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

export type ApplyOp<Op extends Operation> = (
    ...relations: SpecificComp<Op>["children"]
) => SpecificComp<Op>;

export const opApp: {
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

export const toStr = (relation: Relation): string => {
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

export const printRel = (rel: Relation | undefined) => {
    console.log(rel ? toStr(rel) : "undefined");
};

const sd = Object.entries(allOps);

type Entries<T extends {}> = {
    [K in keyof T]: [K, T[K]];
}[keyof T];

type Entries2<T extends {}> = {
    [K in keyof T]: { [valKey in T[K]]: K };
};

type ReverseMap<T extends Record<keyof T, keyof any>> = {
    [P in T[keyof T]]: {
        [K in keyof T]: T[K] extends P ? K : never;
    }[keyof T];
};

export type OpSymToName = ReverseMap<AllOps>;
export const opSymToName = <Op extends AllOps[OpName]>(op: Op) => {
    const opName = (Object.keys(allOps) as Array<OpName>).find(
        (key) => allOps[key] === op
    );

    if (opName === undefined) {
        throw new Error();
    } else {
        return opName as OpSymToName[Op];
    }
};

export const getOpName = <Op extends AllOps[OpName]>(op: Op): OpName => {
    for (const key in allOps) {
        const opName = key as OpName;
        const opSym = allOps[opName];
        if (opSym === op) {
            return opName;
        }
    }
    throw new Error();
};
