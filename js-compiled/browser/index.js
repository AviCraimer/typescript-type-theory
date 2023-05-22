"use strict";
(() => {
  // episodes/TBD01-lambda-substitution/classicNamedCalculus.ts
  var isVar = (x2) => {
    if (x2.syntax === "variable") {
      return true;
    } else {
      return false;
    }
  };
  var isAbs = (x2) => {
    if (x2.syntax === "abstraction") {
      return true;
    } else {
      return false;
    }
  };
  var isApp = (x2) => {
    if (x2.syntax === "application") {
      return true;
    } else {
      return false;
    }
  };
  var regexEndsWithVarNumber = /_\d+$/;
  var Var = (name, numberingAllowed = false) => {
    if (!numberingAllowed && regexEndsWithVarNumber.test(name) && name.endsWith("_")) {
      throw Error(
        `You tried to create a new variable with a disallowed name: ${name}`
      );
    }
    return {
      syntax: "variable",
      name
    };
  };
  var deduplicateVariables = (vars) => {
    const obj = {};
    vars.forEach((v) => obj[v.name] = v);
    return Object.values(obj);
  };
  var excludeVariables = (varList, varsToRemove) => {
    const toRemoveNames = /* @__PURE__ */ new Set();
    varsToRemove.forEach((v) => toRemoveNames.add(v.name));
    return varList.filter((v) => !toRemoveNames.has(v.name));
  };
  var getFreeVars = (lambda) => {
    if (isVar(lambda)) {
      return [lambda];
    } else if (isAbs(lambda)) {
      const { boundVar } = lambda;
      const body = lambda.body;
      return excludeVariables(getFreeVars(body), [boundVar]);
    } else if (isApp(lambda)) {
      const [func, arg] = appBranches(lambda);
      return deduplicateVariables([
        ...getFreeVars(func),
        ...getFreeVars(arg)
      ]);
    }
    let x2 = lambda;
    return lambda;
  };
  var abstraction = (variable, lambda) => {
    return {
      syntax: "abstraction",
      boundVar: variable,
      body: lambda
    };
  };
  var application = (first, second) => {
    return {
      syntax: "application",
      func: first,
      arg: second
    };
  };
  var mkLambdaFn = (fns) => (lambda, ...args) => {
    const inner = (lambda2, ...innerArgs) => {
      const extraArgs = innerArgs.length ? innerArgs : args;
      if (isVar(lambda2)) {
        return fns.variable(lambda2, inner, ...extraArgs);
      } else if (isApp(lambda2)) {
        return fns.application(lambda2, inner, ...extraArgs);
      } else if (isAbs(lambda2)) {
        return fns.abstraction(lambda2, inner, ...extraArgs);
      }
      let x2 = lambda2;
      return lambda2;
    };
    return inner(lambda);
  };
  var lambdaToStringMethods = {
    variable: (variable) => {
      return variable.name;
    },
    abstraction: (abs3, inner) => {
      const body = abs3.body;
      const bodyStr = inner(body);
      return `\u03BB(${inner(abs3.boundVar)}).[${bodyStr}]`;
    },
    application: (app3, inner) => {
      return `(${inner(app3.func)})(${inner(app3.arg)})`;
    }
  };
  var lambdaToString = mkLambdaFn(lambdaToStringMethods);
  var printExpr = (lambdaExp) => {
    console.log(lambdaToString(lambdaExp));
  };
  var appBranches = (app3) => {
    return [app3.func, app3.arg];
  };
  var varEq = (x2, y2) => {
    return x2.name === y2.name;
  };
  var varIn = (x2, vars) => {
    const varNames = new Set(vars.map((v) => v.name));
    return varNames.has(x2.name);
  };
  var filterVarsByName = (vars, name) => {
    name = name.replace(regexEndsWithVarNumber, "");
    let toKeep = /* @__PURE__ */ new Set();
    vars.forEach(
      (x2) => (x2.name === name || x2.name.startsWith(name) && regexEndsWithVarNumber.test(x2.name)) && toKeep.add(x2.name === name ? Var(`${name}_0`, true) : x2)
    );
    return [...toKeep];
  };
  var getFreshVar = (vars, name) => {
    name = name.replace(regexEndsWithVarNumber, "");
    const current = filterVarsByName(vars, name);
    const currentNumbers = current.map((x2) => Number(x2.name.slice(x2.name.lastIndexOf("_") + 1))).sort();
    let firstGap;
    let prevNum = 0;
    for (let index = 0; index < currentNumbers.length; index++) {
      const num = currentNumbers[index];
      if (num - prevNum > 1) {
        firstGap = prevNum + 1;
        break;
      }
      prevNum = num;
    }
    firstGap = firstGap != null ? firstGap : prevNum + 1;
    return Var(name + "_" + firstGap, true);
  };
  var getChildNodes = mkLambdaFn({
    variable() {
      return [];
    },
    abstraction(abs3) {
      return [abs3.body];
    },
    application(app3) {
      return [app3.func, app3.arg];
    }
  });
  var substitutionMethods = {
    variable: (variable, _, replacementExpr, varToReplace) => {
      return varEq(variable, varToReplace) ? replacementExpr : variable;
    },
    abstraction: (abs3, inner, replacementExpr, varToReplace) => {
      const { boundVar } = abs3;
      let replacementChildFreeVars = [
        replacementExpr,
        ...getChildNodes(replacementExpr)
      ].map((c) => getFreeVars(c)).reduce((a, b) => [...a, ...b], []);
      const body = abs3.body;
      let freshBody = body;
      let freshVar = abs3.boundVar;
      if (varEq(boundVar, varToReplace)) {
        return abs3;
      } else if (varIn(boundVar, replacementChildFreeVars)) {
        freshVar = getFreshVar(replacementChildFreeVars, boundVar.name);
        freshBody = inner(body, freshVar, boundVar);
      }
      const replacedBody = inner(freshBody, replacementExpr, varToReplace);
      return abstraction(freshVar, replacedBody);
    },
    application: (app3, inner, replacementExpr, varToReplace) => {
      const [func, arg] = appBranches(app3);
      return application(
        inner(func, replacementExpr, varToReplace),
        inner(arg, replacementExpr, varToReplace)
      );
    }
  };
  var substitute = mkLambdaFn(substitutionMethods);
  var alphaEq = (lambda1, lambda2, boundVarCount = 0) => {
    if (isAbs(lambda1) && isAbs(lambda2)) {
      const canonicalBoundVar = Var("" + boundVarCount, true);
      const body1 = lambda1.body;
      const body2 = lambda2.body;
      const newBody1 = substitute(body1, canonicalBoundVar, lambda1.boundVar);
      const newBody2 = substitute(body2, canonicalBoundVar, lambda2.boundVar);
      console.log("1.");
      printExpr(lambda1);
      printExpr(newBody1);
      console.log(2);
      printExpr(lambda2);
      printExpr(newBody2);
      return alphaEq(newBody1, newBody2, boundVarCount + 1);
    } else if (isApp(lambda1) && isApp(lambda2)) {
      const [func1, arg1] = appBranches(lambda1);
      const [func2, arg2] = appBranches(lambda2);
      return alphaEq(func1, func2, boundVarCount) && alphaEq(arg1, arg2, boundVarCount);
    } else if (isVar(lambda1) && isVar(lambda2)) {
      return lambda1.name === lambda2.name;
    } else {
      return false;
    }
  };
  var isRedex = (lambda) => {
    if (isApp(lambda)) {
      const [func, arg] = appBranches(lambda);
      if (isAbs(func)) {
        return true;
      }
    }
    return false;
  };
  var betaStep = (redex) => {
    const { func, arg } = redex;
    const body = func.body;
    return substitute(body, arg, func.boundVar);
  };
  var betaReduce = (lambda, maxSteps = 20) => {
    const tracker = { hasBeenReduced: false, count: 0 };
    const inner = (lambda2) => {
      if (isRedex(lambda2)) {
        console.log("redex:        ", lambdaToString(lambda2));
        tracker.hasBeenReduced = true;
        const reduced = betaStep(lambda2);
        console.log("reduced redex:", lambdaToString(reduced));
        return betaStep(lambda2);
      } else if (isApp(lambda2)) {
        const [func, arg] = appBranches(lambda2);
        return application(inner(func), inner(arg));
      } else if (isAbs(lambda2)) {
        const body = lambda2.body;
        return abstraction(lambda2.boundVar, inner(body));
      } else if (isVar(lambda2)) {
        return lambda2;
      }
      let x2 = lambda2;
      return x2;
    };
    let current = lambda;
    while (tracker.count === 0 || tracker.hasBeenReduced === true && tracker.count < maxSteps) {
      tracker.hasBeenReduced = false;
      current = inner(current);
      tracker.count = tracker.count + 1;
      if (tracker.count === maxSteps) {
        console.log("max steps reached");
      }
    }
    return current;
  };
  var app = (...lambdas) => {
    return lambdas.reduce((a, b) => {
      return application(a, b);
    });
  };
  function var_(names, numberingAllowed = false) {
    if (typeof names === "string") {
      return Var(names, numberingAllowed);
    }
    if (names.length === 0) {
      throw new Error("Empty array passed to variable constructor.");
    } else {
      const variables = names.map(
        (name) => Var(name, numberingAllowed)
      );
      return [...new Set(variables)];
    }
  }
  function abs(variables, expression, visualOrder = true) {
    let vars;
    if (typeof variables === "string") {
      vars = [Var(variables)];
    } else if (Array.isArray(variables) && variables.length === 0) {
      return expression;
    } else if (Array.isArray(variables) && typeof variables[0] === "string") {
      vars = var_(variables);
    } else if (Array.isArray(variables)) {
      vars = variables;
    } else {
      vars = [variables];
    }
    visualOrder && vars.reverse();
    let result = expression;
    vars.forEach((x2) => {
      result = abstraction(x2, result);
    });
    return result;
  }
  var lam = {
    Var: var_,
    abs,
    app,
    alphaEq,
    betaReduce,
    isVar,
    isAbs,
    isApp,
    lambdaToString,
    printExpr,
    mkLambdaFn
  };

  // episodes/TBD01-lambda-substitution/test/variableCapture.test.ts
  var { Var: Var2, app: app2, abs: abs2, printExpr: printExpr2, betaReduce: betaReduce2 } = lam;
  var z = Var2("z");
  var x = Var2("x");
  var y = Var2("y");
  var w = Var2("w");
  var xy = app2(x, y);
  var absX = abs2(x, xy);
  var xz = app2(x, z);
  var xw = app2(x, w);
  var xyxz = app2(xy, xz);
  var xyxzAbs = abs2(x, xyxz);
  var xyxzAbsAbs = abs2(y, xyxzAbs);
  var toReduce1 = app2(absX, w);
  var toReduce2 = app2(xyxzAbsAbs, x);
  printExpr2(toReduce2);
  var reduced2 = betaReduce2(toReduce2);
  printExpr2(reduced2);
  console.log("\n\n");
  var toReduce3 = app2(xyxzAbsAbs, abs2(w, app2(x, y)), x);
  printExpr2(toReduce3);
  printExpr2(betaReduce2(toReduce3));
})();
//# sourceMappingURL=index.js.map
