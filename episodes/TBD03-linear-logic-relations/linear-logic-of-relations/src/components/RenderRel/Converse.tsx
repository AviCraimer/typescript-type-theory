import styled from "styled-components/macro";
import {
    AllOps,
    AtomicRelation,
    SpecificComp,
    opCheck,
} from "../../logic/syntaxTree";
import { RenderRel } from ".";
import { Atom } from "./Atom";
import { CSSVarNames } from "../../style/CSSVariables";

const ConverseContainer = styled.div`
    background: ${CSSVarNames.neg};
    border: #6968b8;
    padding: 8px;
    width: fit-content;
`;

// Converse of an atomic relation is handled specially

const Flip = styled.span`
    display: inline-block;
    transform: rotate(180deg);
    transform-origin: center;
`;

type AtomConverseProps = {
    children: AtomicRelation;
};
const AtomConverse = ({ children }: AtomConverseProps) => {
    const { name, converseName } = children;

    return (
        <ConverseContainer>
            <Atom.Container>
                <>
                    <p>
                        <Flip>({name})</Flip>
                    </p>
                    <p>{converseName}</p>
                </>
            </Atom.Container>
        </ConverseContainer>
    );
};

type ConverseProps = {
    children: SpecificComp<AllOps["converse"]>;
};

export const Converse = ({ children }: ConverseProps) => {
    const inner = children.children[0];

    return (
        <ConverseContainer>
            {opCheck["atom"](inner) ? (
                <AtomConverse>{inner}</AtomConverse>
            ) : (
                <RenderRel>{inner}</RenderRel>
            )}
        </ConverseContainer>
    );
};
