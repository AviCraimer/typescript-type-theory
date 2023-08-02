import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { create } from "zustand";
import { Relation } from "../../../logic/syntaxTree";
import { v4 as uuid } from "uuid";

export const RelationContainer = styled.div`
    &:not(:has(&:hover)):hover {
        box-shadow: rgba(0, 0, 0, 0.25) 0px 54px 55px,
            rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px,
            rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px;
        outline: 3px solid #33cf91;
    }
`;

//Take two (first version below)

type RelInfo = {
    ID: string;
    rel: Relation;
    parentID: string;
};

type RelStore = {
    rels: {
        [id: string]: RelInfo;
    };
    selectedRels: string[];
    selectionMode: "unary" | "binary" | "nary";
};

// The idea is that every RelRender component has a ref with an uuid and the RelRender actually checks if that id exists in the store and if so it uses the rel there to render.

// This means the RelRender's children gives the initial value for its relation, but the children can be updated later

// I'll also need to clean up when a RelRender is unmounted and remove any unmounted ids from the store.

// e.g., when applying an inference rule to two selected relations I may need to check if they are siblings, so I need the parent id. I also need the parent id to replace the two rels with a new rel by updating the parent's relation after inference. This gives us the ability to do re-writing without rebuilding the whole tree.

//First attempt

// I need to give this some more thought.
// // TODO: Some of this is going to need to go in RelRender
// type SelectedRel = {
//     id: string;
//     currentRel: Relation;
// };

// export type selectedRelsState = {
//     selectedRels: SelectedRel[];
//     addSelectedRel: (id: string, rel: Relation) => void;
//     removeSelectedRel: (id: string) => void;
//     getSelectedRel: (id: string) => SelectedRel | undefined;
// };

// export const useSelectedRelsStore = create<selectedRelsState>((set, get) => ({
//     selectedRels: [],
//     getSelectedRel: (id: string) => {
//         return get().selectedRels.find((rel) => rel.id === id);
//     },
//     addSelectedRel: (id: string, rel: Relation) => {
//         const { getSelectedRel, selectedRels } = get();

//         if (getSelectedRel(id) === undefined) {
//             set({ selectedRels: [...selectedRels, { id, currentRel: rel }] });
//         }
//     },
//     removeSelectedRel: (id: string) => {
//         const { getSelectedRel, selectedRels } = get();
//         if (getSelectedRel(id)) {
//             set({
//                 selectedRels: get().selectedRels.filter((rel) => rel.id !== id),
//             });
//         }
//     },
// }));

// type Props = {
//     className?: string;
//     relation: Relation;
// };

// export const RelationInteraction = ({ className, relation }: Props) => {
//     // Add ref for unique id
//     const idRef = useRef(uuid());

//     const [children, setChildren] = useState(relation);

//     const { selectedRels, addSelectedRels, removeSelectedRels } =
//         useSelectedRelsStore();

//     useEffect(() => {
//         if (selectedRels.includes(idRef.current)) {
//             setChildren(<YourNewComponent />);
//         } else {
//             setChildren(<YourOriginalComponent />);
//         }
//     }, [selectedRels]);

//     const onClick = () => {
//         if (selectedRels.find((item) => item.expression === relation)) {
//             removeSelectedRels(relation);
//             setChildren(<YourNewComponent />);
//         } else {
//             addSelectedRels(relation, containerRef);
//             setChildren(<YourOriginalComponent />);
//         }
//     };

//     return (
//         <RelationContainer className={className} onClick={onClick}>
//             {children}
//         </RelationContainer>
//     );
// };
