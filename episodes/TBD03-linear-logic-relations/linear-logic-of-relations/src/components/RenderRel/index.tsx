import styled from "styled-components/macro";
import {
    Relation,
    SpecificComp,
    opCheck,
    opSymToName,
} from "../../logic/syntaxTree";
import {
    SupportedOpType,
    getRelComponent,
    getSupportedOpType,
} from "./dispatch";

type Props = {
    root?: boolean;
    children: Relation;
};

const RelationContainer = styled.div`
    box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;
    width: fit-content;
    --positive-background-color: #fff;
    --negative-background-color: #222;
    padding: 24px;
    background: #ddd;
`;

export const RenderRel = ({ children, root = false }: Props) => {
    const type = opCheck.atom(children)
        ? "atom"
        : getSupportedOpType(children.operation);

    if (type) {
        // Below: We know that children has the correct type for the component because we looked up the component from the children, but TS can't infer this, so we use any here.
        const Component = getRelComponent(type) as (props: {
            children: Relation;
        }) => JSX.Element;

        return root ? (
            <RelationContainer>
                <Component>{children}</Component>
            </RelationContainer>
        ) : (
            <Component>{children}</Component>
        );
    } else {
        console.log("\nBad render below:");
        console.error(children);
        throw new Error("attempted render of non supported type ");
    }
};
