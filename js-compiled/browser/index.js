"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };

  // episodes/TBD03-linear-logic-relations/syntaxTree.ts
  var unaryOps = {
    neg: "\xAC",
    converse: "\u2AEF",
    linNeg: "~"
  };
  var binaryOps = {
    par: "\u214B",
    comp: "\u25B8",
    and: "&",
    or: "\u2228",
    linImp: "\u22B8",
    linImpLeft: "\u27DC",
    imp: "\u2283"
  };
  var allOps = __spreadValues(__spreadValues({}, unaryOps), binaryOps);
  var atom = (name, converse) => {
    return {
      type: "atomic relation",
      name,
      converseName: converse
    };
  };
  var isOp = (op) => (relation) => {
    return "children" in relation && relation.operation === op;
  };
  var opCheck = {
    par: isOp(allOps.par),
    comp: isOp(allOps.comp),
    and: isOp(allOps.and),
    or: isOp(allOps.or),
    linImp: isOp(allOps.linImp),
    linImpLeft: isOp(allOps.linImpLeft),
    imp: isOp(allOps.imp),
    neg: isOp(allOps.neg),
    converse: isOp(allOps.converse),
    linNeg: isOp(allOps.linNeg)
  };
  var opCheckLevel2 = (outer, inner) => (rel) => {
    if (isAtomic(rel)) {
      return false;
    }
    return opCheck[outer](rel) && opCheck[inner](rel.children[0]);
  };
  var opCheckLevel3 = (outer, inner1, inner2) => (rel) => {
    if (isAtomic(rel)) {
      return false;
    }
    return opCheck[outer](rel) && opCheck[inner1](rel.children[0]) && opCheck[inner2](rel.children[0].children[0]);
  };
  var isAtomic = (relation) => {
    if (relation.type === "atomic relation") {
      return true;
    } else {
      return false;
    }
  };
  var applyUnary = (op) => (relation) => {
    return {
      type: "composite",
      operation: op,
      children: [relation]
    };
  };
  var applyBinary = (op) => (...relations) => {
    return {
      type: "composite",
      operation: op,
      children: [...relations]
    };
  };
  var opApp = {
    par: applyBinary(allOps.par),
    comp: applyBinary(allOps.comp),
    and: applyBinary(allOps.and),
    or: applyBinary(allOps.or),
    linImp: applyBinary(allOps.linImp),
    linImpLeft: applyBinary(allOps.linImpLeft),
    imp: applyBinary(allOps.imp),
    neg: applyUnary(allOps.neg),
    converse: applyUnary(allOps.converse),
    linNeg: applyUnary(allOps.linNeg)
  };

  // episodes/TBD03-linear-logic-relations/examples/operationChecking.ts
  var R = atom("R", "R\u030C");
  var S = atom("S", "S\u030C");
  var T = atom("T", "T\u030C");
  var negConverseR = opApp.neg(opApp.converse(R));
  var converseNegR = opApp.converse(opApp.neg(R));
  var normalForm = opApp.linNeg(R);
  var converseNegCheck = opCheckLevel2("converse", "neg");
  var negConverseCheck = opCheckLevel2("neg", "converse");
  console.log(converseNegCheck(converseNegR));
  console.log(negConverseCheck(converseNegR));
  console.log(negConverseCheck(negConverseR));
  console.log(converseNegCheck(negConverseR));
  console.log(converseNegCheck(R));
  var converseNegCompCheck = opCheckLevel3("converse", "neg", "comp");
  var example1 = opApp.converse(opApp.neg(opApp.comp(R, S)));
  console.log(converseNegCompCheck(example1));
  console.log(converseNegCompCheck(converseNegR));
  console.log(converseNegCompCheck(S));
})();
//# sourceMappingURL=index.js.map
