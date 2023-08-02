import styled from "styled-components/macro";
import { Relation, opCheck } from "../../logic/syntaxTree";
import { getRelComponent, getSupportedOpType } from "./dispatch";

type Props = {
    root?: boolean;
    children: Relation;
};

const RootRelationContainer = styled.div`
    box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;
    width: fit-content;
    --positive-background-color: #fff;
    --negative-background-color: #222;
    padding: 24px;
    background: #ddd;
`;

export const RenderRel = ({ children: relation, root = false }: Props) => {
    const type = opCheck.atom(relation)
        ? "atom"
        : getSupportedOpType(relation.operation);

    if (type) {
        // Below: We know that children has the correct type for the component because we looked up the component from the children, but TS can't infer this, so we use any here.
        const Component = getRelComponent(type) as (props: {
            children: Relation;
        }) => JSX.Element;

        return root ? (
            <RootRelationContainer>
                <Component>{relation}</Component>
            </RootRelationContainer>
        ) : (
            <Component>{relation}</Component>
        );
    } else {
        console.log("\nBad render below:");
        console.error(relation);
        throw new Error("attempted render of non supported type ");
    }
};
