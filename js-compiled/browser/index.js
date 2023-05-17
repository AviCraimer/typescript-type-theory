"use strict";
(() => {
  // episodes/e02-substitution/classicNamedCalculus.ts
  var isVar = (x2) => {
    if (x2.meta.syntax === "variable") {
      return true;
    } else {
      return false;
    }
  };
  var isAbs = (x2) => {
    if (x2.meta.syntax === "abstraction") {
      return true;
    } else {
      return false;
    }
  };
  var isApp = (x2) => {
    if (x2.meta.syntax === "application") {
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
    vars.forEach((v) => obj[v.name] = v);
    return Object.values(obj);
  };
  var excludeVariables = (varList, varsToRemove) => {
    const toRemoveNames = /* @__PURE__ */ new Set();
    varsToRemove.forEach((v) => toRemoveNames.add(v.name));
    return varList.filter((v) => !toRemoveNames.has(v.name));
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
    let x2 = child;
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
      let x2 = lambda2;
      return lambda2;
    };
    return inner(lambda);
  };
  var lambdaToStringMethods = {
    variable: (variable) => {
      return variable.name;
    },
    abstraction: (abs, inner) => {
      const body = abs.children[0].childExpr;
      const bodyStr = inner(body);
      return `\u03BB(${inner(abs.boundVar)}).[${bodyStr}]`;
    },
    application: (app, inner) => {
      return `(${inner(app.children[0].childExpr)})(${inner(
        app.children[1].childExpr
      )})`;
    }
  };
  var lambdaToString = mkLambdaFn(lambdaToStringMethods);
  var printExpr = (lambdaExp) => {
    console.log(lambdaToString(lambdaExp));
  };
  var appBranches = (app) => {
    return [app.children[0].childExpr, app.children[1].childExpr];
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
  var substitutionMethods = {
    variable: (variable, _, replacementExpr, varToReplace) => {
      return varEq(variable, varToReplace) ? replacementExpr : variable;
    },
    abstraction: (abs, inner, replacementExpr, varToReplace) => {
      const { boundVar } = abs;
      let replacementChildFreeVars = replacementExpr.children.map((c) => c.childFreeVars).reduce((a, b) => [...a, ...b], []);
      const body = abs.children[0].childExpr;
      let freshBody = body;
      let freshVar = abs.boundVar;
      if (varEq(boundVar, varToReplace)) {
        return abs;
      } else if (varIn(boundVar, replacementChildFreeVars)) {
        freshVar = getFreshVar(replacementChildFreeVars, boundVar.name);
        freshBody = inner(body, freshVar, boundVar);
      }
      const replacedBody = inner(freshBody, replacementExpr, varToReplace);
      return abstraction(freshVar, replacedBody);
    },
    application: (app, inner, replacementExpr, varToReplace) => {
      const [func, arg] = appBranches(app);
      return application(
        inner(func, replacementExpr, varToReplace),
        inner(arg, replacementExpr, varToReplace)
      );
    }
  };
  var substitute = mkLambdaFn(substitutionMethods);

  // episodes/e02-substitution/index.ts
  console.log("\n".repeat(6));
  var x = Var("x");
  var x1 = Var("x_1", true);
  var x134 = Var("x__134", true);
  var y = Var("y");
  var z = Var("z");
  var w = Var("w");
  var xy = application(x, y);
  var absX = abstraction(x, xy);
  var xz = application(x, z);
  var xyxz = application(xy, xz);
  var xyxzAbs = abstraction(x, xyxz);
  var xyxzAbsAbs = abstraction(x, xyxzAbs);
  printExpr(xyxzAbsAbs);
  var sub1 = substitute(xyxzAbsAbs, xyxz, y);
  printExpr(sub1);
})();
//# sourceMappingURL=index.js.map
