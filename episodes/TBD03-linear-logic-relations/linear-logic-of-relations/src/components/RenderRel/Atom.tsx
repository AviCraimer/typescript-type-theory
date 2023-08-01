import styled from "styled-components/macro";
import { AtomicRelation, toStr } from "../../logic/syntaxTree";
import { CSSVarNames } from "../../style/CSSVariables";
import { RelationContainer } from "./components/RelationInteraction";

type Props = {
    children: AtomicRelation;
};

const AtomContainer = styled(RelationContainer)`
    background: ${CSSVarNames.pos};
    padding: 4px;
    width: fit-content;
    display: flex;
    align-items: center;
    justify-content: center;
    p {
        margin: 6px;
        line-height: 1;
    }
`;

export const Atom = ({ children }: Props) => {
    return (
        <AtomContainer>
            <p>{toStr(children)}</p>
        </AtomContainer>
    );
};

Atom.Container = AtomContainer;
