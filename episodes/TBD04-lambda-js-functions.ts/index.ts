// This is working pretty well. I need to finish testing it, but I think I finally did it!!

import { isEqual, min } from "lodash";

console.log("\n".repeat(5));

type SType = "Ind" | "Bool" | [dom: SType, cod: SType];

type App = { syntax: "App"; type: SType; func: Term; arg: Term };
type Abs = {
    syntax: "Abs";
    type: [SType, SType];
    body: Term;
    paramName: string;
};
type Var = { syntax: "Var"; type: SType; index: number; name: string };

type Term = App | Abs | Var;

type ContextEl =
    | {
          type: SType;
          name: string;
      }
    | undefined;

type Context = ContextEl[];

const ctxEl = (type: SType, name: string = ""): ContextEl => {
    return {
        type,
        name,
    };
};

type STTerm = {
    context: Context;
    term: Term;
};

// TODO: Not working, need to write some unit tests
function shift(
    offset: number,
    t: Term,
    minIndex: number = 0,
    maxIndex: number = Infinity
): Term {
    console.log(t);
    console.log(t.index >= minIndex && t.index <= maxIndex);
    console.log(t.index + offset);

    switch (t.syntax) {
        case "Var":
            return t.index >= minIndex && t.index <= maxIndex
                ? { ...t, index: t.index + offset }
                : t;
        case "Abs":
            return {
                ...t,
                body: shift(offset, t.body, minIndex + 1, maxIndex + 1),
            };
        case "App":
            return {
                ...t,
                func: shift(offset, t.func, minIndex, maxIndex),
                arg: shift(offset, t.arg, minIndex, maxIndex),
            };
        default:
            return t;
    }
}

function extendContext(term: STTerm, type: SType, name?: string): STTerm {
    return {
        ...term,
        context: [ctxEl(type, name), ...term.context],
    };
}

function mkVar(ctx: Context, indexInCtx: number): STTerm {
    const contextEl = ctx[indexInCtx];
    if (contextEl !== undefined) {
        return {
            context: ctx,
            term: {
                syntax: "Var",
                index: indexInCtx,
                type: contextEl.type,
                name: contextEl.name,
            },
        };
    }
    throw new Error("Unbound variable");
}

function mkAbs(body: STTerm, indexInCtx: number): STTerm {
    const { context, term } = body;
    const paramType = context[indexInCtx]?.type;

    if (paramType === undefined) {
        throw new Error("Variable to abstract over is not in context");
    }

    // Remove the free variable from the context and shift the remaining variables
    const newContext = context
        .slice(0, indexInCtx)
        .concat(context.slice(indexInCtx + 1));

    let shiftedTerm = term;
    if (indexInCtx !== 0) {
        // When the head variable in the context is bound, no shifting is needed.

        // Free vars in the context that have an index greater than indexInCtx don't change in the term
        // Their indexes are shifted down one in the context, but this is balanced by the indexes in the term being shifted +1 by the new outer lambda
        // However, free vars in the context that have an index less than indexInCtx do not shift within the context so the indexes of that variable in the term need be shifted +1 to account for the new outer lambda binder.
        const shiftedContextVars = shift(1, term, 0, indexInCtx - 1);
        // TODO: this isn't working -- seems to be a problem with shift

        // The bound variable is not shifted by the new lambda binder.
        // However, it is shifted downwards when a free variable is moved from deeper inside the context.

        const shiftedTerm = shift(
            -indexInCtx,
            shiftedContextVars,
            indexInCtx,
            indexInCtx
        );
    }
    // Create the abstraction and shift the term inside the body
    const newTerm: Term = {
        syntax: "Abs",
        type: [paramType, term.type],
        body: shiftedTerm,
        paramName: context[indexInCtx]?.name ?? "",
    };

    return {
        context: newContext,
        term: newTerm,
    };
}

function mkApp(func: STTerm, arg: STTerm): STTerm {
    const { context: funcCtx, term: funcTerm } = func;
    const { context: argCtx, term: argTerm } = arg;

    // Ensure the function term is actually a function (an abstraction)
    if (typeof funcTerm.type === "string") {
        throw new Error("Function term is does not have a function type");
    }

    // Check if the argument term's type matches the function's domain
    const domainType = funcTerm.type[0];

    if (!isEqual(domainType, argTerm.type)) {
        throw new Error("Type mismatch between function domain and argument");
    }

    // If the contexts match exactly there is no need to merge and shift.
    const matchingContexts = isEqual(funcCtx, argCtx);

    let newArg: Term = argTerm;
    let newCtx: Context = argCtx;
    if (!matchingContexts) {
        // If contexts don't match merge the two contexts
        newCtx = [...funcCtx, ...argCtx];

        // Shift the indices of the argument term
        newArg = shift(funcCtx.length, argTerm, 0);
    }

    const appTerm: App = {
        syntax: "App",
        func: funcTerm,
        arg: newArg,
        type: funcTerm.type[1], // Codomain of function
    };

    return {
        context: newCtx,
        term: appTerm,
    };
}

const toStringDeBruijin = (term: Term): string => {
    const inner = (term: Term): string => {
        if (term.syntax === "Var") {
            return String(term.index);
        } else if (term.syntax === "Abs") {
            return `[λ${inner(term.body)}]`;
        } else {
            return `(${inner(term.func)})(${inner(term.arg)})`;
        }
    };

    return inner(term);
};

const toStringNames = (term: Term): string => {
    const inner = (term: Term): string => {
        if (term.syntax === "Var") {
            return String(term.name);
        } else if (term.syntax === "Abs") {
            return `[λ${term.paramName}.${inner(term.body)}]`;
        } else {
            return `(${inner(term.func)})(${inner(term.arg)})`;
        }
    };

    return inner(term);
};

// const toStringDeBruijin = (stTerm: STTerm, subExpr: Term) : string => {
//     const {context, term: rootTerm} = stTerm

//     // const levelContext = [...context].reverse()

//     const nameCounter : {[name: string]: number} = {}

//     const inner = (term:Term, level: number) => {

//         if (term.syntax === "Var") {
//             return term.name
//         }
//      else if (term.syntax === "Abs") {
//         if (param )

//          return `λ(${inner(abs.)}).[${bodyStr}]`;
//     } else {
//         return
//     }
//     }

// }

function substitute(target: number, replacement: Term, receiver: Term): Term {
    switch (receiver.syntax) {
        case "Var":
            if (receiver.index === target) {
                return replacement;
            } else {
                return receiver;
            }
        case "Abs":
            return {
                ...receiver,
                body: substitute(
                    target + 1,
                    shift(1, replacement, 0),
                    receiver.body
                ),
            };
        case "App":
            return {
                ...receiver,
                func: substitute(target, replacement, receiver.func),
                arg: substitute(target, replacement, receiver.arg),
            };
    }
}

function betaReduce(t: Term): Term {
    switch (t.syntax) {
        case "App":
            // We reduce the argument and function first
            const func = betaReduce(t.func);
            const arg = betaReduce(t.arg);

            // Then apply argument
            if (func.syntax === "Abs") {
                return betaReduce(substitute(0, shift(1, arg, 0), func.body));
            } else {
                throw new Error("Type error, application not a function.");
            }
        case "Abs":
            return { ...t, body: betaReduce(t.body) };
        default:
            return t;
    }
}

// For testing to avoid blow ups
// function safeBetaReduce(t: Term, counter = 0, max = 100): Term {
//     const betaReduce = (t: Term): Term => {
//         counter = counter + 1;

//         if (counter > max) {
//             throw new Error(`Beta reduction exceeded max iterations`);
//         }

//         switch (t.syntax) {
//             case "App":
//                 // We reduce the argument and function first
//                 const func = betaReduce(t.func);
//                 const arg = betaReduce(t.arg);

//                 // Then apply argument
//                 if (func.syntax === "Abs") {
//                     return betaReduce(
//                         substitute(0, shift(1, 0, arg), func.body)
//                     );
//                 } else {
//                     throw new Error("Type error, application not a function.");
//                 }
//             case "Abs":
//                 return {
//                     syntax: "Abs",
//                     type: t.type,
//                     body: betaReduce(t.body),
//                 };
//             default:
//                 return t;
//         }
//     };
// }

const lam = {
    v: mkVar,
    ap: mkApp,
    ab: mkAbs,
    toStr: (x: STTerm) =>
        `${toStringDeBruijin(x.term)}\n${toStringNames(x.term)}\n`,
};

// TESTS

const myContext: Context = [
    { type: "Ind", name: "x" },
    { type: "Bool", name: "y" },
    { type: ["Ind", "Bool"], name: "z" },
];

const x = mkVar(myContext, 0);

const y = mkVar(myContext, 1);

const z = mkVar(myContext, 2);

const zx = lam.ap(z, x);
console.log(zx.context.map((x) => x.name));
console.log(lam.toStr(zx));

// const lamxy = lam.ab(zx, 0);
// console.log(lamxy.context.map((x) => x.name));
// console.log(lam.toStr(lamxy));

// const lamZlamXY = lam.ab(lamxy, 1);
// console.log(lamZlamXY.context.map((x) => x.name));
// console.log(lam.toStr(lamZlamXY));

// Binding the z first
const lamZX = lam.ab(zx, 2);
console.log(lamZX.context.map((x) => x.name));
console.log(lam.toStr(lamZX));

export {};
