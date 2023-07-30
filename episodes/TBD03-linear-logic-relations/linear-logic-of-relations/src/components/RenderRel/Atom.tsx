import styled from "styled-components";
import {
    isAtomic,
    AtomicRelation,
    Relation,
    toStr,
} from "../../logic/syntaxTree";
import { useTreeStore } from "../../stores/tree";

const AtomContainer = styled.div`
    background: #eee;
`;

type Props = {
    children: AtomicRelation;
    // root: "treeMain", // Can extend with other trees in future
    // path: string
};

export const Atom = ({ children }: Props) => {
    //   const {treeMain} = useTreeStore;
    return <AtomContainer>{toStr(children)}</AtomContainer>;
};
