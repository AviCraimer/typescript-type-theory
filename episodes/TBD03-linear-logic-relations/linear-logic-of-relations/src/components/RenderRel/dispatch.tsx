import {
    AllOps,
    SpecificComp,
    OpName,
    AtomicRelation,
    opSymToName,
} from "../../logic/syntaxTree";
import { Atom } from "./Atom";
import { Composition } from "./Composition";
import { Conjunction } from "./Conjunction";
import { Converse } from "./Converse";
import { Negation } from "./Negation";

const supportedOpTypesArr = [
    "atom",
    "converse",
    "neg",
    "linNeg",
    "and",
    "comp",
] as const;

export type SupportedOpType = (typeof supportedOpTypesArr)[number];

export const getSupportedOpType = (op: AllOps[keyof AllOps]) => {
    const opName = opSymToName(op);
    return supportedOpTypesArr.includes(opName as SupportedOpType)
        ? (opName as SupportedOpType & OpName)
        : false;
};

type RelComponentDictionary = Partial<{
    [OpNm in SupportedOpType]: (props: {
        children: OpNm extends "atom"
            ? AtomicRelation
            : OpNm extends OpName
            ? SpecificComp<AllOps[OpNm]>
            : never;
    }) => JSX.Element;
}>;

const RelComponents: RelComponentDictionary = {
    atom: Atom,
    converse: Converse,
    neg: Negation,
    linNeg: Negation,
    and: Conjunction,
    comp: Composition,
};

export const getRelComponent = <Type extends SupportedOpType>(type: Type) => {
    return RelComponents[type]!;
};
