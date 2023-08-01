import { create } from "zustand";
import { Relation } from "../logic/syntaxTree";

export type TreeStoreState = {
    treeMain: Relation | undefined;
    updateTree: (rel: Relation) => void;
};

export const useTreeStore = create<TreeStoreState>((set) => ({
    treeMain: undefined,
    updateTree: (rel: Relation) => set({ treeMain: rel }),
}));
