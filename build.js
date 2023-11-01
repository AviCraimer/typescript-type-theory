const path = require("path");
const esbuild = require("esbuild");
const glob = require("glob");
const watch = require("node-watch");
const {
    readdirSync,
    removeSync,
    copySync,
    writeFileSync,
} = require("fs-extra");
const sass = require("sass");

// const nodemon = require("nodemon");

const srcDir = path.join(__dirname, "episodes");
const distDir = path.join(__dirname, "js-compiled");
let emoji = "😉";

const watchFlag = process.argv.find((el) => el === "-w");
const episode = process.argv[process.argv.length - 1]; // Episode is the last argument

// console.log(inPath);
let entryPoints = [];
// if (inPath) {

const episodeDirNames = readdirSync(path.join(__dirname, "episodes"));

const lookupEpisodeDir = {};
episodeDirNames.forEach((dir) => {
    lookupEpisodeDir[dir.split("-")[0]] = dir;
});

const entryPath = path.join(
    __dirname,
    "episodes",
    lookupEpisodeDir[episode],
    "index.ts"
);

if (!entryPath) {
    throw new Error(episode + " Is not a valid episode argument");
}

// nodemon({
//     script: path.join(distDir, "node", "index.js"),
//     ext: "js json",
//     ignore: ["."],
//     verbose: true,
// });

// nodemon
//     .on("start", function () {
//         console.log("Node app has started");
//     })
//     .on("quit", function () {
//         console.log("App has quit");
//         process.exit();
//     })
//     .on("restart", function (files) {
//         console.log("Node app restarted due to: ");
//     });

function build(evt, changePath) {
    console.log({ evt, changePath });

    removeSync(distDir);

    // //HTML
    // copySync(path.join(srcDir, "pages"), path.join(distDir, "pages"));
    // console.log("HTML copied");
    // ** End HTML

    // //Sass
    // const cssResult = sass.renderSync({
    //     file: path.join(srcDir, "style", "index.scss"),
    //     outFile: path.join(distDir, "style.css"),
    //     sourceMap: true,
    // });
    // writeFileSync(path.join(distDir, "style.css"), cssResult.css);
    // writeFileSync(path.join(distDir, "style.css.map"), cssResult.map);
    // console.log("Styles compiled");
    //** End Sass */

    //Restart the node app only if node-script files have changed.
    // if (evt === "update" && changePath?.includes("js-compiled")) {
    //     nodemon.restart();
    //     console.log(changePath);
    // }

    //Bundle browser scripts
    const browserPromise = esbuild
        .build({
            entryPoints: [entryPath],
            platform: "browser",
            outdir: "./js-compiled/browser",
            bundle: true,
            watch: false,
            sourcemap: true,
            target: ["es6"],
        })

        .catch((e) => console.error(e.message))
        .then((r) => true);
    //Compile Node Scripts
    const nodePromise = esbuild
        .build({
            entryPoints: [entryPath],
            platform: "node",
            outdir: "./js-compiled/node",
            bundle: true,
            watch: false,
            sourcemap: true,
            format: "cjs",
            target: ["node14"],
        })
        .catch((e) => console.error(e.message))
        .then((r) => true);

    Promise.all([browserPromise, nodePromise]).then((r) => {
        console.log("\nScripts compiled", emoji);
        emoji === "😉" ? (emoji = "👌") : (emoji = "😉");
    });
}

// Runtime
build();

if (watchFlag) {
    watch(
        path.join(__dirname, "episodes"),
        { recursive: true },
        function (evt, changePath) {
            build(evt, changePath);
        }
    );
}
