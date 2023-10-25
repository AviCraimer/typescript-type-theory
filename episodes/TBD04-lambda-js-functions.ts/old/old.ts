type SimpleType = "Ind" | "Bool" | [domain: SimpleType, codomain: SimpleType];

const typeEq = (t1: SimpleType, t2: SimpleType): Boolean => {
    if (typeof t1 === "string" && typeof t2 === "string") {
        return t1 === t2;
    } else if (Array.isArray(t1) && Array.isArray(t2)) {
        return typeEq(t1[0], t2[0]) && typeEq(t1[1], t2[1]);
    } else {
        return false;
    }
};



type Tree<T> = {
    value: T
    parent: Tree<T> | 'root'
    children: Tree<T>[]
    map: (f:<T, S>(a:T) => S) => (<S>(a: Tree<T>) => Tree<S>)
}


const treeMap = function <T,S>(f:(a:T) => S) : ((tree: Tree<T>) => Tree<S>) {
    return (tree) => {
        let root : typeof tree.parent = tree
        while (tree.parent !== "root") {
            root = tree.parent
        }
        const inner = (current: Tree<T>) => {
            const newValue = f(current.value)
            const newTree: Tree<any> = {...current, value: newValue}

            newTree.children = current.children.map(inner)
            return newTree as Tree<S>
        }
        return inner(root)
    }
 }

type LambdaData = {
    type: SimpleType;
    // betaReducer(this: LambdaData, v: Syntax['Var'], replacement: Lambda):void; // The betaReducer transforms the object itself
    syntax: "Var" | "App" | "Abs";
    context: Context;
};

type Syntax = {
    Var: Omit<LambdaData, "context"> & { syntax: "Var" };
    App: LambdaData & { syntax: "App" };
    Abs: LambdaData & { syntax: "Abs" };
};

type ContextElement = [
    variable: Syntax["Var"],
    binder: Syntax["Abs"] | undefined
];

type Context = ContextElement[];

type Var<ST extends SimpleType> = LambdaData & {
    type: ST;
    reducer (this: Var<ST>, match: Syntax['Var'], replacement: Lambda ): void
    syntax: "Var";
    context: Context & [[{ type: ST }, unknown]];
    name: string;
};

//Free Variable Constructor
const freeVar = <ST extends SimpleType>(
    type: ST,
    name: string = "x"
): Var<ST> => {
    type VarBase = Omit<Var<ST>, "context">;

    const varExample: VarBase = {
        name,
        type: type,
        betaReducer(match, replacement) {


            if (this === match) {
                const thisVar = this as any
                delete thisVar.name
            }

        },
        syntax: "Var",
    };

    const context: Context & [[{ type: ST }, unknown]] = [
        [varExample, undefined],
    ];

    return { ...varExample, context };
};


type Abs<
    Dom extends SimpleType,
    Cod extends SimpleType,
> = LambdaData & {
    type: [Dom, Cod];
    syntax: "Abs";
    betaReducer (x: Dom): Cod;
    context: Context;
};




const abstraction = <
    Dom extends SimpleType,
    Cod extends SimpleType,
>(expr: Lambda & {type: Cod}, variable: Var<Dom>): Abs<Dom, Cod> => {

    const maybeContextEl = expr.context.find((contextEl) => contextEl[0] ===  variable && contextEl[1] === undefined)

    const newBinder = {} as Abs<Dom, Cod>
    if (maybeContextEl) {
        // Note this will update every occurance of the context element since they all use the same array object
        maybeContextEl[1] = newBinder
    }


    const sdfdf : <Abs<Dom, Cod>> =  {
        type: [variable.type, expr.type],
        syntax: "Abs",
        betaReducer: () =>
        context: expr.context
    }

}

type App<
    Dom extends SimpleType,
    Cod extends SimpleType,
> = LambdaData & {
    type: Cod;
    syntax: "App";
    betaReducer: (x: Dom) => Cod;
    context: Context;
};

const apply = <
    Dom extends SimpleType,
    Cod extends SimpleType,
>(abs: Abs<Dom, Cod>, arg: Cod ) :  App<Dom, Cod> => {
    const appBase = {
        type: abs.type[1],
        syntax: "App",
        betaReducer: (arg: Dom) => abs.betaReducer(arg)
    }

    //Make the context

}

console.log(freeVar("Ind", "x"));

type Lambda = Abs<any, any> | App<any, any> | Var<any>;