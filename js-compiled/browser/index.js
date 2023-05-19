"use strict";
(() => {
  // episodes/TBD01-lambda-substitution/classicNamedCalculus.ts
  var isVar = (x) => {
    if (x.meta.syntax === "variable") {
      return true;
    } else {
      return false;
    }
  };
  var isAbs = (x) => {
    if (x.meta.syntax === "abstraction") {
      return true;
    } else {
      return false;
    }
  };
  var isApp = (x) => {
    if (x.meta.syntax === "application") {
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
      meta: { syntax: "variable" },
      name,
      children: []
    };
  };
  var deduplicateVariables = (vars) => {
    const obj = {};
    vars.forEach((v2) => obj[v2.name] = v2);
    return Object.values(obj);
  };
  var excludeVariables = (varList, varsToRemove) => {
    const toRemoveNames = /* @__PURE__ */ new Set();
    varsToRemove.forEach((v2) => toRemoveNames.add(v2.name));
    return varList.filter((v2) => !toRemoveNames.has(v2.name));
  };
  var getChildFreeVars = (child) => {
    if (isVar(child)) {
      return [child];
    } else if (isAbs(child)) {
      const { boundVar } = child;
      return excludeVariables(child.children[0].childFreeVars, [boundVar]);
    } else if (isApp(child)) {
      const funcVars = child.children[0].childFreeVars;
      const argVars = child.children[1].childFreeVars;
      return deduplicateVariables([...funcVars, ...argVars]);
    }
    let x = child;
    return child;
  };
  var abstraction = (variable, lambda) => {
    return {
      meta: { syntax: "abstraction" },
      boundVar: variable,
      children: [
        {
          childExpr: lambda,
          childFreeVars: getChildFreeVars(lambda)
        }
      ]
    };
  };
  var application = (first, second) => {
    return {
      meta: { syntax: "application" },
      children: [
        {
          childExpr: first,
          childFreeVars: getChildFreeVars(first)
        },
        {
          childExpr: second,
          childFreeVars: getChildFreeVars(second)
        }
      ]
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
      let x = lambda2;
      return lambda2;
    };
    return inner(lambda);
  };
  var lambdaToStringMethods = {
    variable: (variable) => {
      return variable.name;
    },
    abstraction: (abs2, inner) => {
      const body = abs2.children[0].childExpr;
      const bodyStr = inner(body);
      return `\u03BB(${inner(abs2.boundVar)}).[${bodyStr}]`;
    },
    application: (app2, inner) => {
      return `(${inner(app2.children[0].childExpr)})(${inner(
        app2.children[1].childExpr
      )})`;
    }
  };
  var lambdaToString = mkLambdaFn(lambdaToStringMethods);
  var printExpr = (lambdaExp) => {
    console.log(lambdaToString(lambdaExp));
  };
  var appBranches = (app2) => {
    return [app2.children[0].childExpr, app2.children[1].childExpr];
  };
  var varEq = (x, y) => {
    return x.name === y.name;
  };
  var varIn = (x, vars) => {
    const varNames = new Set(vars.map((v2) => v2.name));
    return varNames.has(x.name);
  };
  var filterVarsByName = (vars, name) => {
    name = name.replace(regexEndsWithVarNumber, "");
    let toKeep = /* @__PURE__ */ new Set();
    vars.forEach(
      (x) => (x.name === name || x.name.startsWith(name) && regexEndsWithVarNumber.test(x.name)) && toKeep.add(x.name === name ? Var(`${name}_0`, true) : x)
    );
    return [...toKeep];
  };
  var getFreshVar = (vars, name) => {
    name = name.replace(regexEndsWithVarNumber, "");
    const current = filterVarsByName(vars, name);
    const currentNumbers = current.map((x) => Number(x.name.slice(x.name.lastIndexOf("_") + 1))).sort();
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
  var substitutionMethods = {
    variable: (variable, _, replacementExpr, varToReplace) => {
      return varEq(variable, varToReplace) ? replacementExpr : variable;
    },
    abstraction: (abs2, inner, replacementExpr, varToReplace) => {
      const { boundVar } = abs2;
      let replacementChildFreeVars = replacementExpr.children.map((c) => c.childFreeVars).reduce((a, b) => [...a, ...b], []);
      const body = abs2.children[0].childExpr;
      let freshBody = body;
      let freshVar = abs2.boundVar;
      if (varEq(boundVar, varToReplace)) {
        return abs2;
      } else if (varIn(boundVar, replacementChildFreeVars)) {
        freshVar = getFreshVar(replacementChildFreeVars, boundVar.name);
        freshBody = inner(body, freshVar, boundVar);
      }
      const replacedBody = inner(freshBody, replacementExpr, varToReplace);
      return abstraction(freshVar, replacedBody);
    },
    application: (app2, inner, replacementExpr, varToReplace) => {
      const [func, arg] = appBranches(app2);
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
      const body1 = lambda1.children[0].childExpr;
      const body2 = lambda2.children[0].childExpr;
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
    const [func, arg] = appBranches(redex);
    const body = func.children[0].childExpr;
    return substitute(body, arg, func.boundVar);
  };
  var betaReduce = (lambda, maxSteps = 20) => {
    const tracker = { hasBeenReduced: false, count: 0 };
    const inner = (lambda2) => {
      if (isRedex(lambda2)) {
        tracker.hasBeenReduced = true;
        return betaStep(lambda2);
      } else if (isApp(lambda2)) {
        const [func, arg] = appBranches(lambda2);
        return application(inner(func), inner(arg));
      } else if (isAbs(lambda2)) {
        const body = lambda2.children[0].childExpr;
        return abstraction(lambda2.boundVar, inner(body));
      } else if (isVar(lambda2)) {
        return lambda2;
      }
      let x = lambda2;
      return x;
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
    lambdas.reduce((a, b) => {
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
      vars = v(variables);
    } else if (Array.isArray(variables)) {
      vars = variables;
    } else {
      vars = [variables];
    }
    visualOrder && vars.reverse();
    let result = expression;
    vars.forEach((x) => {
      result = abstraction(x, result);
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
    lambdaToString
  };
})();
//# sourceMappingURL=index.js.map
