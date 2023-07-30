import {
    AllOps,
    SpecificComp,
    allOps,
    OpName,
    AtomicRelation,
    CompositeRelation,
    opSymToName,
} from "../../logic/syntaxTree";
import { Atom } from "./Atom";
import { Converse } from "./Converse";

const supportedOpTypesArr = ["atom", "converse"] as const;

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
    converse: Converse,
    atom: Atom,
};

export const getRelComponent = <Type extends SupportedOpType>(type: Type) => {
    return RelComponents[type]!;
};
