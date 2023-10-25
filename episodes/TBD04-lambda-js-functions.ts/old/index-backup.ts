import { isEqual } from "lodash";

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

function shift(offset: number, cutoff: number, t: Term): Term {
    switch (t.syntax) {
        case "Var":
            return t.index >= cutoff ? { ...t, index: t.index + offset } : t;
        case "Abs":
            return {
                ...t,
                body: shift(offset, cutoff + 1, t.body),
            };
        case "App":
            return {
                ...t,
                func: shift(offset, cutoff, t.func),
                arg: shift(offset, cutoff, t.arg),
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

    // Create the abstraction and shift the term inside the body
    const newTerm: Term = {
        syntax: "Abs",
        type: [paramType, term.type],
        body: shift(-1, indexInCtx, term),
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
    if (funcTerm.syntax !== "Abs") {
        throw new Error("Function term is not a lambda abstraction");
    }

    // Check if the argument term's type matches the function's domain
    const domainType = funcTerm.type[0];

    if (!isEqual(domainType, argTerm.type)) {
        throw new Error("Type mismatch between function domain and argument");
    }

    // Merge the two contexts, shifting the indices of the second context
    const newCtx = [...funcCtx, ...argCtx];

    const shiftedArg = shift(funcCtx.length, 0, argTerm);

    const appTerm: App = {
        syntax: "App",
        func: funcTerm,
        arg: shiftedArg,
        type: funcTerm.type[1], // Codomain of function
    };

    return {
        context: newCtx,
        term: appTerm,
    };
}

const toStringDeBruijin = (term: Term): string => {
    const inner = (term: Term) => {
        if (term.syntax === "Var") {
            return term.index;
        } else if (term.syntax === "Abs") {
            return `[λ${inner(term.body)}]`;
        } else {
            return `(${inner(term.func)})(${inner(term.arg)})`;
        }
    };
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
                    shift(1, 0, replacement),
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
                return betaReduce(substitute(0, shift(1, 0, arg), func.body));
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
};

// TESTS

export {};
