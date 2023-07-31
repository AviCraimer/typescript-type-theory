import styled from "styled-components/macro";
import { AllOps, SpecificComp } from "../../logic/syntaxTree";
import { RenderRel } from ".";
import { CSSVarNames } from "../../style/CSSVariables";

type Props = {
    children: SpecificComp<AllOps["comp"]>;
};

const CompositionContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 8px;
    width: fit-content;
    height: calc(fit-content + 16px);
    background: ${CSSVarNames.pos};
    align-items: center;
    border: 1px dotted #444;

    > div {
        height: calc(100% - 16px);
    }
`;

export const Composition = ({ children }: Props) => {
    return (
        <CompositionContainer>
            <RenderRel>{children.children[0]}</RenderRel>
            <RenderRel>{children.children[1]}</RenderRel>
        </CompositionContainer>
    );
};

Composition.Container = CompositionContainer;
