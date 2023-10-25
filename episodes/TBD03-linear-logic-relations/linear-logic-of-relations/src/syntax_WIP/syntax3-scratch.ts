import { BaseType } from "typescript";
import { ResolveType, ShallowDistributeUnion, UnionToTuple } from "./Utility";
import { MyNumber, Plus, Minus } from "./Expr";

// e. g.,

type Placeholder0 = any;
type Placeholder1 = [any];
type Placeholder2 = [any, any];
type Placeholder3 = [any, any, any];
type PlaceholderArray = any[];

type ReplaceChildren<T> = T extends { children: PlaceholderArray }
    ? Omit<T, "children"> & { children: Placeholder0 }
    : T extends { children: Placeholder1 }
    ? Omit<T, "children"> & { children: Placeholder1 }
    : T extends { children: Placeholder2 }
    ? Omit<T, "children"> & { children: Placeholder2 }
    : T extends { children: Placeholder3 }
    ? Omit<T, "children"> & { children: Placeholder3 }
    : T extends { children: PlaceholderArray }
    ? Omit<T, "children"> & { children: PlaceholderArray }
    : T;

// This doesn't work because it is not iterating over the union. 
type BaseUnion = ResolveType<ReplaceChildren<MyNumber | Plus | Minus>>;

type DistributedBaseUnion = ShallowDistributeUnion<BaseUnion>;

type RecursiveReplacement<T> = T extends { children: Placeholder0 }
    ? Omit<T, "children">
    : T extends { children: Placeholder1 }
    ? Omit<T, "children"> & { children: [DistributedExpr] }
    : T extends { children: Placeholder2 }
    ? Omit<T, "children"> & { children: [DistributedExpr, DistributedExpr] }
    : T extends { children: Placeholder3 }
    ? Omit<T, "children"> & {
          children: [DistributedExpr, DistributedExpr, DistributedExpr];
      }
    : T extends { children: PlaceholderArray }
    ? Omit<T, "children"> & { children: DistributedExpr[] }
    : T;

type DistributedExpr = RecursiveReplacement<DistributedBaseUnion>;
