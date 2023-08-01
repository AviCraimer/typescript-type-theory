import styled, { css } from "styled-components/macro";
import {
    AllOps,
    AtomicRelation,
    SpecificComp,
    opCheck,
} from "../../logic/syntaxTree";
import { RenderRel } from ".";
import { Atom } from "./Atom";
import { CSSVarNames } from "../../style/CSSVariables";
import { RelationContainer } from "./components/RelationInteraction";

export const converseStyles = `
    background: ${CSSVarNames.neg};
    &:not(:has(&:hover)):hover {
        box-shadow: rgba(256, 256, 256, 0.25) 0px 54px 55px,
            rgba(256, 256, 256, 0.12) 0px -12px 30px,
            rgba(256, 256, 256, 0.12) 0px 4px 6px,
            rgba(256, 256, 256, 0.17) 0px 12px 13px,
            rgba(256, 256, 256, 0.09) 0px -3px 5px;
    }
`;

export const ConverseContainer = styled(RelationContainer)`
    padding: 8px;
    width: fit-content;
    ${converseStyles}
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
