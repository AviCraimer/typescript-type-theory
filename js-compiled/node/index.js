var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// episodes/e03-de-bruijn-numbering/index.ts
__export(exports, {
  abstract: () => abstract,
  apply: () => apply,
  print: () => print,
  substitution: () => substitution
});
console.log("De Bruijn Numbering");
var apply = (...args) => {
  if (args.length < 2) {
    throw new Error("Cannot apply with fewer than two lambda arguments");
  }
  const applyOnce = (func, argument) => {
    return {
      role: "Application",
      func,
      argument,
      toString
    };
  };
  let current = applyOnce(args[0], args[1]);
  args.forEach((arg, i) => {
    if (i > 1) {
      current = applyOnce(current, arg);
    }
  });
  return current;
};
function toString() {
  if (this.role === "Abstraction") {
    const { parameter, body } = this;
    return `[ \u03BB${parameter} . ${body.toString()} ]`;
  } else if (this.role === "Application") {
    const { func, argument } = this;
    return `${func.toString()} (${argument.toString()})`;
  }
  const nothing = this;
  return nothing;
}
var substitution = (expression, replace, substitute) => {
  if (typeof expression === "string") {
    if (expression === replace) {
      if (!isBound(replace) && !isBound(substitute)) {
        throw new Error("You can only replace a free variable with a bound variable.");
      }
      return substitute;
    } else {
      return expression;
    }
  } else if (expression.role === "Abstraction") {
    const { parameter, body } = expression;
    return __spreadProps(__spreadValues({}, expression), {
      parameter: isBound(substitute) && replace === expression.parameter ? substitute : expression.parameter,
      body: substitution(body, replace, substitute)
    });
  } else if (expression.role === "Application") {
    const { func, argument } = expression;
    return __spreadProps(__spreadValues({}, expression), {
      func: substitution(func, replace, substitute),
      argument: substitution(argument, replace, substitute)
    });
  }
  const nothing = expression;
  return nothing;
};
var abstract = (variable, expression) => {
  const parameter = Var(variable, false);
  const body = substitution(expression, variable, parameter);
  return {
    role: "Abstraction",
    parameter,
    body,
    toString
  };
};
var print = (...objs) => {
  objs.forEach((obj) => console.log(obj.toString()));
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  abstract,
  apply,
  print,
  substitution
});
//# sourceMappingURL=index.js.map
