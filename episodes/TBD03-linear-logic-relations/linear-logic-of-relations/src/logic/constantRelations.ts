// Id, top, bottom, diversity
import { atom } from "./syntaxTree";

// This is the diagonal relation, it relates every element of the left set to itself in the right set
// Id is the unit for composition
export const Id = atom("Id", "Id");

// The complement of the diagonal, it relates every element x to all elements except for x
// Diversity is the unit for par
export const Diversity = atom("Diversity", "Diversity");

// This is the empty relation
// Bottom is the unit for disjunction
export const Bottom = atom("⊥", "⊥");

// This is the full relation, isomorphic to A x A, for each set A.
// Top is the unit for conjunction
export const Top = atom("⊤", "⊤");
