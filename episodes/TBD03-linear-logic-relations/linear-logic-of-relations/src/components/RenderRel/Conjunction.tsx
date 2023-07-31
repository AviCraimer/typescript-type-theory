import styled from "styled-components/macro";
import { AllOps, SpecificComp } from "../../logic/syntaxTree";
import { RenderRel } from ".";
import { CSSVarNames } from "../../style/CSSVariables";

type Props = {
    children: SpecificComp<AllOps["and"]>;
};

const ConjunctionContainer = styled.div`
    display: grid;
    grid-template-rows: 1fr 1fr;
    gap: 8px;
    padding: 8px;
    width: calc(fit-content + 16px);
    height: fit-content;
    background: ${CSSVarNames.pos};
    border: 1px dotted #444;
    justify-content: center;

    > div {
        width: calc(100% - 16px);
    }
`;

export const Conjunction = ({ children }: Props) => {
    return (
        <ConjunctionContainer>
            <RenderRel>{children.children[0]}</RenderRel>
            <RenderRel>{children.children[1]}</RenderRel>
        </ConjunctionContainer>
    );
};

Conjunction.Container = ConjunctionContainer;
