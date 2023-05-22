import { lam } from "../classicNamedCalculus";

const { app, Var, abs } = lam;

export const lambdaTestJSON = [
    // index 0
    {
        syntax: "application",
        func: {
            syntax: "abstraction",
            boundVar: "x",
            body: {
                syntax: "abstraction",
                boundVar: "y",
                body: {
                    syntax: "application",
                    func: {
                        syntax: "variable",
                        name: "x",
                        stringExpression: "x",
                    },
                    arg: {
                        syntax: "variable",
                        name: "y",
                        stringExpression: "y",
                    },
                    stringExpression: "(x)(y)",
                },
                stringExpression: "λ(y).[(x)(y)]",
            },
            stringExpression: "λ(x).[λ(y).[(x)(y)]]",
        },
        arg: {
            syntax: "abstraction",
            boundVar: "z",
            body: {
                syntax: "variable",
                name: "z",
                stringExpression: "z",
            },
            stringExpression: "λ(z).[z]",
        },
        stringExpression: "(λ(x).[λ(y).[(x)(y)]])(λ(z).[z])",
    },
    // index 1
    {
        syntax: "application",
        func: {
            syntax: "abstraction",
            boundVar: "x",
            body: {
                syntax: "application",
                func: {
                    syntax: "variable",
                    name: "x",
                    stringExpression: "x",
                },
                arg: {
                    syntax: "variable",
                    name: "x",
                    stringExpression: "x",
                },
                stringExpression: "(x)(x)",
            },
            stringExpression: "λ(x).[(x)(x)]",
        },
        arg: {
            syntax: "abstraction",
            boundVar: "x",
            body: {
                syntax: "variable",
                name: "x",
                stringExpression: "x",
            },
            stringExpression: "λ(x).[x]",
        },
        stringExpression: "(λ(x).[(x)(x)])(λ(x).[x])",
    },
    // index 2
    {
        syntax: "application",
        func: {
            syntax: "abstraction",
            boundVar: "x",
            body: {
                syntax: "application",
                func: {
                    syntax: "variable",
                    name: "x",
                    stringExpression: "x",
                },
                arg: {
                    syntax: "variable",
                    name: "y",
                    stringExpression: "y",
                },
                stringExpression: "(x)(y)",
            },
            stringExpression: "λ(x).[(x)(y)]",
        },
        arg: {
            syntax: "abstraction",
            boundVar: "y",
            body: {
                syntax: "variable",
                name: "y",
                stringExpression: "y",
            },
            stringExpression: "λ(y).[y]",
        },
        stringExpression: "(λ(x).[(x)(y)])(λ(y).[y])",
    },
];

export const testLambdaArr = [
    // index 0
    app(
        abs(Var("x"), abs(Var("y"), app(Var("x"), Var("y")))),
        abs(Var("z"), Var("z"))
    ),
    // index 1
    app(abs(Var("x"), app(Var("x"), Var("x"))), abs(Var("x"), Var("x"))),
    // index 2
    app(abs(Var("x"), app(Var("x"), Var("y"))), abs(Var("y"), Var("y"))),
];
