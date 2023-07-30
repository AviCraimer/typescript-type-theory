import styled from "styled-components";
import { AtomicRelation, toStr } from "../../logic/syntaxTree";

type Props = {
    children: AtomicRelation;
    // root: "treeMain", // Can extend with other trees in future
    // path: string
};

const AtomContainer = styled.div`
    background: #eee;
    padding: 4px;
`;

export const Atom = ({ children }: Props) => {
    //   const {treeMain} = useTreeStore;
    return (
        <AtomContainer>
            <p>{toStr(children)}</p>
        </AtomContainer>
    );
};

Atom.Container = AtomContainer;
