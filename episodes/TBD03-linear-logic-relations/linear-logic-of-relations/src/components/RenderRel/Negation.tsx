import styled from "styled-components/macro";
import { AllOps, SpecificComp, opCheck, toStr } from "../../logic/syntaxTree";
import { RenderRel } from ".";
import { CSSVarNames } from "../../style/CSSVariables";

type Props = {
    children: SpecificComp<AllOps["neg"]> | SpecificComp<AllOps["linNeg"]>;
};

const NegationContainer = styled.div<{ isConverse: boolean }>`
    border: 1px solid #666;
    padding: 8px;
    border-radius: 50%;
    width: fit-content;
    background: ${(props) =>
        props.isConverse ? CSSVarNames.neg : CSSVarNames.pos};
    > div {
        border-radius: 50%;
    }
`;

export const Negation = ({ children }: Props) => {
    // For linear negation render with dark background.
    const converse = opCheck.linNeg(children);

    return (
        <NegationContainer isConverse={converse}>
            <RenderRel>{children.children[0]}</RenderRel>
        </NegationContainer>
    );
};

Negation.Container = NegationContainer;
