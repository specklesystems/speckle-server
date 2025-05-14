var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var check = function (it) {
  return it && it.Math == Math && it;
};

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global$H =
  // eslint-disable-next-line es-x/no-global-this -- safe
  check(typeof globalThis == 'object' && globalThis) ||
  check(typeof window == 'object' && window) ||
  // eslint-disable-next-line no-restricted-globals -- safe
  check(typeof self == 'object' && self) ||
  check(typeof commonjsGlobal == 'object' && commonjsGlobal) ||
  // eslint-disable-next-line no-new-func -- fallback
  (function () { return this; })() || Function('return this')();

var objectGetOwnPropertyDescriptor = {};

var fails$y = function (exec) {
  try {
    return !!exec();
  } catch (error) {
    return true;
  }
};

var fails$x = fails$y;

// Detect IE8's incomplete defineProperty implementation
var descriptors = !fails$x(function () {
  // eslint-disable-next-line es-x/no-object-defineproperty -- required for testing
  return Object.defineProperty({}, 1, { get: function () { return 7; } })[1] != 7;
});

var fails$w = fails$y;

var functionBindNative = !fails$w(function () {
  // eslint-disable-next-line es-x/no-function-prototype-bind -- safe
  var test = (function () { /* empty */ }).bind();
  // eslint-disable-next-line no-prototype-builtins -- safe
  return typeof test != 'function' || test.hasOwnProperty('prototype');
});

var NATIVE_BIND$3 = functionBindNative;

var call$e = Function.prototype.call;

var functionCall = NATIVE_BIND$3 ? call$e.bind(call$e) : function () {
  return call$e.apply(call$e, arguments);
};

var objectPropertyIsEnumerable = {};

var $propertyIsEnumerable$2 = {}.propertyIsEnumerable;
// eslint-disable-next-line es-x/no-object-getownpropertydescriptor -- safe
var getOwnPropertyDescriptor$3 = Object.getOwnPropertyDescriptor;

// Nashorn ~ JDK8 bug
var NASHORN_BUG = getOwnPropertyDescriptor$3 && !$propertyIsEnumerable$2.call({ 1: 2 }, 1);

// `Object.prototype.propertyIsEnumerable` method implementation
// https://tc39.es/ecma262/#sec-object.prototype.propertyisenumerable
objectPropertyIsEnumerable.f = NASHORN_BUG ? function propertyIsEnumerable(V) {
  var descriptor = getOwnPropertyDescriptor$3(this, V);
  return !!descriptor && descriptor.enumerable;
} : $propertyIsEnumerable$2;

var createPropertyDescriptor$5 = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

var NATIVE_BIND$2 = functionBindNative;

var FunctionPrototype$2 = Function.prototype;
var bind$5 = FunctionPrototype$2.bind;
var call$d = FunctionPrototype$2.call;
var uncurryThis$o = NATIVE_BIND$2 && bind$5.bind(call$d, call$d);

var functionUncurryThis = NATIVE_BIND$2 ? function (fn) {
  return fn && uncurryThis$o(fn);
} : function (fn) {
  return fn && function () {
    return call$d.apply(fn, arguments);
  };
};

var uncurryThis$n = functionUncurryThis;

var toString$7 = uncurryThis$n({}.toString);
var stringSlice$1 = uncurryThis$n(''.slice);

var classofRaw$1 = function (it) {
  return stringSlice$1(toString$7(it), 8, -1);
};

var global$G = global$H;
var uncurryThis$m = functionUncurryThis;
var fails$v = fails$y;
var classof$b = classofRaw$1;

var Object$5 = global$G.Object;
var split = uncurryThis$m(''.split);

// fallback for non-array-like ES3 and non-enumerable old V8 strings
var indexedObject = fails$v(function () {
  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
  // eslint-disable-next-line no-prototype-builtins -- safe
  return !Object$5('z').propertyIsEnumerable(0);
}) ? function (it) {
  return classof$b(it) == 'String' ? split(it, '') : Object$5(it);
} : Object$5;

var global$F = global$H;

var TypeError$f = global$F.TypeError;

// `RequireObjectCoercible` abstract operation
// https://tc39.es/ecma262/#sec-requireobjectcoercible
var requireObjectCoercible$3 = function (it) {
  if (it == undefined) throw TypeError$f("Can't call method on " + it);
  return it;
};

// toObject with fallback for non-array-like ES3 strings
var IndexedObject$4 = indexedObject;
var requireObjectCoercible$2 = requireObjectCoercible$3;

var toIndexedObject$d = function (it) {
  return IndexedObject$4(requireObjectCoercible$2(it));
};

// `IsCallable` abstract operation
// https://tc39.es/ecma262/#sec-iscallable
var isCallable$h = function (argument) {
  return typeof argument == 'function';
};

var isCallable$g = isCallable$h;

var isObject$g = function (it) {
  return typeof it == 'object' ? it !== null : isCallable$g(it);
};

var global$E = global$H;
var isCallable$f = isCallable$h;

var aFunction = function (argument) {
  return isCallable$f(argument) ? argument : undefined;
};

var getBuiltIn$9 = function (namespace, method) {
  return arguments.length < 2 ? aFunction(global$E[namespace]) : global$E[namespace] && global$E[namespace][method];
};

var uncurryThis$l = functionUncurryThis;

var objectIsPrototypeOf = uncurryThis$l({}.isPrototypeOf);

var getBuiltIn$8 = getBuiltIn$9;

var engineUserAgent = getBuiltIn$8('navigator', 'userAgent') || '';

var global$D = global$H;
var userAgent$2 = engineUserAgent;

var process = global$D.process;
var Deno = global$D.Deno;
var versions = process && process.versions || Deno && Deno.version;
var v8 = versions && versions.v8;
var match, version;

if (v8) {
  match = v8.split('.');
  // in old Chrome, versions of V8 isn't V8 = Chrome / 10
  // but their correct versions are not interesting for us
  version = match[0] > 0 && match[0] < 4 ? 1 : +(match[0] + match[1]);
}

// BrowserFS NodeJS `process` polyfill incorrectly set `.v8` to `0.0`
// so check `userAgent` even if `.v8` exists, but 0
if (!version && userAgent$2) {
  match = userAgent$2.match(/Edge\/(\d+)/);
  if (!match || match[1] >= 74) {
    match = userAgent$2.match(/Chrome\/(\d+)/);
    if (match) version = +match[1];
  }
}

var engineV8Version = version;

/* eslint-disable es-x/no-symbol -- required for testing */

var V8_VERSION$2 = engineV8Version;
var fails$u = fails$y;

// eslint-disable-next-line es-x/no-object-getownpropertysymbols -- required for testing
var nativeSymbol = !!Object.getOwnPropertySymbols && !fails$u(function () {
  var symbol = Symbol();
  // Chrome 38 Symbol has incorrect toString conversion
  // `get-own-property-symbols` polyfill symbols converted to object are not Symbol instances
  return !String(symbol) || !(Object(symbol) instanceof Symbol) ||
    // Chrome 38-40 symbols are not inherited from DOM collections prototypes to instances
    !Symbol.sham && V8_VERSION$2 && V8_VERSION$2 < 41;
});

/* eslint-disable es-x/no-symbol -- required for testing */

var NATIVE_SYMBOL$5 = nativeSymbol;

var useSymbolAsUid = NATIVE_SYMBOL$5
  && !Symbol.sham
  && typeof Symbol.iterator == 'symbol';

var global$C = global$H;
var getBuiltIn$7 = getBuiltIn$9;
var isCallable$e = isCallable$h;
var isPrototypeOf$2 = objectIsPrototypeOf;
var USE_SYMBOL_AS_UID$1 = useSymbolAsUid;

var Object$4 = global$C.Object;

var isSymbol$4 = USE_SYMBOL_AS_UID$1 ? function (it) {
  return typeof it == 'symbol';
} : function (it) {
  var $Symbol = getBuiltIn$7('Symbol');
  return isCallable$e($Symbol) && isPrototypeOf$2($Symbol.prototype, Object$4(it));
};

var global$B = global$H;

var String$4 = global$B.String;

var tryToString$4 = function (argument) {
  try {
    return String$4(argument);
  } catch (error) {
    return 'Object';
  }
};

var global$A = global$H;
var isCallable$d = isCallable$h;
var tryToString$3 = tryToString$4;

var TypeError$e = global$A.TypeError;

// `Assert: IsCallable(argument) is true`
var aCallable$8 = function (argument) {
  if (isCallable$d(argument)) return argument;
  throw TypeError$e(tryToString$3(argument) + ' is not a function');
};

var aCallable$7 = aCallable$8;

// `GetMethod` abstract operation
// https://tc39.es/ecma262/#sec-getmethod
var getMethod$3 = function (V, P) {
  var func = V[P];
  return func == null ? undefined : aCallable$7(func);
};

var global$z = global$H;
var call$c = functionCall;
var isCallable$c = isCallable$h;
var isObject$f = isObject$g;

var TypeError$d = global$z.TypeError;

// `OrdinaryToPrimitive` abstract operation
// https://tc39.es/ecma262/#sec-ordinarytoprimitive
var ordinaryToPrimitive$1 = function (input, pref) {
  var fn, val;
  if (pref === 'string' && isCallable$c(fn = input.toString) && !isObject$f(val = call$c(fn, input))) return val;
  if (isCallable$c(fn = input.valueOf) && !isObject$f(val = call$c(fn, input))) return val;
  if (pref !== 'string' && isCallable$c(fn = input.toString) && !isObject$f(val = call$c(fn, input))) return val;
  throw TypeError$d("Can't convert object to primitive value");
};

var shared$6 = {exports: {}};

var global$y = global$H;

// eslint-disable-next-line es-x/no-object-defineproperty -- safe
var defineProperty$7 = Object.defineProperty;

var setGlobal$3 = function (key, value) {
  try {
    defineProperty$7(global$y, key, { value: value, configurable: true, writable: true });
  } catch (error) {
    global$y[key] = value;
  } return value;
};

var global$x = global$H;
var setGlobal$2 = setGlobal$3;

var SHARED = '__core-js_shared__';
var store$3 = global$x[SHARED] || setGlobal$2(SHARED, {});

var sharedStore = store$3;

var store$2 = sharedStore;

(shared$6.exports = function (key, value) {
  return store$2[key] || (store$2[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: '3.22.4',
  mode: 'global',
  copyright: '© 2014-2022 Denis Pushkarev (zloirock.ru)',
  license: 'https://github.com/zloirock/core-js/blob/v3.22.4/LICENSE',
  source: 'https://github.com/zloirock/core-js'
});

var sharedExports = shared$6.exports;

var global$w = global$H;
var requireObjectCoercible$1 = requireObjectCoercible$3;

var Object$3 = global$w.Object;

// `ToObject` abstract operation
// https://tc39.es/ecma262/#sec-toobject
var toObject$l = function (argument) {
  return Object$3(requireObjectCoercible$1(argument));
};

var uncurryThis$k = functionUncurryThis;
var toObject$k = toObject$l;

var hasOwnProperty = uncurryThis$k({}.hasOwnProperty);

// `HasOwnProperty` abstract operation
// https://tc39.es/ecma262/#sec-hasownproperty
// eslint-disable-next-line es-x/no-object-hasown -- safe
var hasOwnProperty_1 = Object.hasOwn || function hasOwn(it, key) {
  return hasOwnProperty(toObject$k(it), key);
};

var uncurryThis$j = functionUncurryThis;

var id$1 = 0;
var postfix = Math.random();
var toString$6 = uncurryThis$j(1.0.toString);

var uid$4 = function (key) {
  return 'Symbol(' + (key === undefined ? '' : key) + ')_' + toString$6(++id$1 + postfix, 36);
};

var global$v = global$H;
var shared$5 = sharedExports;
var hasOwn$e = hasOwnProperty_1;
var uid$3 = uid$4;
var NATIVE_SYMBOL$4 = nativeSymbol;
var USE_SYMBOL_AS_UID = useSymbolAsUid;

var WellKnownSymbolsStore$1 = shared$5('wks');
var Symbol$1 = global$v.Symbol;
var symbolFor = Symbol$1 && Symbol$1['for'];
var createWellKnownSymbol = USE_SYMBOL_AS_UID ? Symbol$1 : Symbol$1 && Symbol$1.withoutSetter || uid$3;

var wellKnownSymbol$i = function (name) {
  if (!hasOwn$e(WellKnownSymbolsStore$1, name) || !(NATIVE_SYMBOL$4 || typeof WellKnownSymbolsStore$1[name] == 'string')) {
    var description = 'Symbol.' + name;
    if (NATIVE_SYMBOL$4 && hasOwn$e(Symbol$1, name)) {
      WellKnownSymbolsStore$1[name] = Symbol$1[name];
    } else if (USE_SYMBOL_AS_UID && symbolFor) {
      WellKnownSymbolsStore$1[name] = symbolFor(description);
    } else {
      WellKnownSymbolsStore$1[name] = createWellKnownSymbol(description);
    }
  } return WellKnownSymbolsStore$1[name];
};

var global$u = global$H;
var call$b = functionCall;
var isObject$e = isObject$g;
var isSymbol$3 = isSymbol$4;
var getMethod$2 = getMethod$3;
var ordinaryToPrimitive = ordinaryToPrimitive$1;
var wellKnownSymbol$h = wellKnownSymbol$i;

var TypeError$c = global$u.TypeError;
var TO_PRIMITIVE = wellKnownSymbol$h('toPrimitive');

// `ToPrimitive` abstract operation
// https://tc39.es/ecma262/#sec-toprimitive
var toPrimitive$1 = function (input, pref) {
  if (!isObject$e(input) || isSymbol$3(input)) return input;
  var exoticToPrim = getMethod$2(input, TO_PRIMITIVE);
  var result;
  if (exoticToPrim) {
    if (pref === undefined) pref = 'default';
    result = call$b(exoticToPrim, input, pref);
    if (!isObject$e(result) || isSymbol$3(result)) return result;
    throw TypeError$c("Can't convert object to primitive value");
  }
  if (pref === undefined) pref = 'number';
  return ordinaryToPrimitive(input, pref);
};

var toPrimitive = toPrimitive$1;
var isSymbol$2 = isSymbol$4;

// `ToPropertyKey` abstract operation
// https://tc39.es/ecma262/#sec-topropertykey
var toPropertyKey$6 = function (argument) {
  var key = toPrimitive(argument, 'string');
  return isSymbol$2(key) ? key : key + '';
};

var global$t = global$H;
var isObject$d = isObject$g;

var document$1 = global$t.document;
// typeof document.createElement is 'object' in old IE
var EXISTS$1 = isObject$d(document$1) && isObject$d(document$1.createElement);

var documentCreateElement$1 = function (it) {
  return EXISTS$1 ? document$1.createElement(it) : {};
};

var DESCRIPTORS$k = descriptors;
var fails$t = fails$y;
var createElement = documentCreateElement$1;

// Thanks to IE8 for its funny defineProperty
var ie8DomDefine = !DESCRIPTORS$k && !fails$t(function () {
  // eslint-disable-next-line es-x/no-object-defineproperty -- required for testing
  return Object.defineProperty(createElement('div'), 'a', {
    get: function () { return 7; }
  }).a != 7;
});

var DESCRIPTORS$j = descriptors;
var call$a = functionCall;
var propertyIsEnumerableModule$2 = objectPropertyIsEnumerable;
var createPropertyDescriptor$4 = createPropertyDescriptor$5;
var toIndexedObject$c = toIndexedObject$d;
var toPropertyKey$5 = toPropertyKey$6;
var hasOwn$d = hasOwnProperty_1;
var IE8_DOM_DEFINE$1 = ie8DomDefine;

// eslint-disable-next-line es-x/no-object-getownpropertydescriptor -- safe
var $getOwnPropertyDescriptor$2 = Object.getOwnPropertyDescriptor;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.es/ecma262/#sec-object.getownpropertydescriptor
objectGetOwnPropertyDescriptor.f = DESCRIPTORS$j ? $getOwnPropertyDescriptor$2 : function getOwnPropertyDescriptor(O, P) {
  O = toIndexedObject$c(O);
  P = toPropertyKey$5(P);
  if (IE8_DOM_DEFINE$1) try {
    return $getOwnPropertyDescriptor$2(O, P);
  } catch (error) { /* empty */ }
  if (hasOwn$d(O, P)) return createPropertyDescriptor$4(!call$a(propertyIsEnumerableModule$2.f, O, P), O[P]);
};

var objectDefineProperty = {};

var DESCRIPTORS$i = descriptors;
var fails$s = fails$y;

// V8 ~ Chrome 36-
// https://bugs.chromium.org/p/v8/issues/detail?id=3334
var v8PrototypeDefineBug = DESCRIPTORS$i && fails$s(function () {
  // eslint-disable-next-line es-x/no-object-defineproperty -- required for testing
  return Object.defineProperty(function () { /* empty */ }, 'prototype', {
    value: 42,
    writable: false
  }).prototype != 42;
});

var global$s = global$H;
var isObject$c = isObject$g;

var String$3 = global$s.String;
var TypeError$b = global$s.TypeError;

// `Assert: Type(argument) is Object`
var anObject$a = function (argument) {
  if (isObject$c(argument)) return argument;
  throw TypeError$b(String$3(argument) + ' is not an object');
};

var global$r = global$H;
var DESCRIPTORS$h = descriptors;
var IE8_DOM_DEFINE = ie8DomDefine;
var V8_PROTOTYPE_DEFINE_BUG$1 = v8PrototypeDefineBug;
var anObject$9 = anObject$a;
var toPropertyKey$4 = toPropertyKey$6;

var TypeError$a = global$r.TypeError;
// eslint-disable-next-line es-x/no-object-defineproperty -- safe
var $defineProperty$1 = Object.defineProperty;
// eslint-disable-next-line es-x/no-object-getownpropertydescriptor -- safe
var $getOwnPropertyDescriptor$1 = Object.getOwnPropertyDescriptor;
var ENUMERABLE = 'enumerable';
var CONFIGURABLE$1 = 'configurable';
var WRITABLE = 'writable';

// `Object.defineProperty` method
// https://tc39.es/ecma262/#sec-object.defineproperty
objectDefineProperty.f = DESCRIPTORS$h ? V8_PROTOTYPE_DEFINE_BUG$1 ? function defineProperty(O, P, Attributes) {
  anObject$9(O);
  P = toPropertyKey$4(P);
  anObject$9(Attributes);
  if (typeof O === 'function' && P === 'prototype' && 'value' in Attributes && WRITABLE in Attributes && !Attributes[WRITABLE]) {
    var current = $getOwnPropertyDescriptor$1(O, P);
    if (current && current[WRITABLE]) {
      O[P] = Attributes.value;
      Attributes = {
        configurable: CONFIGURABLE$1 in Attributes ? Attributes[CONFIGURABLE$1] : current[CONFIGURABLE$1],
        enumerable: ENUMERABLE in Attributes ? Attributes[ENUMERABLE] : current[ENUMERABLE],
        writable: false
      };
    }
  } return $defineProperty$1(O, P, Attributes);
} : $defineProperty$1 : function defineProperty(O, P, Attributes) {
  anObject$9(O);
  P = toPropertyKey$4(P);
  anObject$9(Attributes);
  if (IE8_DOM_DEFINE) try {
    return $defineProperty$1(O, P, Attributes);
  } catch (error) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError$a('Accessors not supported');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

var DESCRIPTORS$g = descriptors;
var definePropertyModule$8 = objectDefineProperty;
var createPropertyDescriptor$3 = createPropertyDescriptor$5;

var createNonEnumerableProperty$4 = DESCRIPTORS$g ? function (object, key, value) {
  return definePropertyModule$8.f(object, key, createPropertyDescriptor$3(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

var makeBuiltIn$2 = {exports: {}};

var DESCRIPTORS$f = descriptors;
var hasOwn$c = hasOwnProperty_1;

var FunctionPrototype$1 = Function.prototype;
// eslint-disable-next-line es-x/no-object-getownpropertydescriptor -- safe
var getDescriptor = DESCRIPTORS$f && Object.getOwnPropertyDescriptor;

var EXISTS = hasOwn$c(FunctionPrototype$1, 'name');
// additional protection from minified / mangled / dropped function names
var PROPER = EXISTS && (function something() { /* empty */ }).name === 'something';
var CONFIGURABLE = EXISTS && (!DESCRIPTORS$f || (DESCRIPTORS$f && getDescriptor(FunctionPrototype$1, 'name').configurable));

var functionName = {
  EXISTS: EXISTS,
  PROPER: PROPER,
  CONFIGURABLE: CONFIGURABLE
};

var uncurryThis$i = functionUncurryThis;
var isCallable$b = isCallable$h;
var store$1 = sharedStore;

var functionToString = uncurryThis$i(Function.toString);

// this helper broken in `core-js@3.4.1-3.4.4`, so we can't use `shared` helper
if (!isCallable$b(store$1.inspectSource)) {
  store$1.inspectSource = function (it) {
    return functionToString(it);
  };
}

var inspectSource$3 = store$1.inspectSource;

var global$q = global$H;
var isCallable$a = isCallable$h;
var inspectSource$2 = inspectSource$3;

var WeakMap$1 = global$q.WeakMap;

var nativeWeakMap = isCallable$a(WeakMap$1) && /native code/.test(inspectSource$2(WeakMap$1));

var shared$4 = sharedExports;
var uid$2 = uid$4;

var keys = shared$4('keys');

var sharedKey$4 = function (key) {
  return keys[key] || (keys[key] = uid$2(key));
};

var hiddenKeys$6 = {};

var NATIVE_WEAK_MAP = nativeWeakMap;
var global$p = global$H;
var uncurryThis$h = functionUncurryThis;
var isObject$b = isObject$g;
var createNonEnumerableProperty$3 = createNonEnumerableProperty$4;
var hasOwn$b = hasOwnProperty_1;
var shared$3 = sharedStore;
var sharedKey$3 = sharedKey$4;
var hiddenKeys$5 = hiddenKeys$6;

var OBJECT_ALREADY_INITIALIZED = 'Object already initialized';
var TypeError$9 = global$p.TypeError;
var WeakMap = global$p.WeakMap;
var set, get, has;

var enforce = function (it) {
  return has(it) ? get(it) : set(it, {});
};

var getterFor = function (TYPE) {
  return function (it) {
    var state;
    if (!isObject$b(it) || (state = get(it)).type !== TYPE) {
      throw TypeError$9('Incompatible receiver, ' + TYPE + ' required');
    } return state;
  };
};

if (NATIVE_WEAK_MAP || shared$3.state) {
  var store = shared$3.state || (shared$3.state = new WeakMap());
  var wmget = uncurryThis$h(store.get);
  var wmhas = uncurryThis$h(store.has);
  var wmset = uncurryThis$h(store.set);
  set = function (it, metadata) {
    if (wmhas(store, it)) throw new TypeError$9(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    wmset(store, it, metadata);
    return metadata;
  };
  get = function (it) {
    return wmget(store, it) || {};
  };
  has = function (it) {
    return wmhas(store, it);
  };
} else {
  var STATE = sharedKey$3('state');
  hiddenKeys$5[STATE] = true;
  set = function (it, metadata) {
    if (hasOwn$b(it, STATE)) throw new TypeError$9(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    createNonEnumerableProperty$3(it, STATE, metadata);
    return metadata;
  };
  get = function (it) {
    return hasOwn$b(it, STATE) ? it[STATE] : {};
  };
  has = function (it) {
    return hasOwn$b(it, STATE);
  };
}

var internalState = {
  set: set,
  get: get,
  has: has,
  enforce: enforce,
  getterFor: getterFor
};

var fails$r = fails$y;
var isCallable$9 = isCallable$h;
var hasOwn$a = hasOwnProperty_1;
var defineProperty$6 = objectDefineProperty.f;
var CONFIGURABLE_FUNCTION_NAME$1 = functionName.CONFIGURABLE;
var inspectSource$1 = inspectSource$3;
var InternalStateModule$3 = internalState;

var enforceInternalState = InternalStateModule$3.enforce;
var getInternalState$3 = InternalStateModule$3.get;

var CONFIGURABLE_LENGTH = !fails$r(function () {
  return defineProperty$6(function () { /* empty */ }, 'length', { value: 8 }).length !== 8;
});

var TEMPLATE = String(String).split('String');

var makeBuiltIn$1 = makeBuiltIn$2.exports = function (value, name, options) {
  if (String(name).slice(0, 7) === 'Symbol(') {
    name = '[' + String(name).replace(/^Symbol\(([^)]*)\)/, '$1') + ']';
  }
  if (options && options.getter) name = 'get ' + name;
  if (options && options.setter) name = 'set ' + name;
  if (!hasOwn$a(value, 'name') || (CONFIGURABLE_FUNCTION_NAME$1 && value.name !== name)) {
    defineProperty$6(value, 'name', { value: name, configurable: true });
  }
  if (CONFIGURABLE_LENGTH && options && hasOwn$a(options, 'arity') && value.length !== options.arity) {
    defineProperty$6(value, 'length', { value: options.arity });
  }
  var state = enforceInternalState(value);
  if (!hasOwn$a(state, 'source')) {
    state.source = TEMPLATE.join(typeof name == 'string' ? name : '');
  } return value;
};

// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
// eslint-disable-next-line no-extend-native -- required
Function.prototype.toString = makeBuiltIn$1(function toString() {
  return isCallable$9(this) && getInternalState$3(this).source || inspectSource$1(this);
}, 'toString');

var makeBuiltInExports = makeBuiltIn$2.exports;

var global$o = global$H;
var isCallable$8 = isCallable$h;
var createNonEnumerableProperty$2 = createNonEnumerableProperty$4;
var makeBuiltIn = makeBuiltInExports;
var setGlobal$1 = setGlobal$3;

var defineBuiltIn$6 = function (O, key, value, options) {
  var unsafe = options ? !!options.unsafe : false;
  var simple = options ? !!options.enumerable : false;
  var noTargetGet = options ? !!options.noTargetGet : false;
  var name = options && options.name !== undefined ? options.name : key;
  if (isCallable$8(value)) makeBuiltIn(value, name, options);
  if (O === global$o) {
    if (simple) O[key] = value;
    else setGlobal$1(key, value);
    return O;
  } else if (!unsafe) {
    delete O[key];
  } else if (!noTargetGet && O[key]) {
    simple = true;
  }
  if (simple) O[key] = value;
  else createNonEnumerableProperty$2(O, key, value);
  return O;
};

var objectGetOwnPropertyNames = {};

var ceil = Math.ceil;
var floor$1 = Math.floor;

// `ToIntegerOrInfinity` abstract operation
// https://tc39.es/ecma262/#sec-tointegerorinfinity
var toIntegerOrInfinity$7 = function (argument) {
  var number = +argument;
  // eslint-disable-next-line no-self-compare -- safe
  return number !== number || number === 0 ? 0 : (number > 0 ? floor$1 : ceil)(number);
};

var toIntegerOrInfinity$6 = toIntegerOrInfinity$7;

var max$3 = Math.max;
var min$4 = Math.min;

// Helper for a popular repeating case of the spec:
// Let integer be ? ToInteger(index).
// If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).
var toAbsoluteIndex$6 = function (index, length) {
  var integer = toIntegerOrInfinity$6(index);
  return integer < 0 ? max$3(integer + length, 0) : min$4(integer, length);
};

var toIntegerOrInfinity$5 = toIntegerOrInfinity$7;

var min$3 = Math.min;

// `ToLength` abstract operation
// https://tc39.es/ecma262/#sec-tolength
var toLength$1 = function (argument) {
  return argument > 0 ? min$3(toIntegerOrInfinity$5(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
};

var toLength = toLength$1;

// `LengthOfArrayLike` abstract operation
// https://tc39.es/ecma262/#sec-lengthofarraylike
var lengthOfArrayLike$h = function (obj) {
  return toLength(obj.length);
};

var toIndexedObject$b = toIndexedObject$d;
var toAbsoluteIndex$5 = toAbsoluteIndex$6;
var lengthOfArrayLike$g = lengthOfArrayLike$h;

// `Array.prototype.{ indexOf, includes }` methods implementation
var createMethod$4 = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIndexedObject$b($this);
    var length = lengthOfArrayLike$g(O);
    var index = toAbsoluteIndex$5(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare -- NaN check
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare -- NaN check
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) {
      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

var arrayIncludes = {
  // `Array.prototype.includes` method
  // https://tc39.es/ecma262/#sec-array.prototype.includes
  includes: createMethod$4(true),
  // `Array.prototype.indexOf` method
  // https://tc39.es/ecma262/#sec-array.prototype.indexof
  indexOf: createMethod$4(false)
};

var uncurryThis$g = functionUncurryThis;
var hasOwn$9 = hasOwnProperty_1;
var toIndexedObject$a = toIndexedObject$d;
var indexOf = arrayIncludes.indexOf;
var hiddenKeys$4 = hiddenKeys$6;

var push$4 = uncurryThis$g([].push);

var objectKeysInternal = function (object, names) {
  var O = toIndexedObject$a(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) !hasOwn$9(hiddenKeys$4, key) && hasOwn$9(O, key) && push$4(result, key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (hasOwn$9(O, key = names[i++])) {
    ~indexOf(result, key) || push$4(result, key);
  }
  return result;
};

// IE8- don't enum bug keys
var enumBugKeys$3 = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];

var internalObjectKeys$1 = objectKeysInternal;
var enumBugKeys$2 = enumBugKeys$3;

var hiddenKeys$3 = enumBugKeys$2.concat('length', 'prototype');

// `Object.getOwnPropertyNames` method
// https://tc39.es/ecma262/#sec-object.getownpropertynames
// eslint-disable-next-line es-x/no-object-getownpropertynames -- safe
objectGetOwnPropertyNames.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return internalObjectKeys$1(O, hiddenKeys$3);
};

var objectGetOwnPropertySymbols = {};

// eslint-disable-next-line es-x/no-object-getownpropertysymbols -- safe
objectGetOwnPropertySymbols.f = Object.getOwnPropertySymbols;

var getBuiltIn$6 = getBuiltIn$9;
var uncurryThis$f = functionUncurryThis;
var getOwnPropertyNamesModule$2 = objectGetOwnPropertyNames;
var getOwnPropertySymbolsModule$3 = objectGetOwnPropertySymbols;
var anObject$8 = anObject$a;

var concat$1 = uncurryThis$f([].concat);

// all object keys, includes non-enumerable and symbols
var ownKeys$2 = getBuiltIn$6('Reflect', 'ownKeys') || function ownKeys(it) {
  var keys = getOwnPropertyNamesModule$2.f(anObject$8(it));
  var getOwnPropertySymbols = getOwnPropertySymbolsModule$3.f;
  return getOwnPropertySymbols ? concat$1(keys, getOwnPropertySymbols(it)) : keys;
};

var hasOwn$8 = hasOwnProperty_1;
var ownKeys$1 = ownKeys$2;
var getOwnPropertyDescriptorModule$2 = objectGetOwnPropertyDescriptor;
var definePropertyModule$7 = objectDefineProperty;

var copyConstructorProperties$1 = function (target, source, exceptions) {
  var keys = ownKeys$1(source);
  var defineProperty = definePropertyModule$7.f;
  var getOwnPropertyDescriptor = getOwnPropertyDescriptorModule$2.f;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!hasOwn$8(target, key) && !(exceptions && hasOwn$8(exceptions, key))) {
      defineProperty(target, key, getOwnPropertyDescriptor(source, key));
    }
  }
};

var fails$q = fails$y;
var isCallable$7 = isCallable$h;

var replacement = /#|\.prototype\./;

var isForced$1 = function (feature, detection) {
  var value = data[normalize(feature)];
  return value == POLYFILL ? true
    : value == NATIVE ? false
    : isCallable$7(detection) ? fails$q(detection)
    : !!detection;
};

var normalize = isForced$1.normalize = function (string) {
  return String(string).replace(replacement, '.').toLowerCase();
};

var data = isForced$1.data = {};
var NATIVE = isForced$1.NATIVE = 'N';
var POLYFILL = isForced$1.POLYFILL = 'P';

var isForced_1 = isForced$1;

var global$n = global$H;
var getOwnPropertyDescriptor$2 = objectGetOwnPropertyDescriptor.f;
var createNonEnumerableProperty$1 = createNonEnumerableProperty$4;
var defineBuiltIn$5 = defineBuiltIn$6;
var setGlobal = setGlobal$3;
var copyConstructorProperties = copyConstructorProperties$1;
var isForced = isForced_1;

/*
  options.target      - name of the target object
  options.global      - target is the global object
  options.stat        - export as static methods of target
  options.proto       - export as prototype methods of target
  options.real        - real prototype method for the `pure` version
  options.forced      - export even if the native feature is available
  options.bind        - bind methods to the target, required for the `pure` version
  options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe      - use the simple assignment of property instead of delete + defineProperty
  options.sham        - add a flag to not completely full polyfills
  options.enumerable  - export as enumerable property
  options.noTargetGet - prevent calling a getter on target
  options.name        - the .name of the function if it does not match the key
*/
var _export = function (options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var FORCED, target, key, targetProperty, sourceProperty, descriptor;
  if (GLOBAL) {
    target = global$n;
  } else if (STATIC) {
    target = global$n[TARGET] || setGlobal(TARGET, {});
  } else {
    target = (global$n[TARGET] || {}).prototype;
  }
  if (target) for (key in source) {
    sourceProperty = source[key];
    if (options.noTargetGet) {
      descriptor = getOwnPropertyDescriptor$2(target, key);
      targetProperty = descriptor && descriptor.value;
    } else targetProperty = target[key];
    FORCED = isForced(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
    // contained in target
    if (!FORCED && targetProperty !== undefined) {
      if (typeof sourceProperty == typeof targetProperty) continue;
      copyConstructorProperties(sourceProperty, targetProperty);
    }
    // add a flag to not completely full polyfills
    if (options.sham || (targetProperty && targetProperty.sham)) {
      createNonEnumerableProperty$1(sourceProperty, 'sham', true);
    }
    defineBuiltIn$5(target, key, sourceProperty, options);
  }
};

var $$X = _export;
var global$m = global$H;

// `globalThis` object
// https://tc39.es/ecma262/#sec-globalthis
$$X({ global: true }, {
  globalThis: global$m
});

var wellKnownSymbol$g = wellKnownSymbol$i;

var TO_STRING_TAG$2 = wellKnownSymbol$g('toStringTag');
var test$2 = {};

test$2[TO_STRING_TAG$2] = 'z';

var toStringTagSupport = String(test$2) === '[object z]';

var global$l = global$H;
var TO_STRING_TAG_SUPPORT$2 = toStringTagSupport;
var isCallable$6 = isCallable$h;
var classofRaw = classofRaw$1;
var wellKnownSymbol$f = wellKnownSymbol$i;

var TO_STRING_TAG$1 = wellKnownSymbol$f('toStringTag');
var Object$2 = global$l.Object;

// ES3 wrong here
var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (error) { /* empty */ }
};

// getting tag from ES6+ `Object.prototype.toString`
var classof$a = TO_STRING_TAG_SUPPORT$2 ? classofRaw : function (it) {
  var O, tag, result;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (tag = tryGet(O = Object$2(it), TO_STRING_TAG$1)) == 'string' ? tag
    // builtinTag case
    : CORRECT_ARGUMENTS ? classofRaw(O)
    // ES3 arguments fallback
    : (result = classofRaw(O)) == 'Object' && isCallable$6(O.callee) ? 'Arguments' : result;
};

var global$k = global$H;
var classof$9 = classof$a;

var String$2 = global$k.String;

var toString$5 = function (argument) {
  if (classof$9(argument) === 'Symbol') throw TypeError('Cannot convert a Symbol value to a string');
  return String$2(argument);
};

var objectDefineProperties = {};

var internalObjectKeys = objectKeysInternal;
var enumBugKeys$1 = enumBugKeys$3;

// `Object.keys` method
// https://tc39.es/ecma262/#sec-object.keys
// eslint-disable-next-line es-x/no-object-keys -- safe
var objectKeys$4 = Object.keys || function keys(O) {
  return internalObjectKeys(O, enumBugKeys$1);
};

var DESCRIPTORS$e = descriptors;
var V8_PROTOTYPE_DEFINE_BUG = v8PrototypeDefineBug;
var definePropertyModule$6 = objectDefineProperty;
var anObject$7 = anObject$a;
var toIndexedObject$9 = toIndexedObject$d;
var objectKeys$3 = objectKeys$4;

// `Object.defineProperties` method
// https://tc39.es/ecma262/#sec-object.defineproperties
// eslint-disable-next-line es-x/no-object-defineproperties -- safe
objectDefineProperties.f = DESCRIPTORS$e && !V8_PROTOTYPE_DEFINE_BUG ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject$7(O);
  var props = toIndexedObject$9(Properties);
  var keys = objectKeys$3(Properties);
  var length = keys.length;
  var index = 0;
  var key;
  while (length > index) definePropertyModule$6.f(O, key = keys[index++], props[key]);
  return O;
};

var getBuiltIn$5 = getBuiltIn$9;

var html$1 = getBuiltIn$5('document', 'documentElement');

/* global ActiveXObject -- old IE, WSH */

var anObject$6 = anObject$a;
var definePropertiesModule$1 = objectDefineProperties;
var enumBugKeys = enumBugKeys$3;
var hiddenKeys$2 = hiddenKeys$6;
var html = html$1;
var documentCreateElement = documentCreateElement$1;
var sharedKey$2 = sharedKey$4;

var GT = '>';
var LT = '<';
var PROTOTYPE$1 = 'prototype';
var SCRIPT = 'script';
var IE_PROTO$1 = sharedKey$2('IE_PROTO');

var EmptyConstructor = function () { /* empty */ };

var scriptTag = function (content) {
  return LT + SCRIPT + GT + content + LT + '/' + SCRIPT + GT;
};

// Create object with fake `null` prototype: use ActiveX Object with cleared prototype
var NullProtoObjectViaActiveX = function (activeXDocument) {
  activeXDocument.write(scriptTag(''));
  activeXDocument.close();
  var temp = activeXDocument.parentWindow.Object;
  activeXDocument = null; // avoid memory leak
  return temp;
};

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var NullProtoObjectViaIFrame = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = documentCreateElement('iframe');
  var JS = 'java' + SCRIPT + ':';
  var iframeDocument;
  iframe.style.display = 'none';
  html.appendChild(iframe);
  // https://github.com/zloirock/core-js/issues/475
  iframe.src = String(JS);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(scriptTag('document.F=Object'));
  iframeDocument.close();
  return iframeDocument.F;
};

// Check for document.domain and active x support
// No need to use active x approach when document.domain is not set
// see https://github.com/es-shims/es5-shim/issues/150
// variation of https://github.com/kitcambridge/es5-shim/commit/4f738ac066346
// avoid IE GC bug
var activeXDocument;
var NullProtoObject = function () {
  try {
    activeXDocument = new ActiveXObject('htmlfile');
  } catch (error) { /* ignore */ }
  NullProtoObject = typeof document != 'undefined'
    ? document.domain && activeXDocument
      ? NullProtoObjectViaActiveX(activeXDocument) // old IE
      : NullProtoObjectViaIFrame()
    : NullProtoObjectViaActiveX(activeXDocument); // WSH
  var length = enumBugKeys.length;
  while (length--) delete NullProtoObject[PROTOTYPE$1][enumBugKeys[length]];
  return NullProtoObject();
};

hiddenKeys$2[IE_PROTO$1] = true;

// `Object.create` method
// https://tc39.es/ecma262/#sec-object.create
// eslint-disable-next-line es-x/no-object-create -- safe
var objectCreate = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    EmptyConstructor[PROTOTYPE$1] = anObject$6(O);
    result = new EmptyConstructor();
    EmptyConstructor[PROTOTYPE$1] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO$1] = O;
  } else result = NullProtoObject();
  return Properties === undefined ? result : definePropertiesModule$1.f(result, Properties);
};

var objectGetOwnPropertyNamesExternal = {};

var toPropertyKey$3 = toPropertyKey$6;
var definePropertyModule$5 = objectDefineProperty;
var createPropertyDescriptor$2 = createPropertyDescriptor$5;

var createProperty$8 = function (object, key, value) {
  var propertyKey = toPropertyKey$3(key);
  if (propertyKey in object) definePropertyModule$5.f(object, propertyKey, createPropertyDescriptor$2(0, value));
  else object[propertyKey] = value;
};

var global$j = global$H;
var toAbsoluteIndex$4 = toAbsoluteIndex$6;
var lengthOfArrayLike$f = lengthOfArrayLike$h;
var createProperty$7 = createProperty$8;

var Array$5 = global$j.Array;
var max$2 = Math.max;

var arraySliceSimple = function (O, start, end) {
  var length = lengthOfArrayLike$f(O);
  var k = toAbsoluteIndex$4(start, length);
  var fin = toAbsoluteIndex$4(end === undefined ? length : end, length);
  var result = Array$5(max$2(fin - k, 0));
  for (var n = 0; k < fin; k++, n++) createProperty$7(result, n, O[k]);
  result.length = n;
  return result;
};

/* eslint-disable es-x/no-object-getownpropertynames -- safe */

var classof$8 = classofRaw$1;
var toIndexedObject$8 = toIndexedObject$d;
var $getOwnPropertyNames$1 = objectGetOwnPropertyNames.f;
var arraySlice$3 = arraySliceSimple;

var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function (it) {
  try {
    return $getOwnPropertyNames$1(it);
  } catch (error) {
    return arraySlice$3(windowNames);
  }
};

// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
objectGetOwnPropertyNamesExternal.f = function getOwnPropertyNames(it) {
  return windowNames && classof$8(it) == 'Window'
    ? getWindowNames(it)
    : $getOwnPropertyNames$1(toIndexedObject$8(it));
};

var wellKnownSymbolWrapped = {};

var wellKnownSymbol$e = wellKnownSymbol$i;

wellKnownSymbolWrapped.f = wellKnownSymbol$e;

var global$i = global$H;

var path$3 = global$i;

var path$2 = path$3;
var hasOwn$7 = hasOwnProperty_1;
var wrappedWellKnownSymbolModule$1 = wellKnownSymbolWrapped;
var defineProperty$5 = objectDefineProperty.f;

var defineWellKnownSymbol$1 = function (NAME) {
  var Symbol = path$2.Symbol || (path$2.Symbol = {});
  if (!hasOwn$7(Symbol, NAME)) defineProperty$5(Symbol, NAME, {
    value: wrappedWellKnownSymbolModule$1.f(NAME)
  });
};

var call$9 = functionCall;
var getBuiltIn$4 = getBuiltIn$9;
var wellKnownSymbol$d = wellKnownSymbol$i;
var defineBuiltIn$4 = defineBuiltIn$6;

var symbolDefineToPrimitive = function () {
  var Symbol = getBuiltIn$4('Symbol');
  var SymbolPrototype = Symbol && Symbol.prototype;
  var valueOf = SymbolPrototype && SymbolPrototype.valueOf;
  var TO_PRIMITIVE = wellKnownSymbol$d('toPrimitive');

  if (SymbolPrototype && !SymbolPrototype[TO_PRIMITIVE]) {
    // `Symbol.prototype[@@toPrimitive]` method
    // https://tc39.es/ecma262/#sec-symbol.prototype-@@toprimitive
    // eslint-disable-next-line no-unused-vars -- required for .length
    defineBuiltIn$4(SymbolPrototype, TO_PRIMITIVE, function (hint) {
      return call$9(valueOf, this);
    }, { arity: 1 });
  }
};

var defineProperty$4 = objectDefineProperty.f;
var hasOwn$6 = hasOwnProperty_1;
var wellKnownSymbol$c = wellKnownSymbol$i;

var TO_STRING_TAG = wellKnownSymbol$c('toStringTag');

var setToStringTag$6 = function (target, TAG, STATIC) {
  if (target && !STATIC) target = target.prototype;
  if (target && !hasOwn$6(target, TO_STRING_TAG)) {
    defineProperty$4(target, TO_STRING_TAG, { configurable: true, value: TAG });
  }
};

var uncurryThis$e = functionUncurryThis;
var aCallable$6 = aCallable$8;
var NATIVE_BIND$1 = functionBindNative;

var bind$4 = uncurryThis$e(uncurryThis$e.bind);

// optional / simple context binding
var functionBindContext = function (fn, that) {
  aCallable$6(fn);
  return that === undefined ? fn : NATIVE_BIND$1 ? bind$4(fn, that) : function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

var classof$7 = classofRaw$1;

// `IsArray` abstract operation
// https://tc39.es/ecma262/#sec-isarray
// eslint-disable-next-line es-x/no-array-isarray -- safe
var isArray$7 = Array.isArray || function isArray(argument) {
  return classof$7(argument) == 'Array';
};

var uncurryThis$d = functionUncurryThis;
var fails$p = fails$y;
var isCallable$5 = isCallable$h;
var classof$6 = classof$a;
var getBuiltIn$3 = getBuiltIn$9;
var inspectSource = inspectSource$3;

var noop = function () { /* empty */ };
var empty = [];
var construct = getBuiltIn$3('Reflect', 'construct');
var constructorRegExp = /^\s*(?:class|function)\b/;
var exec$1 = uncurryThis$d(constructorRegExp.exec);
var INCORRECT_TO_STRING = !constructorRegExp.exec(noop);

var isConstructorModern = function isConstructor(argument) {
  if (!isCallable$5(argument)) return false;
  try {
    construct(noop, empty, argument);
    return true;
  } catch (error) {
    return false;
  }
};

var isConstructorLegacy = function isConstructor(argument) {
  if (!isCallable$5(argument)) return false;
  switch (classof$6(argument)) {
    case 'AsyncFunction':
    case 'GeneratorFunction':
    case 'AsyncGeneratorFunction': return false;
  }
  try {
    // we can't check .prototype since constructors produced by .bind haven't it
    // `Function#toString` throws on some built-it function in some legacy engines
    // (for example, `DOMQuad` and similar in FF41-)
    return INCORRECT_TO_STRING || !!exec$1(constructorRegExp, inspectSource(argument));
  } catch (error) {
    return true;
  }
};

isConstructorLegacy.sham = true;

// `IsConstructor` abstract operation
// https://tc39.es/ecma262/#sec-isconstructor
var isConstructor$4 = !construct || fails$p(function () {
  var called;
  return isConstructorModern(isConstructorModern.call)
    || !isConstructorModern(Object)
    || !isConstructorModern(function () { called = true; })
    || called;
}) ? isConstructorLegacy : isConstructorModern;

var global$h = global$H;
var isArray$6 = isArray$7;
var isConstructor$3 = isConstructor$4;
var isObject$a = isObject$g;
var wellKnownSymbol$b = wellKnownSymbol$i;

var SPECIES$3 = wellKnownSymbol$b('species');
var Array$4 = global$h.Array;

// a part of `ArraySpeciesCreate` abstract operation
// https://tc39.es/ecma262/#sec-arrayspeciescreate
var arraySpeciesConstructor$1 = function (originalArray) {
  var C;
  if (isArray$6(originalArray)) {
    C = originalArray.constructor;
    // cross-realm fallback
    if (isConstructor$3(C) && (C === Array$4 || isArray$6(C.prototype))) C = undefined;
    else if (isObject$a(C)) {
      C = C[SPECIES$3];
      if (C === null) C = undefined;
    }
  } return C === undefined ? Array$4 : C;
};

var arraySpeciesConstructor = arraySpeciesConstructor$1;

// `ArraySpeciesCreate` abstract operation
// https://tc39.es/ecma262/#sec-arrayspeciescreate
var arraySpeciesCreate$5 = function (originalArray, length) {
  return new (arraySpeciesConstructor(originalArray))(length === 0 ? 0 : length);
};

var bind$3 = functionBindContext;
var uncurryThis$c = functionUncurryThis;
var IndexedObject$3 = indexedObject;
var toObject$j = toObject$l;
var lengthOfArrayLike$e = lengthOfArrayLike$h;
var arraySpeciesCreate$4 = arraySpeciesCreate$5;

var push$3 = uncurryThis$c([].push);

// `Array.prototype.{ forEach, map, filter, some, every, find, findIndex, filterReject }` methods implementation
var createMethod$3 = function (TYPE) {
  var IS_MAP = TYPE == 1;
  var IS_FILTER = TYPE == 2;
  var IS_SOME = TYPE == 3;
  var IS_EVERY = TYPE == 4;
  var IS_FIND_INDEX = TYPE == 6;
  var IS_FILTER_REJECT = TYPE == 7;
  var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
  return function ($this, callbackfn, that, specificCreate) {
    var O = toObject$j($this);
    var self = IndexedObject$3(O);
    var boundFunction = bind$3(callbackfn, that);
    var length = lengthOfArrayLike$e(self);
    var index = 0;
    var create = specificCreate || arraySpeciesCreate$4;
    var target = IS_MAP ? create($this, length) : IS_FILTER || IS_FILTER_REJECT ? create($this, 0) : undefined;
    var value, result;
    for (;length > index; index++) if (NO_HOLES || index in self) {
      value = self[index];
      result = boundFunction(value, index, O);
      if (TYPE) {
        if (IS_MAP) target[index] = result; // map
        else if (result) switch (TYPE) {
          case 3: return true;              // some
          case 5: return value;             // find
          case 6: return index;             // findIndex
          case 2: push$3(target, value);      // filter
        } else switch (TYPE) {
          case 4: return false;             // every
          case 7: push$3(target, value);      // filterReject
        }
      }
    }
    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : target;
  };
};

var arrayIteration = {
  // `Array.prototype.forEach` method
  // https://tc39.es/ecma262/#sec-array.prototype.foreach
  forEach: createMethod$3(0),
  // `Array.prototype.map` method
  // https://tc39.es/ecma262/#sec-array.prototype.map
  map: createMethod$3(1),
  // `Array.prototype.filter` method
  // https://tc39.es/ecma262/#sec-array.prototype.filter
  filter: createMethod$3(2),
  // `Array.prototype.some` method
  // https://tc39.es/ecma262/#sec-array.prototype.some
  some: createMethod$3(3),
  // `Array.prototype.every` method
  // https://tc39.es/ecma262/#sec-array.prototype.every
  every: createMethod$3(4),
  // `Array.prototype.find` method
  // https://tc39.es/ecma262/#sec-array.prototype.find
  find: createMethod$3(5),
  // `Array.prototype.findIndex` method
  // https://tc39.es/ecma262/#sec-array.prototype.findIndex
  findIndex: createMethod$3(6),
  // `Array.prototype.filterReject` method
  // https://github.com/tc39/proposal-array-filtering
  filterReject: createMethod$3(7)
};

var $$W = _export;
var global$g = global$H;
var call$8 = functionCall;
var uncurryThis$b = functionUncurryThis;
var DESCRIPTORS$d = descriptors;
var NATIVE_SYMBOL$3 = nativeSymbol;
var fails$o = fails$y;
var hasOwn$5 = hasOwnProperty_1;
var isPrototypeOf$1 = objectIsPrototypeOf;
var anObject$5 = anObject$a;
var toIndexedObject$7 = toIndexedObject$d;
var toPropertyKey$2 = toPropertyKey$6;
var $toString = toString$5;
var createPropertyDescriptor$1 = createPropertyDescriptor$5;
var nativeObjectCreate = objectCreate;
var objectKeys$2 = objectKeys$4;
var getOwnPropertyNamesModule$1 = objectGetOwnPropertyNames;
var getOwnPropertyNamesExternal = objectGetOwnPropertyNamesExternal;
var getOwnPropertySymbolsModule$2 = objectGetOwnPropertySymbols;
var getOwnPropertyDescriptorModule$1 = objectGetOwnPropertyDescriptor;
var definePropertyModule$4 = objectDefineProperty;
var definePropertiesModule = objectDefineProperties;
var propertyIsEnumerableModule$1 = objectPropertyIsEnumerable;
var defineBuiltIn$3 = defineBuiltIn$6;
var shared$2 = sharedExports;
var sharedKey$1 = sharedKey$4;
var hiddenKeys$1 = hiddenKeys$6;
var uid$1 = uid$4;
var wellKnownSymbol$a = wellKnownSymbol$i;
var wrappedWellKnownSymbolModule = wellKnownSymbolWrapped;
var defineWellKnownSymbol = defineWellKnownSymbol$1;
var defineSymbolToPrimitive = symbolDefineToPrimitive;
var setToStringTag$5 = setToStringTag$6;
var InternalStateModule$2 = internalState;
var $forEach$1 = arrayIteration.forEach;

var HIDDEN = sharedKey$1('hidden');
var SYMBOL = 'Symbol';
var PROTOTYPE = 'prototype';

var setInternalState$2 = InternalStateModule$2.set;
var getInternalState$2 = InternalStateModule$2.getterFor(SYMBOL);

var ObjectPrototype$1 = Object[PROTOTYPE];
var $Symbol = global$g.Symbol;
var SymbolPrototype = $Symbol && $Symbol[PROTOTYPE];
var TypeError$8 = global$g.TypeError;
var QObject = global$g.QObject;
var nativeGetOwnPropertyDescriptor$1 = getOwnPropertyDescriptorModule$1.f;
var nativeDefineProperty = definePropertyModule$4.f;
var nativeGetOwnPropertyNames = getOwnPropertyNamesExternal.f;
var nativePropertyIsEnumerable = propertyIsEnumerableModule$1.f;
var push$2 = uncurryThis$b([].push);

var AllSymbols = shared$2('symbols');
var ObjectPrototypeSymbols = shared$2('op-symbols');
var WellKnownSymbolsStore = shared$2('wks');

// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
var USE_SETTER = !QObject || !QObject[PROTOTYPE] || !QObject[PROTOTYPE].findChild;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDescriptor = DESCRIPTORS$d && fails$o(function () {
  return nativeObjectCreate(nativeDefineProperty({}, 'a', {
    get: function () { return nativeDefineProperty(this, 'a', { value: 7 }).a; }
  })).a != 7;
}) ? function (O, P, Attributes) {
  var ObjectPrototypeDescriptor = nativeGetOwnPropertyDescriptor$1(ObjectPrototype$1, P);
  if (ObjectPrototypeDescriptor) delete ObjectPrototype$1[P];
  nativeDefineProperty(O, P, Attributes);
  if (ObjectPrototypeDescriptor && O !== ObjectPrototype$1) {
    nativeDefineProperty(ObjectPrototype$1, P, ObjectPrototypeDescriptor);
  }
} : nativeDefineProperty;

var wrap = function (tag, description) {
  var symbol = AllSymbols[tag] = nativeObjectCreate(SymbolPrototype);
  setInternalState$2(symbol, {
    type: SYMBOL,
    tag: tag,
    description: description
  });
  if (!DESCRIPTORS$d) symbol.description = description;
  return symbol;
};

var $defineProperty = function defineProperty(O, P, Attributes) {
  if (O === ObjectPrototype$1) $defineProperty(ObjectPrototypeSymbols, P, Attributes);
  anObject$5(O);
  var key = toPropertyKey$2(P);
  anObject$5(Attributes);
  if (hasOwn$5(AllSymbols, key)) {
    if (!Attributes.enumerable) {
      if (!hasOwn$5(O, HIDDEN)) nativeDefineProperty(O, HIDDEN, createPropertyDescriptor$1(1, {}));
      O[HIDDEN][key] = true;
    } else {
      if (hasOwn$5(O, HIDDEN) && O[HIDDEN][key]) O[HIDDEN][key] = false;
      Attributes = nativeObjectCreate(Attributes, { enumerable: createPropertyDescriptor$1(0, false) });
    } return setSymbolDescriptor(O, key, Attributes);
  } return nativeDefineProperty(O, key, Attributes);
};

var $defineProperties = function defineProperties(O, Properties) {
  anObject$5(O);
  var properties = toIndexedObject$7(Properties);
  var keys = objectKeys$2(properties).concat($getOwnPropertySymbols(properties));
  $forEach$1(keys, function (key) {
    if (!DESCRIPTORS$d || call$8($propertyIsEnumerable$1, properties, key)) $defineProperty(O, key, properties[key]);
  });
  return O;
};

var $create = function create(O, Properties) {
  return Properties === undefined ? nativeObjectCreate(O) : $defineProperties(nativeObjectCreate(O), Properties);
};

var $propertyIsEnumerable$1 = function propertyIsEnumerable(V) {
  var P = toPropertyKey$2(V);
  var enumerable = call$8(nativePropertyIsEnumerable, this, P);
  if (this === ObjectPrototype$1 && hasOwn$5(AllSymbols, P) && !hasOwn$5(ObjectPrototypeSymbols, P)) return false;
  return enumerable || !hasOwn$5(this, P) || !hasOwn$5(AllSymbols, P) || hasOwn$5(this, HIDDEN) && this[HIDDEN][P]
    ? enumerable : true;
};

var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(O, P) {
  var it = toIndexedObject$7(O);
  var key = toPropertyKey$2(P);
  if (it === ObjectPrototype$1 && hasOwn$5(AllSymbols, key) && !hasOwn$5(ObjectPrototypeSymbols, key)) return;
  var descriptor = nativeGetOwnPropertyDescriptor$1(it, key);
  if (descriptor && hasOwn$5(AllSymbols, key) && !(hasOwn$5(it, HIDDEN) && it[HIDDEN][key])) {
    descriptor.enumerable = true;
  }
  return descriptor;
};

var $getOwnPropertyNames = function getOwnPropertyNames(O) {
  var names = nativeGetOwnPropertyNames(toIndexedObject$7(O));
  var result = [];
  $forEach$1(names, function (key) {
    if (!hasOwn$5(AllSymbols, key) && !hasOwn$5(hiddenKeys$1, key)) push$2(result, key);
  });
  return result;
};

var $getOwnPropertySymbols = function (O) {
  var IS_OBJECT_PROTOTYPE = O === ObjectPrototype$1;
  var names = nativeGetOwnPropertyNames(IS_OBJECT_PROTOTYPE ? ObjectPrototypeSymbols : toIndexedObject$7(O));
  var result = [];
  $forEach$1(names, function (key) {
    if (hasOwn$5(AllSymbols, key) && (!IS_OBJECT_PROTOTYPE || hasOwn$5(ObjectPrototype$1, key))) {
      push$2(result, AllSymbols[key]);
    }
  });
  return result;
};

// `Symbol` constructor
// https://tc39.es/ecma262/#sec-symbol-constructor
if (!NATIVE_SYMBOL$3) {
  $Symbol = function Symbol() {
    if (isPrototypeOf$1(SymbolPrototype, this)) throw TypeError$8('Symbol is not a constructor');
    var description = !arguments.length || arguments[0] === undefined ? undefined : $toString(arguments[0]);
    var tag = uid$1(description);
    var setter = function (value) {
      if (this === ObjectPrototype$1) call$8(setter, ObjectPrototypeSymbols, value);
      if (hasOwn$5(this, HIDDEN) && hasOwn$5(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
      setSymbolDescriptor(this, tag, createPropertyDescriptor$1(1, value));
    };
    if (DESCRIPTORS$d && USE_SETTER) setSymbolDescriptor(ObjectPrototype$1, tag, { configurable: true, set: setter });
    return wrap(tag, description);
  };

  SymbolPrototype = $Symbol[PROTOTYPE];

  defineBuiltIn$3(SymbolPrototype, 'toString', function toString() {
    return getInternalState$2(this).tag;
  });

  defineBuiltIn$3($Symbol, 'withoutSetter', function (description) {
    return wrap(uid$1(description), description);
  });

  propertyIsEnumerableModule$1.f = $propertyIsEnumerable$1;
  definePropertyModule$4.f = $defineProperty;
  definePropertiesModule.f = $defineProperties;
  getOwnPropertyDescriptorModule$1.f = $getOwnPropertyDescriptor;
  getOwnPropertyNamesModule$1.f = getOwnPropertyNamesExternal.f = $getOwnPropertyNames;
  getOwnPropertySymbolsModule$2.f = $getOwnPropertySymbols;

  wrappedWellKnownSymbolModule.f = function (name) {
    return wrap(wellKnownSymbol$a(name), name);
  };

  if (DESCRIPTORS$d) {
    // https://github.com/tc39/proposal-Symbol-description
    nativeDefineProperty(SymbolPrototype, 'description', {
      configurable: true,
      get: function description() {
        return getInternalState$2(this).description;
      }
    });
    {
      defineBuiltIn$3(ObjectPrototype$1, 'propertyIsEnumerable', $propertyIsEnumerable$1, { unsafe: true });
    }
  }
}

$$W({ global: true, wrap: true, forced: !NATIVE_SYMBOL$3, sham: !NATIVE_SYMBOL$3 }, {
  Symbol: $Symbol
});

$forEach$1(objectKeys$2(WellKnownSymbolsStore), function (name) {
  defineWellKnownSymbol(name);
});

$$W({ target: SYMBOL, stat: true, forced: !NATIVE_SYMBOL$3 }, {
  useSetter: function () { USE_SETTER = true; },
  useSimple: function () { USE_SETTER = false; }
});

$$W({ target: 'Object', stat: true, forced: !NATIVE_SYMBOL$3, sham: !DESCRIPTORS$d }, {
  // `Object.create` method
  // https://tc39.es/ecma262/#sec-object.create
  create: $create,
  // `Object.defineProperty` method
  // https://tc39.es/ecma262/#sec-object.defineproperty
  defineProperty: $defineProperty,
  // `Object.defineProperties` method
  // https://tc39.es/ecma262/#sec-object.defineproperties
  defineProperties: $defineProperties,
  // `Object.getOwnPropertyDescriptor` method
  // https://tc39.es/ecma262/#sec-object.getownpropertydescriptors
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor
});

$$W({ target: 'Object', stat: true, forced: !NATIVE_SYMBOL$3 }, {
  // `Object.getOwnPropertyNames` method
  // https://tc39.es/ecma262/#sec-object.getownpropertynames
  getOwnPropertyNames: $getOwnPropertyNames
});

// `Symbol.prototype[@@toPrimitive]` method
// https://tc39.es/ecma262/#sec-symbol.prototype-@@toprimitive
defineSymbolToPrimitive();

// `Symbol.prototype[@@toStringTag]` property
// https://tc39.es/ecma262/#sec-symbol.prototype-@@tostringtag
setToStringTag$5($Symbol, SYMBOL);

hiddenKeys$1[HIDDEN] = true;

var NATIVE_SYMBOL$2 = nativeSymbol;

/* eslint-disable es-x/no-symbol -- safe */
var nativeSymbolRegistry = NATIVE_SYMBOL$2 && !!Symbol['for'] && !!Symbol.keyFor;

var $$V = _export;
var getBuiltIn$2 = getBuiltIn$9;
var hasOwn$4 = hasOwnProperty_1;
var toString$4 = toString$5;
var shared$1 = sharedExports;
var NATIVE_SYMBOL_REGISTRY$1 = nativeSymbolRegistry;

var StringToSymbolRegistry = shared$1('string-to-symbol-registry');
var SymbolToStringRegistry$1 = shared$1('symbol-to-string-registry');

// `Symbol.for` method
// https://tc39.es/ecma262/#sec-symbol.for
$$V({ target: 'Symbol', stat: true, forced: !NATIVE_SYMBOL_REGISTRY$1 }, {
  'for': function (key) {
    var string = toString$4(key);
    if (hasOwn$4(StringToSymbolRegistry, string)) return StringToSymbolRegistry[string];
    var symbol = getBuiltIn$2('Symbol')(string);
    StringToSymbolRegistry[string] = symbol;
    SymbolToStringRegistry$1[symbol] = string;
    return symbol;
  }
});

var $$U = _export;
var hasOwn$3 = hasOwnProperty_1;
var isSymbol$1 = isSymbol$4;
var tryToString$2 = tryToString$4;
var shared = sharedExports;
var NATIVE_SYMBOL_REGISTRY = nativeSymbolRegistry;

var SymbolToStringRegistry = shared('symbol-to-string-registry');

// `Symbol.keyFor` method
// https://tc39.es/ecma262/#sec-symbol.keyfor
$$U({ target: 'Symbol', stat: true, forced: !NATIVE_SYMBOL_REGISTRY }, {
  keyFor: function keyFor(sym) {
    if (!isSymbol$1(sym)) throw TypeError(tryToString$2(sym) + ' is not a symbol');
    if (hasOwn$3(SymbolToStringRegistry, sym)) return SymbolToStringRegistry[sym];
  }
});

var NATIVE_BIND = functionBindNative;

var FunctionPrototype = Function.prototype;
var apply$2 = FunctionPrototype.apply;
var call$7 = FunctionPrototype.call;

// eslint-disable-next-line es-x/no-reflect -- safe
var functionApply = typeof Reflect == 'object' && Reflect.apply || (NATIVE_BIND ? call$7.bind(apply$2) : function () {
  return call$7.apply(apply$2, arguments);
});

var uncurryThis$a = functionUncurryThis;

var arraySlice$2 = uncurryThis$a([].slice);

var $$T = _export;
var getBuiltIn$1 = getBuiltIn$9;
var apply$1 = functionApply;
var call$6 = functionCall;
var uncurryThis$9 = functionUncurryThis;
var fails$n = fails$y;
var isArray$5 = isArray$7;
var isCallable$4 = isCallable$h;
var isObject$9 = isObject$g;
var isSymbol = isSymbol$4;
var arraySlice$1 = arraySlice$2;
var NATIVE_SYMBOL$1 = nativeSymbol;

var $stringify = getBuiltIn$1('JSON', 'stringify');
var exec = uncurryThis$9(/./.exec);
var charAt$2 = uncurryThis$9(''.charAt);
var charCodeAt$1 = uncurryThis$9(''.charCodeAt);
var replace = uncurryThis$9(''.replace);
var numberToString = uncurryThis$9(1.0.toString);

var tester = /[\uD800-\uDFFF]/g;
var low = /^[\uD800-\uDBFF]$/;
var hi = /^[\uDC00-\uDFFF]$/;

var WRONG_SYMBOLS_CONVERSION = !NATIVE_SYMBOL$1 || fails$n(function () {
  var symbol = getBuiltIn$1('Symbol')();
  // MS Edge converts symbol values to JSON as {}
  return $stringify([symbol]) != '[null]'
    // WebKit converts symbol values to JSON as null
    || $stringify({ a: symbol }) != '{}'
    // V8 throws on boxed symbols
    || $stringify(Object(symbol)) != '{}';
});

// https://github.com/tc39/proposal-well-formed-stringify
var ILL_FORMED_UNICODE = fails$n(function () {
  return $stringify('\uDF06\uD834') !== '"\\udf06\\ud834"'
    || $stringify('\uDEAD') !== '"\\udead"';
});

var stringifyWithSymbolsFix = function (it, replacer) {
  var args = arraySlice$1(arguments);
  var $replacer = replacer;
  if (!isObject$9(replacer) && it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
  if (!isArray$5(replacer)) replacer = function (key, value) {
    if (isCallable$4($replacer)) value = call$6($replacer, this, key, value);
    if (!isSymbol(value)) return value;
  };
  args[1] = replacer;
  return apply$1($stringify, null, args);
};

var fixIllFormed = function (match, offset, string) {
  var prev = charAt$2(string, offset - 1);
  var next = charAt$2(string, offset + 1);
  if ((exec(low, match) && !exec(hi, next)) || (exec(hi, match) && !exec(low, prev))) {
    return '\\u' + numberToString(charCodeAt$1(match, 0), 16);
  } return match;
};

if ($stringify) {
  // `JSON.stringify` method
  // https://tc39.es/ecma262/#sec-json.stringify
  $$T({ target: 'JSON', stat: true, arity: 3, forced: WRONG_SYMBOLS_CONVERSION || ILL_FORMED_UNICODE }, {
    // eslint-disable-next-line no-unused-vars -- required for `.length`
    stringify: function stringify(it, replacer, space) {
      var args = arraySlice$1(arguments);
      var result = apply$1(WRONG_SYMBOLS_CONVERSION ? stringifyWithSymbolsFix : $stringify, null, args);
      return ILL_FORMED_UNICODE && typeof result == 'string' ? replace(result, tester, fixIllFormed) : result;
    }
  });
}

var $$S = _export;
var NATIVE_SYMBOL = nativeSymbol;
var fails$m = fails$y;
var getOwnPropertySymbolsModule$1 = objectGetOwnPropertySymbols;
var toObject$i = toObject$l;

// V8 ~ Chrome 38 and 39 `Object.getOwnPropertySymbols` fails on primitives
// https://bugs.chromium.org/p/v8/issues/detail?id=3443
var FORCED$8 = !NATIVE_SYMBOL || fails$m(function () { getOwnPropertySymbolsModule$1.f(1); });

// `Object.getOwnPropertySymbols` method
// https://tc39.es/ecma262/#sec-object.getownpropertysymbols
$$S({ target: 'Object', stat: true, forced: FORCED$8 }, {
  getOwnPropertySymbols: function getOwnPropertySymbols(it) {
    var $getOwnPropertySymbols = getOwnPropertySymbolsModule$1.f;
    return $getOwnPropertySymbols ? $getOwnPropertySymbols(toObject$i(it)) : [];
  }
});

var DESCRIPTORS$c = descriptors;
var uncurryThis$8 = functionUncurryThis;
var call$5 = functionCall;
var fails$l = fails$y;
var objectKeys$1 = objectKeys$4;
var getOwnPropertySymbolsModule = objectGetOwnPropertySymbols;
var propertyIsEnumerableModule = objectPropertyIsEnumerable;
var toObject$h = toObject$l;
var IndexedObject$2 = indexedObject;

// eslint-disable-next-line es-x/no-object-assign -- safe
var $assign = Object.assign;
// eslint-disable-next-line es-x/no-object-defineproperty -- required for testing
var defineProperty$3 = Object.defineProperty;
var concat = uncurryThis$8([].concat);

// `Object.assign` method
// https://tc39.es/ecma262/#sec-object.assign
var objectAssign = !$assign || fails$l(function () {
  // should have correct order of operations (Edge bug)
  if (DESCRIPTORS$c && $assign({ b: 1 }, $assign(defineProperty$3({}, 'a', {
    enumerable: true,
    get: function () {
      defineProperty$3(this, 'b', {
        value: 3,
        enumerable: false
      });
    }
  }), { b: 2 })).b !== 1) return true;
  // should work with symbols and should have deterministic property order (V8 bug)
  var A = {};
  var B = {};
  // eslint-disable-next-line es-x/no-symbol -- safe
  var symbol = Symbol();
  var alphabet = 'abcdefghijklmnopqrst';
  A[symbol] = 7;
  alphabet.split('').forEach(function (chr) { B[chr] = chr; });
  return $assign({}, A)[symbol] != 7 || objectKeys$1($assign({}, B)).join('') != alphabet;
}) ? function assign(target, source) { // eslint-disable-line no-unused-vars -- required for `.length`
  var T = toObject$h(target);
  var argumentsLength = arguments.length;
  var index = 1;
  var getOwnPropertySymbols = getOwnPropertySymbolsModule.f;
  var propertyIsEnumerable = propertyIsEnumerableModule.f;
  while (argumentsLength > index) {
    var S = IndexedObject$2(arguments[index++]);
    var keys = getOwnPropertySymbols ? concat(objectKeys$1(S), getOwnPropertySymbols(S)) : objectKeys$1(S);
    var length = keys.length;
    var j = 0;
    var key;
    while (length > j) {
      key = keys[j++];
      if (!DESCRIPTORS$c || call$5(propertyIsEnumerable, S, key)) T[key] = S[key];
    }
  } return T;
} : $assign;

var $$R = _export;
var assign = objectAssign;

// `Object.assign` method
// https://tc39.es/ecma262/#sec-object.assign
// eslint-disable-next-line es-x/no-object-assign -- required for testing
$$R({ target: 'Object', stat: true, arity: 2, forced: Object.assign !== assign }, {
  assign: assign
});

// TODO: Remove from `core-js@4`
var $$Q = _export;
var DESCRIPTORS$b = descriptors;
var create$2 = objectCreate;

// `Object.create` method
// https://tc39.es/ecma262/#sec-object.create
$$Q({ target: 'Object', stat: true, sham: !DESCRIPTORS$b }, {
  create: create$2
});

var $$P = _export;
var DESCRIPTORS$a = descriptors;
var defineProperty$2 = objectDefineProperty.f;

// `Object.defineProperty` method
// https://tc39.es/ecma262/#sec-object.defineproperty
// eslint-disable-next-line es-x/no-object-defineproperty -- safe
$$P({ target: 'Object', stat: true, forced: Object.defineProperty !== defineProperty$2, sham: !DESCRIPTORS$a }, {
  defineProperty: defineProperty$2
});

var $$O = _export;
var DESCRIPTORS$9 = descriptors;
var defineProperties = objectDefineProperties.f;

// `Object.defineProperties` method
// https://tc39.es/ecma262/#sec-object.defineproperties
// eslint-disable-next-line es-x/no-object-defineproperties -- safe
$$O({ target: 'Object', stat: true, forced: Object.defineProperties !== defineProperties, sham: !DESCRIPTORS$9 }, {
  defineProperties: defineProperties
});

var DESCRIPTORS$8 = descriptors;
var uncurryThis$7 = functionUncurryThis;
var objectKeys = objectKeys$4;
var toIndexedObject$6 = toIndexedObject$d;
var $propertyIsEnumerable = objectPropertyIsEnumerable.f;

var propertyIsEnumerable = uncurryThis$7($propertyIsEnumerable);
var push$1 = uncurryThis$7([].push);

// `Object.{ entries, values }` methods implementation
var createMethod$2 = function (TO_ENTRIES) {
  return function (it) {
    var O = toIndexedObject$6(it);
    var keys = objectKeys(O);
    var length = keys.length;
    var i = 0;
    var result = [];
    var key;
    while (length > i) {
      key = keys[i++];
      if (!DESCRIPTORS$8 || propertyIsEnumerable(O, key)) {
        push$1(result, TO_ENTRIES ? [key, O[key]] : O[key]);
      }
    }
    return result;
  };
};

var objectToArray = {
  // `Object.entries` method
  // https://tc39.es/ecma262/#sec-object.entries
  entries: createMethod$2(true),
  // `Object.values` method
  // https://tc39.es/ecma262/#sec-object.values
  values: createMethod$2(false)
};

var $$N = _export;
var $entries = objectToArray.entries;

// `Object.entries` method
// https://tc39.es/ecma262/#sec-object.entries
$$N({ target: 'Object', stat: true }, {
  entries: function entries(O) {
    return $entries(O);
  }
});

var fails$k = fails$y;

var freezing = !fails$k(function () {
  // eslint-disable-next-line es-x/no-object-isextensible, es-x/no-object-preventextensions -- required for testing
  return Object.isExtensible(Object.preventExtensions({}));
});

var internalMetadata = {exports: {}};

// FF26- bug: ArrayBuffers are non-extensible, but Object.isExtensible does not report it
var fails$j = fails$y;

var arrayBufferNonExtensible = fails$j(function () {
  if (typeof ArrayBuffer == 'function') {
    var buffer = new ArrayBuffer(8);
    // eslint-disable-next-line es-x/no-object-isextensible, es-x/no-object-defineproperty -- safe
    if (Object.isExtensible(buffer)) Object.defineProperty(buffer, 'a', { value: 8 });
  }
});

var fails$i = fails$y;
var isObject$8 = isObject$g;
var classof$5 = classofRaw$1;
var ARRAY_BUFFER_NON_EXTENSIBLE$2 = arrayBufferNonExtensible;

// eslint-disable-next-line es-x/no-object-isextensible -- safe
var $isExtensible$1 = Object.isExtensible;
var FAILS_ON_PRIMITIVES$9 = fails$i(function () { $isExtensible$1(1); });

// `Object.isExtensible` method
// https://tc39.es/ecma262/#sec-object.isextensible
var objectIsExtensible = (FAILS_ON_PRIMITIVES$9 || ARRAY_BUFFER_NON_EXTENSIBLE$2) ? function isExtensible(it) {
  if (!isObject$8(it)) return false;
  if (ARRAY_BUFFER_NON_EXTENSIBLE$2 && classof$5(it) == 'ArrayBuffer') return false;
  return $isExtensible$1 ? $isExtensible$1(it) : true;
} : $isExtensible$1;

var $$M = _export;
var uncurryThis$6 = functionUncurryThis;
var hiddenKeys = hiddenKeys$6;
var isObject$7 = isObject$g;
var hasOwn$2 = hasOwnProperty_1;
var defineProperty$1 = objectDefineProperty.f;
var getOwnPropertyNamesModule = objectGetOwnPropertyNames;
var getOwnPropertyNamesExternalModule = objectGetOwnPropertyNamesExternal;
var isExtensible = objectIsExtensible;
var uid = uid$4;
var FREEZING$3 = freezing;

var REQUIRED = false;
var METADATA = uid('meta');
var id = 0;

var setMetadata = function (it) {
  defineProperty$1(it, METADATA, { value: {
    objectID: 'O' + id++, // object ID
    weakData: {}          // weak collections IDs
  } });
};

var fastKey = function (it, create) {
  // return a primitive with prefix
  if (!isObject$7(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if (!hasOwn$2(it, METADATA)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return 'F';
    // not necessary to add metadata
    if (!create) return 'E';
    // add missing metadata
    setMetadata(it);
  // return object ID
  } return it[METADATA].objectID;
};

var getWeakData = function (it, create) {
  if (!hasOwn$2(it, METADATA)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return true;
    // not necessary to add metadata
    if (!create) return false;
    // add missing metadata
    setMetadata(it);
  // return the store of weak collections IDs
  } return it[METADATA].weakData;
};

// add metadata on freeze-family methods calling
var onFreeze$3 = function (it) {
  if (FREEZING$3 && REQUIRED && isExtensible(it) && !hasOwn$2(it, METADATA)) setMetadata(it);
  return it;
};

var enable = function () {
  meta.enable = function () { /* empty */ };
  REQUIRED = true;
  var getOwnPropertyNames = getOwnPropertyNamesModule.f;
  var splice = uncurryThis$6([].splice);
  var test = {};
  test[METADATA] = 1;

  // prevent exposing of metadata key
  if (getOwnPropertyNames(test).length) {
    getOwnPropertyNamesModule.f = function (it) {
      var result = getOwnPropertyNames(it);
      for (var i = 0, length = result.length; i < length; i++) {
        if (result[i] === METADATA) {
          splice(result, i, 1);
          break;
        }
      } return result;
    };

    $$M({ target: 'Object', stat: true, forced: true }, {
      getOwnPropertyNames: getOwnPropertyNamesExternalModule.f
    });
  }
};

var meta = internalMetadata.exports = {
  enable: enable,
  fastKey: fastKey,
  getWeakData: getWeakData,
  onFreeze: onFreeze$3
};

hiddenKeys[METADATA] = true;

var internalMetadataExports = internalMetadata.exports;

var $$L = _export;
var FREEZING$2 = freezing;
var fails$h = fails$y;
var isObject$6 = isObject$g;
var onFreeze$2 = internalMetadataExports.onFreeze;

// eslint-disable-next-line es-x/no-object-freeze -- safe
var $freeze = Object.freeze;
var FAILS_ON_PRIMITIVES$8 = fails$h(function () { $freeze(1); });

// `Object.freeze` method
// https://tc39.es/ecma262/#sec-object.freeze
$$L({ target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES$8, sham: !FREEZING$2 }, {
  freeze: function freeze(it) {
    return $freeze && isObject$6(it) ? $freeze(onFreeze$2(it)) : it;
  }
});

var iterators = {};

var wellKnownSymbol$9 = wellKnownSymbol$i;
var Iterators$4 = iterators;

var ITERATOR$4 = wellKnownSymbol$9('iterator');
var ArrayPrototype$1 = Array.prototype;

// check on default Array iterator
var isArrayIteratorMethod$2 = function (it) {
  return it !== undefined && (Iterators$4.Array === it || ArrayPrototype$1[ITERATOR$4] === it);
};

var classof$4 = classof$a;
var getMethod$1 = getMethod$3;
var Iterators$3 = iterators;
var wellKnownSymbol$8 = wellKnownSymbol$i;

var ITERATOR$3 = wellKnownSymbol$8('iterator');

var getIteratorMethod$3 = function (it) {
  if (it != undefined) return getMethod$1(it, ITERATOR$3)
    || getMethod$1(it, '@@iterator')
    || Iterators$3[classof$4(it)];
};

var global$f = global$H;
var call$4 = functionCall;
var aCallable$5 = aCallable$8;
var anObject$4 = anObject$a;
var tryToString$1 = tryToString$4;
var getIteratorMethod$2 = getIteratorMethod$3;

var TypeError$7 = global$f.TypeError;

var getIterator$2 = function (argument, usingIterator) {
  var iteratorMethod = arguments.length < 2 ? getIteratorMethod$2(argument) : usingIterator;
  if (aCallable$5(iteratorMethod)) return anObject$4(call$4(iteratorMethod, argument));
  throw TypeError$7(tryToString$1(argument) + ' is not iterable');
};

var call$3 = functionCall;
var anObject$3 = anObject$a;
var getMethod = getMethod$3;

var iteratorClose$2 = function (iterator, kind, value) {
  var innerResult, innerError;
  anObject$3(iterator);
  try {
    innerResult = getMethod(iterator, 'return');
    if (!innerResult) {
      if (kind === 'throw') throw value;
      return value;
    }
    innerResult = call$3(innerResult, iterator);
  } catch (error) {
    innerError = true;
    innerResult = error;
  }
  if (kind === 'throw') throw value;
  if (innerError) throw innerResult;
  anObject$3(innerResult);
  return value;
};

var global$e = global$H;
var bind$2 = functionBindContext;
var call$2 = functionCall;
var anObject$2 = anObject$a;
var tryToString = tryToString$4;
var isArrayIteratorMethod$1 = isArrayIteratorMethod$2;
var lengthOfArrayLike$d = lengthOfArrayLike$h;
var isPrototypeOf = objectIsPrototypeOf;
var getIterator$1 = getIterator$2;
var getIteratorMethod$1 = getIteratorMethod$3;
var iteratorClose$1 = iteratorClose$2;

var TypeError$6 = global$e.TypeError;

var Result = function (stopped, result) {
  this.stopped = stopped;
  this.result = result;
};

var ResultPrototype = Result.prototype;

var iterate$1 = function (iterable, unboundFunction, options) {
  var that = options && options.that;
  var AS_ENTRIES = !!(options && options.AS_ENTRIES);
  var IS_ITERATOR = !!(options && options.IS_ITERATOR);
  var INTERRUPTED = !!(options && options.INTERRUPTED);
  var fn = bind$2(unboundFunction, that);
  var iterator, iterFn, index, length, result, next, step;

  var stop = function (condition) {
    if (iterator) iteratorClose$1(iterator, 'normal', condition);
    return new Result(true, condition);
  };

  var callFn = function (value) {
    if (AS_ENTRIES) {
      anObject$2(value);
      return INTERRUPTED ? fn(value[0], value[1], stop) : fn(value[0], value[1]);
    } return INTERRUPTED ? fn(value, stop) : fn(value);
  };

  if (IS_ITERATOR) {
    iterator = iterable;
  } else {
    iterFn = getIteratorMethod$1(iterable);
    if (!iterFn) throw TypeError$6(tryToString(iterable) + ' is not iterable');
    // optimisation for array iterators
    if (isArrayIteratorMethod$1(iterFn)) {
      for (index = 0, length = lengthOfArrayLike$d(iterable); length > index; index++) {
        result = callFn(iterable[index]);
        if (result && isPrototypeOf(ResultPrototype, result)) return result;
      } return new Result(false);
    }
    iterator = getIterator$1(iterable, iterFn);
  }

  next = iterator.next;
  while (!(step = call$2(next, iterator)).done) {
    try {
      result = callFn(step.value);
    } catch (error) {
      iteratorClose$1(iterator, 'throw', error);
    }
    if (typeof result == 'object' && result && isPrototypeOf(ResultPrototype, result)) return result;
  } return new Result(false);
};

var $$K = _export;
var iterate = iterate$1;
var createProperty$6 = createProperty$8;

// `Object.fromEntries` method
// https://github.com/tc39/proposal-object-from-entries
$$K({ target: 'Object', stat: true }, {
  fromEntries: function fromEntries(iterable) {
    var obj = {};
    iterate(iterable, function (k, v) {
      createProperty$6(obj, k, v);
    }, { AS_ENTRIES: true });
    return obj;
  }
});

var $$J = _export;
var fails$g = fails$y;
var toIndexedObject$5 = toIndexedObject$d;
var nativeGetOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
var DESCRIPTORS$7 = descriptors;

var FAILS_ON_PRIMITIVES$7 = fails$g(function () { nativeGetOwnPropertyDescriptor(1); });
var FORCED$7 = !DESCRIPTORS$7 || FAILS_ON_PRIMITIVES$7;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.es/ecma262/#sec-object.getownpropertydescriptor
$$J({ target: 'Object', stat: true, forced: FORCED$7, sham: !DESCRIPTORS$7 }, {
  getOwnPropertyDescriptor: function getOwnPropertyDescriptor(it, key) {
    return nativeGetOwnPropertyDescriptor(toIndexedObject$5(it), key);
  }
});

var $$I = _export;
var DESCRIPTORS$6 = descriptors;
var ownKeys = ownKeys$2;
var toIndexedObject$4 = toIndexedObject$d;
var getOwnPropertyDescriptorModule = objectGetOwnPropertyDescriptor;
var createProperty$5 = createProperty$8;

// `Object.getOwnPropertyDescriptors` method
// https://tc39.es/ecma262/#sec-object.getownpropertydescriptors
$$I({ target: 'Object', stat: true, sham: !DESCRIPTORS$6 }, {
  getOwnPropertyDescriptors: function getOwnPropertyDescriptors(object) {
    var O = toIndexedObject$4(object);
    var getOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;
    var keys = ownKeys(O);
    var result = {};
    var index = 0;
    var key, descriptor;
    while (keys.length > index) {
      descriptor = getOwnPropertyDescriptor(O, key = keys[index++]);
      if (descriptor !== undefined) createProperty$5(result, key, descriptor);
    }
    return result;
  }
});

var $$H = _export;
var fails$f = fails$y;
var getOwnPropertyNames = objectGetOwnPropertyNamesExternal.f;

// eslint-disable-next-line es-x/no-object-getownpropertynames -- required for testing
var FAILS_ON_PRIMITIVES$6 = fails$f(function () { return !Object.getOwnPropertyNames(1); });

// `Object.getOwnPropertyNames` method
// https://tc39.es/ecma262/#sec-object.getownpropertynames
$$H({ target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES$6 }, {
  getOwnPropertyNames: getOwnPropertyNames
});

var fails$e = fails$y;

var correctPrototypeGetter = !fails$e(function () {
  function F() { /* empty */ }
  F.prototype.constructor = null;
  // eslint-disable-next-line es-x/no-object-getprototypeof -- required for testing
  return Object.getPrototypeOf(new F()) !== F.prototype;
});

var global$d = global$H;
var hasOwn$1 = hasOwnProperty_1;
var isCallable$3 = isCallable$h;
var toObject$g = toObject$l;
var sharedKey = sharedKey$4;
var CORRECT_PROTOTYPE_GETTER$1 = correctPrototypeGetter;

var IE_PROTO = sharedKey('IE_PROTO');
var Object$1 = global$d.Object;
var ObjectPrototype = Object$1.prototype;

// `Object.getPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.getprototypeof
var objectGetPrototypeOf = CORRECT_PROTOTYPE_GETTER$1 ? Object$1.getPrototypeOf : function (O) {
  var object = toObject$g(O);
  if (hasOwn$1(object, IE_PROTO)) return object[IE_PROTO];
  var constructor = object.constructor;
  if (isCallable$3(constructor) && object instanceof constructor) {
    return constructor.prototype;
  } return object instanceof Object$1 ? ObjectPrototype : null;
};

var $$G = _export;
var fails$d = fails$y;
var toObject$f = toObject$l;
var nativeGetPrototypeOf = objectGetPrototypeOf;
var CORRECT_PROTOTYPE_GETTER = correctPrototypeGetter;

var FAILS_ON_PRIMITIVES$5 = fails$d(function () { nativeGetPrototypeOf(1); });

// `Object.getPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.getprototypeof
$$G({ target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES$5, sham: !CORRECT_PROTOTYPE_GETTER }, {
  getPrototypeOf: function getPrototypeOf(it) {
    return nativeGetPrototypeOf(toObject$f(it));
  }
});

var $$F = _export;
var hasOwn = hasOwnProperty_1;

// `Object.hasOwn` method
// https://github.com/tc39/proposal-accessible-object-hasownproperty
$$F({ target: 'Object', stat: true }, {
  hasOwn: hasOwn
});

// `SameValue` abstract operation
// https://tc39.es/ecma262/#sec-samevalue
// eslint-disable-next-line es-x/no-object-is -- safe
var sameValue = Object.is || function is(x, y) {
  // eslint-disable-next-line no-self-compare -- NaN check
  return x === y ? x !== 0 || 1 / x === 1 / y : x != x && y != y;
};

var $$E = _export;
var is = sameValue;

// `Object.is` method
// https://tc39.es/ecma262/#sec-object.is
$$E({ target: 'Object', stat: true }, {
  is: is
});

var $$D = _export;
var $isExtensible = objectIsExtensible;

// `Object.isExtensible` method
// https://tc39.es/ecma262/#sec-object.isextensible
// eslint-disable-next-line es-x/no-object-isextensible -- safe
$$D({ target: 'Object', stat: true, forced: Object.isExtensible !== $isExtensible }, {
  isExtensible: $isExtensible
});

var $$C = _export;
var fails$c = fails$y;
var isObject$5 = isObject$g;
var classof$3 = classofRaw$1;
var ARRAY_BUFFER_NON_EXTENSIBLE$1 = arrayBufferNonExtensible;

// eslint-disable-next-line es-x/no-object-isfrozen -- safe
var $isFrozen = Object.isFrozen;
var FAILS_ON_PRIMITIVES$4 = fails$c(function () { $isFrozen(1); });

// `Object.isFrozen` method
// https://tc39.es/ecma262/#sec-object.isfrozen
$$C({ target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES$4 || ARRAY_BUFFER_NON_EXTENSIBLE$1 }, {
  isFrozen: function isFrozen(it) {
    if (!isObject$5(it)) return true;
    if (ARRAY_BUFFER_NON_EXTENSIBLE$1 && classof$3(it) == 'ArrayBuffer') return true;
    return $isFrozen ? $isFrozen(it) : false;
  }
});

var $$B = _export;
var fails$b = fails$y;
var isObject$4 = isObject$g;
var classof$2 = classofRaw$1;
var ARRAY_BUFFER_NON_EXTENSIBLE = arrayBufferNonExtensible;

// eslint-disable-next-line es-x/no-object-issealed -- safe
var $isSealed = Object.isSealed;
var FAILS_ON_PRIMITIVES$3 = fails$b(function () { $isSealed(1); });

// `Object.isSealed` method
// https://tc39.es/ecma262/#sec-object.issealed
$$B({ target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES$3 || ARRAY_BUFFER_NON_EXTENSIBLE }, {
  isSealed: function isSealed(it) {
    if (!isObject$4(it)) return true;
    if (ARRAY_BUFFER_NON_EXTENSIBLE && classof$2(it) == 'ArrayBuffer') return true;
    return $isSealed ? $isSealed(it) : false;
  }
});

var $$A = _export;
var toObject$e = toObject$l;
var nativeKeys = objectKeys$4;
var fails$a = fails$y;

var FAILS_ON_PRIMITIVES$2 = fails$a(function () { nativeKeys(1); });

// `Object.keys` method
// https://tc39.es/ecma262/#sec-object.keys
$$A({ target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES$2 }, {
  keys: function keys(it) {
    return nativeKeys(toObject$e(it));
  }
});

var $$z = _export;
var isObject$3 = isObject$g;
var onFreeze$1 = internalMetadataExports.onFreeze;
var FREEZING$1 = freezing;
var fails$9 = fails$y;

// eslint-disable-next-line es-x/no-object-preventextensions -- safe
var $preventExtensions = Object.preventExtensions;
var FAILS_ON_PRIMITIVES$1 = fails$9(function () { $preventExtensions(1); });

// `Object.preventExtensions` method
// https://tc39.es/ecma262/#sec-object.preventextensions
$$z({ target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES$1, sham: !FREEZING$1 }, {
  preventExtensions: function preventExtensions(it) {
    return $preventExtensions && isObject$3(it) ? $preventExtensions(onFreeze$1(it)) : it;
  }
});

var $$y = _export;
var isObject$2 = isObject$g;
var onFreeze = internalMetadataExports.onFreeze;
var FREEZING = freezing;
var fails$8 = fails$y;

// eslint-disable-next-line es-x/no-object-seal -- safe
var $seal = Object.seal;
var FAILS_ON_PRIMITIVES = fails$8(function () { $seal(1); });

// `Object.seal` method
// https://tc39.es/ecma262/#sec-object.seal
$$y({ target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES, sham: !FREEZING }, {
  seal: function seal(it) {
    return $seal && isObject$2(it) ? $seal(onFreeze(it)) : it;
  }
});

var global$c = global$H;
var isCallable$2 = isCallable$h;

var String$1 = global$c.String;
var TypeError$5 = global$c.TypeError;

var aPossiblePrototype$1 = function (argument) {
  if (typeof argument == 'object' || isCallable$2(argument)) return argument;
  throw TypeError$5("Can't set " + String$1(argument) + ' as a prototype');
};

/* eslint-disable no-proto -- safe */

var uncurryThis$5 = functionUncurryThis;
var anObject$1 = anObject$a;
var aPossiblePrototype = aPossiblePrototype$1;

// `Object.setPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.setprototypeof
// Works with __proto__ only. Old v8 can't work with null proto objects.
// eslint-disable-next-line es-x/no-object-setprototypeof -- safe
var objectSetPrototypeOf = Object.setPrototypeOf || ('__proto__' in {} ? function () {
  var CORRECT_SETTER = false;
  var test = {};
  var setter;
  try {
    // eslint-disable-next-line es-x/no-object-getownpropertydescriptor -- safe
    setter = uncurryThis$5(Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set);
    setter(test, []);
    CORRECT_SETTER = test instanceof Array;
  } catch (error) { /* empty */ }
  return function setPrototypeOf(O, proto) {
    anObject$1(O);
    aPossiblePrototype(proto);
    if (CORRECT_SETTER) setter(O, proto);
    else O.__proto__ = proto;
    return O;
  };
}() : undefined);

var $$x = _export;
var setPrototypeOf$1 = objectSetPrototypeOf;

// `Object.setPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.setprototypeof
$$x({ target: 'Object', stat: true }, {
  setPrototypeOf: setPrototypeOf$1
});

var $$w = _export;
var $values = objectToArray.values;

// `Object.values` method
// https://tc39.es/ecma262/#sec-object.values
$$w({ target: 'Object', stat: true }, {
  values: function values(O) {
    return $values(O);
  }
});

var TO_STRING_TAG_SUPPORT$1 = toStringTagSupport;
var classof$1 = classof$a;

// `Object.prototype.toString` method implementation
// https://tc39.es/ecma262/#sec-object.prototype.tostring
var objectToString = TO_STRING_TAG_SUPPORT$1 ? {}.toString : function toString() {
  return '[object ' + classof$1(this) + ']';
};

var TO_STRING_TAG_SUPPORT = toStringTagSupport;
var defineBuiltIn$2 = defineBuiltIn$6;
var toString$3 = objectToString;

// `Object.prototype.toString` method
// https://tc39.es/ecma262/#sec-object.prototype.tostring
if (!TO_STRING_TAG_SUPPORT) {
  defineBuiltIn$2(Object.prototype, 'toString', toString$3, { unsafe: true });
}

var userAgent$1 = engineUserAgent;

var webkit = userAgent$1.match(/AppleWebKit\/(\d+)\./);

var engineWebkitVersion = !!webkit && +webkit[1];

var global$b = global$H;
var fails$7 = fails$y;
var WEBKIT$1 = engineWebkitVersion;

// Forced replacement object prototype accessors methods
var objectPrototypeAccessorsForced = !fails$7(function () {
  // This feature detection crashes old WebKit
  // https://github.com/zloirock/core-js/issues/232
  if (WEBKIT$1 && WEBKIT$1 < 535) return;
  var key = Math.random();
  // In FF throws only define methods
  // eslint-disable-next-line no-undef, no-useless-call, es-x/no-legacy-object-prototype-accessor-methods -- required for testing
  __defineSetter__.call(null, key, function () { /* empty */ });
  delete global$b[key];
});

var $$v = _export;
var DESCRIPTORS$5 = descriptors;
var FORCED$6 = objectPrototypeAccessorsForced;
var aCallable$4 = aCallable$8;
var toObject$d = toObject$l;
var definePropertyModule$3 = objectDefineProperty;

// `Object.prototype.__defineGetter__` method
// https://tc39.es/ecma262/#sec-object.prototype.__defineGetter__
if (DESCRIPTORS$5) {
  $$v({ target: 'Object', proto: true, forced: FORCED$6 }, {
    __defineGetter__: function __defineGetter__(P, getter) {
      definePropertyModule$3.f(toObject$d(this), P, { get: aCallable$4(getter), enumerable: true, configurable: true });
    }
  });
}

var $$u = _export;
var DESCRIPTORS$4 = descriptors;
var FORCED$5 = objectPrototypeAccessorsForced;
var aCallable$3 = aCallable$8;
var toObject$c = toObject$l;
var definePropertyModule$2 = objectDefineProperty;

// `Object.prototype.__defineSetter__` method
// https://tc39.es/ecma262/#sec-object.prototype.__defineSetter__
if (DESCRIPTORS$4) {
  $$u({ target: 'Object', proto: true, forced: FORCED$5 }, {
    __defineSetter__: function __defineSetter__(P, setter) {
      definePropertyModule$2.f(toObject$c(this), P, { set: aCallable$3(setter), enumerable: true, configurable: true });
    }
  });
}

var $$t = _export;
var DESCRIPTORS$3 = descriptors;
var FORCED$4 = objectPrototypeAccessorsForced;
var toObject$b = toObject$l;
var toPropertyKey$1 = toPropertyKey$6;
var getPrototypeOf$3 = objectGetPrototypeOf;
var getOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;

// `Object.prototype.__lookupGetter__` method
// https://tc39.es/ecma262/#sec-object.prototype.__lookupGetter__
if (DESCRIPTORS$3) {
  $$t({ target: 'Object', proto: true, forced: FORCED$4 }, {
    __lookupGetter__: function __lookupGetter__(P) {
      var O = toObject$b(this);
      var key = toPropertyKey$1(P);
      var desc;
      do {
        if (desc = getOwnPropertyDescriptor$1(O, key)) return desc.get;
      } while (O = getPrototypeOf$3(O));
    }
  });
}

var $$s = _export;
var DESCRIPTORS$2 = descriptors;
var FORCED$3 = objectPrototypeAccessorsForced;
var toObject$a = toObject$l;
var toPropertyKey = toPropertyKey$6;
var getPrototypeOf$2 = objectGetPrototypeOf;
var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;

// `Object.prototype.__lookupSetter__` method
// https://tc39.es/ecma262/#sec-object.prototype.__lookupSetter__
if (DESCRIPTORS$2) {
  $$s({ target: 'Object', proto: true, forced: FORCED$3 }, {
    __lookupSetter__: function __lookupSetter__(P) {
      var O = toObject$a(this);
      var key = toPropertyKey(P);
      var desc;
      do {
        if (desc = getOwnPropertyDescriptor(O, key)) return desc.set;
      } while (O = getPrototypeOf$2(O));
    }
  });
}

var global$a = global$H;
var setToStringTag$4 = setToStringTag$6;

// JSON[@@toStringTag] property
// https://tc39.es/ecma262/#sec-json-@@tostringtag
setToStringTag$4(global$a.JSON, 'JSON', true);

var setToStringTag$3 = setToStringTag$6;

// Math[@@toStringTag] property
// https://tc39.es/ecma262/#sec-math-@@tostringtag
setToStringTag$3(Math, 'Math', true);

var $$r = _export;
var global$9 = global$H;
var setToStringTag$2 = setToStringTag$6;

$$r({ global: true }, { Reflect: {} });

// Reflect[@@toStringTag] property
// https://tc39.es/ecma262/#sec-reflect-@@tostringtag
setToStringTag$2(global$9.Reflect, 'Reflect', true);

var path$1 = path$3;

path$1.Object;

var anObject = anObject$a;
var iteratorClose = iteratorClose$2;

// call something on iterator step with safe closing on error
var callWithSafeIterationClosing$1 = function (iterator, fn, value, ENTRIES) {
  try {
    return ENTRIES ? fn(anObject(value)[0], value[1]) : fn(value);
  } catch (error) {
    iteratorClose(iterator, 'throw', error);
  }
};

var global$8 = global$H;
var bind$1 = functionBindContext;
var call$1 = functionCall;
var toObject$9 = toObject$l;
var callWithSafeIterationClosing = callWithSafeIterationClosing$1;
var isArrayIteratorMethod = isArrayIteratorMethod$2;
var isConstructor$2 = isConstructor$4;
var lengthOfArrayLike$c = lengthOfArrayLike$h;
var createProperty$4 = createProperty$8;
var getIterator = getIterator$2;
var getIteratorMethod = getIteratorMethod$3;

var Array$3 = global$8.Array;

// `Array.from` method implementation
// https://tc39.es/ecma262/#sec-array.from
var arrayFrom = function from(arrayLike /* , mapfn = undefined, thisArg = undefined */) {
  var O = toObject$9(arrayLike);
  var IS_CONSTRUCTOR = isConstructor$2(this);
  var argumentsLength = arguments.length;
  var mapfn = argumentsLength > 1 ? arguments[1] : undefined;
  var mapping = mapfn !== undefined;
  if (mapping) mapfn = bind$1(mapfn, argumentsLength > 2 ? arguments[2] : undefined);
  var iteratorMethod = getIteratorMethod(O);
  var index = 0;
  var length, result, step, iterator, next, value;
  // if the target is not iterable or it's an array with the default iterator - use a simple case
  if (iteratorMethod && !(this == Array$3 && isArrayIteratorMethod(iteratorMethod))) {
    iterator = getIterator(O, iteratorMethod);
    next = iterator.next;
    result = IS_CONSTRUCTOR ? new this() : [];
    for (;!(step = call$1(next, iterator)).done; index++) {
      value = mapping ? callWithSafeIterationClosing(iterator, mapfn, [step.value, index], true) : step.value;
      createProperty$4(result, index, value);
    }
  } else {
    length = lengthOfArrayLike$c(O);
    result = IS_CONSTRUCTOR ? new this(length) : Array$3(length);
    for (;length > index; index++) {
      value = mapping ? mapfn(O[index], index) : O[index];
      createProperty$4(result, index, value);
    }
  }
  result.length = index;
  return result;
};

var wellKnownSymbol$7 = wellKnownSymbol$i;

var ITERATOR$2 = wellKnownSymbol$7('iterator');
var SAFE_CLOSING = false;

try {
  var called = 0;
  var iteratorWithReturn = {
    next: function () {
      return { done: !!called++ };
    },
    'return': function () {
      SAFE_CLOSING = true;
    }
  };
  iteratorWithReturn[ITERATOR$2] = function () {
    return this;
  };
  // eslint-disable-next-line es-x/no-array-from, no-throw-literal -- required for testing
  Array.from(iteratorWithReturn, function () { throw 2; });
} catch (error) { /* empty */ }

var checkCorrectnessOfIteration$1 = function (exec, SKIP_CLOSING) {
  if (!SKIP_CLOSING && !SAFE_CLOSING) return false;
  var ITERATION_SUPPORT = false;
  try {
    var object = {};
    object[ITERATOR$2] = function () {
      return {
        next: function () {
          return { done: ITERATION_SUPPORT = true };
        }
      };
    };
    exec(object);
  } catch (error) { /* empty */ }
  return ITERATION_SUPPORT;
};

var $$q = _export;
var from = arrayFrom;
var checkCorrectnessOfIteration = checkCorrectnessOfIteration$1;

var INCORRECT_ITERATION = !checkCorrectnessOfIteration(function (iterable) {
  // eslint-disable-next-line es-x/no-array-from -- required for testing
  Array.from(iterable);
});

// `Array.from` method
// https://tc39.es/ecma262/#sec-array.from
$$q({ target: 'Array', stat: true, forced: INCORRECT_ITERATION }, {
  from: from
});

var $$p = _export;
var isArray$4 = isArray$7;

// `Array.isArray` method
// https://tc39.es/ecma262/#sec-array.isarray
$$p({ target: 'Array', stat: true }, {
  isArray: isArray$4
});

var $$o = _export;
var global$7 = global$H;
var fails$6 = fails$y;
var isConstructor$1 = isConstructor$4;
var createProperty$3 = createProperty$8;

var Array$2 = global$7.Array;

var ISNT_GENERIC = fails$6(function () {
  function F() { /* empty */ }
  return !(Array$2.of.call(F) instanceof F);
});

// `Array.of` method
// https://tc39.es/ecma262/#sec-array.of
// WebKit Array.of isn't generic
$$o({ target: 'Array', stat: true, forced: ISNT_GENERIC }, {
  of: function of(/* ...args */) {
    var index = 0;
    var argumentsLength = arguments.length;
    var result = new (isConstructor$1(this) ? this : Array$2)(argumentsLength);
    while (argumentsLength > index) createProperty$3(result, index, arguments[index++]);
    result.length = argumentsLength;
    return result;
  }
});

var wellKnownSymbol$6 = wellKnownSymbol$i;
var create$1 = objectCreate;
var definePropertyModule$1 = objectDefineProperty;

var UNSCOPABLES = wellKnownSymbol$6('unscopables');
var ArrayPrototype = Array.prototype;

// Array.prototype[@@unscopables]
// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
if (ArrayPrototype[UNSCOPABLES] == undefined) {
  definePropertyModule$1.f(ArrayPrototype, UNSCOPABLES, {
    configurable: true,
    value: create$1(null)
  });
}

// add a key to Array.prototype[@@unscopables]
var addToUnscopables$9 = function (key) {
  ArrayPrototype[UNSCOPABLES][key] = true;
};

var $$n = _export;
var toObject$8 = toObject$l;
var lengthOfArrayLike$b = lengthOfArrayLike$h;
var toIntegerOrInfinity$4 = toIntegerOrInfinity$7;
var addToUnscopables$8 = addToUnscopables$9;

// `Array.prototype.at` method
// https://github.com/tc39/proposal-relative-indexing-method
$$n({ target: 'Array', proto: true }, {
  at: function at(index) {
    var O = toObject$8(this);
    var len = lengthOfArrayLike$b(O);
    var relativeIndex = toIntegerOrInfinity$4(index);
    var k = relativeIndex >= 0 ? relativeIndex : len + relativeIndex;
    return (k < 0 || k >= len) ? undefined : O[k];
  }
});

addToUnscopables$8('at');

var fails$5 = fails$y;
var wellKnownSymbol$5 = wellKnownSymbol$i;
var V8_VERSION$1 = engineV8Version;

var SPECIES$2 = wellKnownSymbol$5('species');

var arrayMethodHasSpeciesSupport$5 = function (METHOD_NAME) {
  // We can't use this feature detection in V8 since it causes
  // deoptimization and serious performance degradation
  // https://github.com/zloirock/core-js/issues/677
  return V8_VERSION$1 >= 51 || !fails$5(function () {
    var array = [];
    var constructor = array.constructor = {};
    constructor[SPECIES$2] = function () {
      return { foo: 1 };
    };
    return array[METHOD_NAME](Boolean).foo !== 1;
  });
};

var $$m = _export;
var global$6 = global$H;
var fails$4 = fails$y;
var isArray$3 = isArray$7;
var isObject$1 = isObject$g;
var toObject$7 = toObject$l;
var lengthOfArrayLike$a = lengthOfArrayLike$h;
var createProperty$2 = createProperty$8;
var arraySpeciesCreate$3 = arraySpeciesCreate$5;
var arrayMethodHasSpeciesSupport$4 = arrayMethodHasSpeciesSupport$5;
var wellKnownSymbol$4 = wellKnownSymbol$i;
var V8_VERSION = engineV8Version;

var IS_CONCAT_SPREADABLE = wellKnownSymbol$4('isConcatSpreadable');
var MAX_SAFE_INTEGER$1 = 0x1FFFFFFFFFFFFF;
var MAXIMUM_ALLOWED_INDEX_EXCEEDED = 'Maximum allowed index exceeded';
var TypeError$4 = global$6.TypeError;

// We can't use this feature detection in V8 since it causes
// deoptimization and serious performance degradation
// https://github.com/zloirock/core-js/issues/679
var IS_CONCAT_SPREADABLE_SUPPORT = V8_VERSION >= 51 || !fails$4(function () {
  var array = [];
  array[IS_CONCAT_SPREADABLE] = false;
  return array.concat()[0] !== array;
});

var SPECIES_SUPPORT = arrayMethodHasSpeciesSupport$4('concat');

var isConcatSpreadable = function (O) {
  if (!isObject$1(O)) return false;
  var spreadable = O[IS_CONCAT_SPREADABLE];
  return spreadable !== undefined ? !!spreadable : isArray$3(O);
};

var FORCED$2 = !IS_CONCAT_SPREADABLE_SUPPORT || !SPECIES_SUPPORT;

// `Array.prototype.concat` method
// https://tc39.es/ecma262/#sec-array.prototype.concat
// with adding support of @@isConcatSpreadable and @@species
$$m({ target: 'Array', proto: true, arity: 1, forced: FORCED$2 }, {
  // eslint-disable-next-line no-unused-vars -- required for `.length`
  concat: function concat(arg) {
    var O = toObject$7(this);
    var A = arraySpeciesCreate$3(O, 0);
    var n = 0;
    var i, k, length, len, E;
    for (i = -1, length = arguments.length; i < length; i++) {
      E = i === -1 ? O : arguments[i];
      if (isConcatSpreadable(E)) {
        len = lengthOfArrayLike$a(E);
        if (n + len > MAX_SAFE_INTEGER$1) throw TypeError$4(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
        for (k = 0; k < len; k++, n++) if (k in E) createProperty$2(A, n, E[k]);
      } else {
        if (n >= MAX_SAFE_INTEGER$1) throw TypeError$4(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
        createProperty$2(A, n++, E);
      }
    }
    A.length = n;
    return A;
  }
});

var toObject$6 = toObject$l;
var toAbsoluteIndex$3 = toAbsoluteIndex$6;
var lengthOfArrayLike$9 = lengthOfArrayLike$h;

var min$2 = Math.min;

// `Array.prototype.copyWithin` method implementation
// https://tc39.es/ecma262/#sec-array.prototype.copywithin
// eslint-disable-next-line es-x/no-array-prototype-copywithin -- safe
var arrayCopyWithin = [].copyWithin || function copyWithin(target /* = 0 */, start /* = 0, end = @length */) {
  var O = toObject$6(this);
  var len = lengthOfArrayLike$9(O);
  var to = toAbsoluteIndex$3(target, len);
  var from = toAbsoluteIndex$3(start, len);
  var end = arguments.length > 2 ? arguments[2] : undefined;
  var count = min$2((end === undefined ? len : toAbsoluteIndex$3(end, len)) - from, len - to);
  var inc = 1;
  if (from < to && to < from + count) {
    inc = -1;
    from += count - 1;
    to += count - 1;
  }
  while (count-- > 0) {
    if (from in O) O[to] = O[from];
    else delete O[to];
    to += inc;
    from += inc;
  } return O;
};

var $$l = _export;
var copyWithin = arrayCopyWithin;
var addToUnscopables$7 = addToUnscopables$9;

// `Array.prototype.copyWithin` method
// https://tc39.es/ecma262/#sec-array.prototype.copywithin
$$l({ target: 'Array', proto: true }, {
  copyWithin: copyWithin
});

// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables$7('copyWithin');

var fails$3 = fails$y;

var arrayMethodIsStrict$9 = function (METHOD_NAME, argument) {
  var method = [][METHOD_NAME];
  return !!method && fails$3(function () {
    // eslint-disable-next-line no-useless-call -- required for testing
    method.call(null, argument || function () { return 1; }, 1);
  });
};

var $$k = _export;
var $every = arrayIteration.every;
var arrayMethodIsStrict$8 = arrayMethodIsStrict$9;

var STRICT_METHOD$8 = arrayMethodIsStrict$8('every');

// `Array.prototype.every` method
// https://tc39.es/ecma262/#sec-array.prototype.every
$$k({ target: 'Array', proto: true, forced: !STRICT_METHOD$8 }, {
  every: function every(callbackfn /* , thisArg */) {
    return $every(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

var toObject$5 = toObject$l;
var toAbsoluteIndex$2 = toAbsoluteIndex$6;
var lengthOfArrayLike$8 = lengthOfArrayLike$h;

// `Array.prototype.fill` method implementation
// https://tc39.es/ecma262/#sec-array.prototype.fill
var arrayFill = function fill(value /* , start = 0, end = @length */) {
  var O = toObject$5(this);
  var length = lengthOfArrayLike$8(O);
  var argumentsLength = arguments.length;
  var index = toAbsoluteIndex$2(argumentsLength > 1 ? arguments[1] : undefined, length);
  var end = argumentsLength > 2 ? arguments[2] : undefined;
  var endPos = end === undefined ? length : toAbsoluteIndex$2(end, length);
  while (endPos > index) O[index++] = value;
  return O;
};

var $$j = _export;
var fill = arrayFill;
var addToUnscopables$6 = addToUnscopables$9;

// `Array.prototype.fill` method
// https://tc39.es/ecma262/#sec-array.prototype.fill
$$j({ target: 'Array', proto: true }, {
  fill: fill
});

// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables$6('fill');

var $$i = _export;
var $filter = arrayIteration.filter;
var arrayMethodHasSpeciesSupport$3 = arrayMethodHasSpeciesSupport$5;

var HAS_SPECIES_SUPPORT$3 = arrayMethodHasSpeciesSupport$3('filter');

// `Array.prototype.filter` method
// https://tc39.es/ecma262/#sec-array.prototype.filter
// with adding support of @@species
$$i({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT$3 }, {
  filter: function filter(callbackfn /* , thisArg */) {
    return $filter(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

var $$h = _export;
var $find = arrayIteration.find;
var addToUnscopables$5 = addToUnscopables$9;

var FIND = 'find';
var SKIPS_HOLES$1 = true;

// Shouldn't skip holes
if (FIND in []) Array(1)[FIND](function () { SKIPS_HOLES$1 = false; });

// `Array.prototype.find` method
// https://tc39.es/ecma262/#sec-array.prototype.find
$$h({ target: 'Array', proto: true, forced: SKIPS_HOLES$1 }, {
  find: function find(callbackfn /* , that = undefined */) {
    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables$5(FIND);

var $$g = _export;
var $findIndex = arrayIteration.findIndex;
var addToUnscopables$4 = addToUnscopables$9;

var FIND_INDEX = 'findIndex';
var SKIPS_HOLES = true;

// Shouldn't skip holes
if (FIND_INDEX in []) Array(1)[FIND_INDEX](function () { SKIPS_HOLES = false; });

// `Array.prototype.findIndex` method
// https://tc39.es/ecma262/#sec-array.prototype.findindex
$$g({ target: 'Array', proto: true, forced: SKIPS_HOLES }, {
  findIndex: function findIndex(callbackfn /* , that = undefined */) {
    return $findIndex(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables$4(FIND_INDEX);

var global$5 = global$H;
var isArray$2 = isArray$7;
var lengthOfArrayLike$7 = lengthOfArrayLike$h;
var bind = functionBindContext;

var TypeError$3 = global$5.TypeError;

// `FlattenIntoArray` abstract operation
// https://tc39.github.io/proposal-flatMap/#sec-FlattenIntoArray
var flattenIntoArray$2 = function (target, original, source, sourceLen, start, depth, mapper, thisArg) {
  var targetIndex = start;
  var sourceIndex = 0;
  var mapFn = mapper ? bind(mapper, thisArg) : false;
  var element, elementLen;

  while (sourceIndex < sourceLen) {
    if (sourceIndex in source) {
      element = mapFn ? mapFn(source[sourceIndex], sourceIndex, original) : source[sourceIndex];

      if (depth > 0 && isArray$2(element)) {
        elementLen = lengthOfArrayLike$7(element);
        targetIndex = flattenIntoArray$2(target, original, element, elementLen, targetIndex, depth - 1) - 1;
      } else {
        if (targetIndex >= 0x1FFFFFFFFFFFFF) throw TypeError$3('Exceed the acceptable array length');
        target[targetIndex] = element;
      }

      targetIndex++;
    }
    sourceIndex++;
  }
  return targetIndex;
};

var flattenIntoArray_1 = flattenIntoArray$2;

var $$f = _export;
var flattenIntoArray$1 = flattenIntoArray_1;
var toObject$4 = toObject$l;
var lengthOfArrayLike$6 = lengthOfArrayLike$h;
var toIntegerOrInfinity$3 = toIntegerOrInfinity$7;
var arraySpeciesCreate$2 = arraySpeciesCreate$5;

// `Array.prototype.flat` method
// https://tc39.es/ecma262/#sec-array.prototype.flat
$$f({ target: 'Array', proto: true }, {
  flat: function flat(/* depthArg = 1 */) {
    var depthArg = arguments.length ? arguments[0] : undefined;
    var O = toObject$4(this);
    var sourceLen = lengthOfArrayLike$6(O);
    var A = arraySpeciesCreate$2(O, 0);
    A.length = flattenIntoArray$1(A, O, O, sourceLen, 0, depthArg === undefined ? 1 : toIntegerOrInfinity$3(depthArg));
    return A;
  }
});

var $$e = _export;
var flattenIntoArray = flattenIntoArray_1;
var aCallable$2 = aCallable$8;
var toObject$3 = toObject$l;
var lengthOfArrayLike$5 = lengthOfArrayLike$h;
var arraySpeciesCreate$1 = arraySpeciesCreate$5;

// `Array.prototype.flatMap` method
// https://tc39.es/ecma262/#sec-array.prototype.flatmap
$$e({ target: 'Array', proto: true }, {
  flatMap: function flatMap(callbackfn /* , thisArg */) {
    var O = toObject$3(this);
    var sourceLen = lengthOfArrayLike$5(O);
    var A;
    aCallable$2(callbackfn);
    A = arraySpeciesCreate$1(O, 0);
    A.length = flattenIntoArray(A, O, O, sourceLen, 0, 1, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    return A;
  }
});

var $forEach = arrayIteration.forEach;
var arrayMethodIsStrict$7 = arrayMethodIsStrict$9;

var STRICT_METHOD$7 = arrayMethodIsStrict$7('forEach');

// `Array.prototype.forEach` method implementation
// https://tc39.es/ecma262/#sec-array.prototype.foreach
var arrayForEach = !STRICT_METHOD$7 ? function forEach(callbackfn /* , thisArg */) {
  return $forEach(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
// eslint-disable-next-line es-x/no-array-prototype-foreach -- safe
} : [].forEach;

var $$d = _export;
var forEach = arrayForEach;

// `Array.prototype.forEach` method
// https://tc39.es/ecma262/#sec-array.prototype.foreach
// eslint-disable-next-line es-x/no-array-prototype-foreach -- safe
$$d({ target: 'Array', proto: true, forced: [].forEach != forEach }, {
  forEach: forEach
});

var $$c = _export;
var $includes = arrayIncludes.includes;
var fails$2 = fails$y;
var addToUnscopables$3 = addToUnscopables$9;

// FF99+ bug
var BROKEN_ON_SPARSE = fails$2(function () {
  return !Array(1).includes();
});

// `Array.prototype.includes` method
// https://tc39.es/ecma262/#sec-array.prototype.includes
$$c({ target: 'Array', proto: true, forced: BROKEN_ON_SPARSE }, {
  includes: function includes(el /* , fromIndex = 0 */) {
    return $includes(this, el, arguments.length > 1 ? arguments[1] : undefined);
  }
});

// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables$3('includes');

/* eslint-disable es-x/no-array-prototype-indexof -- required for testing */
var $$b = _export;
var uncurryThis$4 = functionUncurryThis;
var $IndexOf = arrayIncludes.indexOf;
var arrayMethodIsStrict$6 = arrayMethodIsStrict$9;

var un$IndexOf = uncurryThis$4([].indexOf);

var NEGATIVE_ZERO$1 = !!un$IndexOf && 1 / un$IndexOf([1], 1, -0) < 0;
var STRICT_METHOD$6 = arrayMethodIsStrict$6('indexOf');

// `Array.prototype.indexOf` method
// https://tc39.es/ecma262/#sec-array.prototype.indexof
$$b({ target: 'Array', proto: true, forced: NEGATIVE_ZERO$1 || !STRICT_METHOD$6 }, {
  indexOf: function indexOf(searchElement /* , fromIndex = 0 */) {
    var fromIndex = arguments.length > 1 ? arguments[1] : undefined;
    return NEGATIVE_ZERO$1
      // convert -0 to +0
      ? un$IndexOf(this, searchElement, fromIndex) || 0
      : $IndexOf(this, searchElement, fromIndex);
  }
});

var fails$1 = fails$y;
var isCallable$1 = isCallable$h;
var getPrototypeOf$1 = objectGetPrototypeOf;
var defineBuiltIn$1 = defineBuiltIn$6;
var wellKnownSymbol$3 = wellKnownSymbol$i;

var ITERATOR$1 = wellKnownSymbol$3('iterator');
var BUGGY_SAFARI_ITERATORS$1 = false;

// `%IteratorPrototype%` object
// https://tc39.es/ecma262/#sec-%iteratorprototype%-object
var IteratorPrototype$2, PrototypeOfArrayIteratorPrototype, arrayIterator;

/* eslint-disable es-x/no-array-prototype-keys -- safe */
if ([].keys) {
  arrayIterator = [].keys();
  // Safari 8 has buggy iterators w/o `next`
  if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS$1 = true;
  else {
    PrototypeOfArrayIteratorPrototype = getPrototypeOf$1(getPrototypeOf$1(arrayIterator));
    if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype$2 = PrototypeOfArrayIteratorPrototype;
  }
}

var NEW_ITERATOR_PROTOTYPE = IteratorPrototype$2 == undefined || fails$1(function () {
  var test = {};
  // FF44- legacy iterators case
  return IteratorPrototype$2[ITERATOR$1].call(test) !== test;
});

if (NEW_ITERATOR_PROTOTYPE) IteratorPrototype$2 = {};

// `%IteratorPrototype%[@@iterator]()` method
// https://tc39.es/ecma262/#sec-%iteratorprototype%-@@iterator
if (!isCallable$1(IteratorPrototype$2[ITERATOR$1])) {
  defineBuiltIn$1(IteratorPrototype$2, ITERATOR$1, function () {
    return this;
  });
}

var iteratorsCore = {
  IteratorPrototype: IteratorPrototype$2,
  BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS$1
};

var IteratorPrototype$1 = iteratorsCore.IteratorPrototype;
var create = objectCreate;
var createPropertyDescriptor = createPropertyDescriptor$5;
var setToStringTag$1 = setToStringTag$6;
var Iterators$2 = iterators;

var returnThis$1 = function () { return this; };

var createIteratorConstructor$1 = function (IteratorConstructor, NAME, next, ENUMERABLE_NEXT) {
  var TO_STRING_TAG = NAME + ' Iterator';
  IteratorConstructor.prototype = create(IteratorPrototype$1, { next: createPropertyDescriptor(+!ENUMERABLE_NEXT, next) });
  setToStringTag$1(IteratorConstructor, TO_STRING_TAG, false);
  Iterators$2[TO_STRING_TAG] = returnThis$1;
  return IteratorConstructor;
};

var $$a = _export;
var call = functionCall;
var FunctionName = functionName;
var isCallable = isCallable$h;
var createIteratorConstructor = createIteratorConstructor$1;
var getPrototypeOf = objectGetPrototypeOf;
var setPrototypeOf = objectSetPrototypeOf;
var setToStringTag = setToStringTag$6;
var createNonEnumerableProperty = createNonEnumerableProperty$4;
var defineBuiltIn = defineBuiltIn$6;
var wellKnownSymbol$2 = wellKnownSymbol$i;
var Iterators$1 = iterators;
var IteratorsCore = iteratorsCore;

var PROPER_FUNCTION_NAME = FunctionName.PROPER;
var CONFIGURABLE_FUNCTION_NAME = FunctionName.CONFIGURABLE;
var IteratorPrototype = IteratorsCore.IteratorPrototype;
var BUGGY_SAFARI_ITERATORS = IteratorsCore.BUGGY_SAFARI_ITERATORS;
var ITERATOR = wellKnownSymbol$2('iterator');
var KEYS = 'keys';
var VALUES = 'values';
var ENTRIES = 'entries';

var returnThis = function () { return this; };

var defineIterator$2 = function (Iterable, NAME, IteratorConstructor, next, DEFAULT, IS_SET, FORCED) {
  createIteratorConstructor(IteratorConstructor, NAME, next);

  var getIterationMethod = function (KIND) {
    if (KIND === DEFAULT && defaultIterator) return defaultIterator;
    if (!BUGGY_SAFARI_ITERATORS && KIND in IterablePrototype) return IterablePrototype[KIND];
    switch (KIND) {
      case KEYS: return function keys() { return new IteratorConstructor(this, KIND); };
      case VALUES: return function values() { return new IteratorConstructor(this, KIND); };
      case ENTRIES: return function entries() { return new IteratorConstructor(this, KIND); };
    } return function () { return new IteratorConstructor(this); };
  };

  var TO_STRING_TAG = NAME + ' Iterator';
  var INCORRECT_VALUES_NAME = false;
  var IterablePrototype = Iterable.prototype;
  var nativeIterator = IterablePrototype[ITERATOR]
    || IterablePrototype['@@iterator']
    || DEFAULT && IterablePrototype[DEFAULT];
  var defaultIterator = !BUGGY_SAFARI_ITERATORS && nativeIterator || getIterationMethod(DEFAULT);
  var anyNativeIterator = NAME == 'Array' ? IterablePrototype.entries || nativeIterator : nativeIterator;
  var CurrentIteratorPrototype, methods, KEY;

  // fix native
  if (anyNativeIterator) {
    CurrentIteratorPrototype = getPrototypeOf(anyNativeIterator.call(new Iterable()));
    if (CurrentIteratorPrototype !== Object.prototype && CurrentIteratorPrototype.next) {
      if (getPrototypeOf(CurrentIteratorPrototype) !== IteratorPrototype) {
        if (setPrototypeOf) {
          setPrototypeOf(CurrentIteratorPrototype, IteratorPrototype);
        } else if (!isCallable(CurrentIteratorPrototype[ITERATOR])) {
          defineBuiltIn(CurrentIteratorPrototype, ITERATOR, returnThis);
        }
      }
      // Set @@toStringTag to native iterators
      setToStringTag(CurrentIteratorPrototype, TO_STRING_TAG, true);
    }
  }

  // fix Array.prototype.{ values, @@iterator }.name in V8 / FF
  if (PROPER_FUNCTION_NAME && DEFAULT == VALUES && nativeIterator && nativeIterator.name !== VALUES) {
    if (CONFIGURABLE_FUNCTION_NAME) {
      createNonEnumerableProperty(IterablePrototype, 'name', VALUES);
    } else {
      INCORRECT_VALUES_NAME = true;
      defaultIterator = function values() { return call(nativeIterator, this); };
    }
  }

  // export additional methods
  if (DEFAULT) {
    methods = {
      values: getIterationMethod(VALUES),
      keys: IS_SET ? defaultIterator : getIterationMethod(KEYS),
      entries: getIterationMethod(ENTRIES)
    };
    if (FORCED) for (KEY in methods) {
      if (BUGGY_SAFARI_ITERATORS || INCORRECT_VALUES_NAME || !(KEY in IterablePrototype)) {
        defineBuiltIn(IterablePrototype, KEY, methods[KEY]);
      }
    } else $$a({ target: NAME, proto: true, forced: BUGGY_SAFARI_ITERATORS || INCORRECT_VALUES_NAME }, methods);
  }

  // define iterator
  if (IterablePrototype[ITERATOR] !== defaultIterator) {
    defineBuiltIn(IterablePrototype, ITERATOR, defaultIterator, { name: DEFAULT });
  }
  Iterators$1[NAME] = defaultIterator;

  return methods;
};

var toIndexedObject$3 = toIndexedObject$d;
var addToUnscopables$2 = addToUnscopables$9;
var Iterators = iterators;
var InternalStateModule$1 = internalState;
var defineProperty = objectDefineProperty.f;
var defineIterator$1 = defineIterator$2;
var DESCRIPTORS$1 = descriptors;

var ARRAY_ITERATOR = 'Array Iterator';
var setInternalState$1 = InternalStateModule$1.set;
var getInternalState$1 = InternalStateModule$1.getterFor(ARRAY_ITERATOR);

// `Array.prototype.entries` method
// https://tc39.es/ecma262/#sec-array.prototype.entries
// `Array.prototype.keys` method
// https://tc39.es/ecma262/#sec-array.prototype.keys
// `Array.prototype.values` method
// https://tc39.es/ecma262/#sec-array.prototype.values
// `Array.prototype[@@iterator]` method
// https://tc39.es/ecma262/#sec-array.prototype-@@iterator
// `CreateArrayIterator` internal method
// https://tc39.es/ecma262/#sec-createarrayiterator
defineIterator$1(Array, 'Array', function (iterated, kind) {
  setInternalState$1(this, {
    type: ARRAY_ITERATOR,
    target: toIndexedObject$3(iterated), // target
    index: 0,                          // next index
    kind: kind                         // kind
  });
// `%ArrayIteratorPrototype%.next` method
// https://tc39.es/ecma262/#sec-%arrayiteratorprototype%.next
}, function () {
  var state = getInternalState$1(this);
  var target = state.target;
  var kind = state.kind;
  var index = state.index++;
  if (!target || index >= target.length) {
    state.target = undefined;
    return { value: undefined, done: true };
  }
  if (kind == 'keys') return { value: index, done: false };
  if (kind == 'values') return { value: target[index], done: false };
  return { value: [index, target[index]], done: false };
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values%
// https://tc39.es/ecma262/#sec-createunmappedargumentsobject
// https://tc39.es/ecma262/#sec-createmappedargumentsobject
var values = Iterators.Arguments = Iterators.Array;

// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables$2('keys');
addToUnscopables$2('values');
addToUnscopables$2('entries');

// V8 ~ Chrome 45- bug
if (DESCRIPTORS$1 && values.name !== 'values') try {
  defineProperty(values, 'name', { value: 'values' });
} catch (error) { /* empty */ }

var $$9 = _export;
var uncurryThis$3 = functionUncurryThis;
var IndexedObject$1 = indexedObject;
var toIndexedObject$2 = toIndexedObject$d;
var arrayMethodIsStrict$5 = arrayMethodIsStrict$9;

var un$Join = uncurryThis$3([].join);

var ES3_STRINGS = IndexedObject$1 != Object;
var STRICT_METHOD$5 = arrayMethodIsStrict$5('join', ',');

// `Array.prototype.join` method
// https://tc39.es/ecma262/#sec-array.prototype.join
$$9({ target: 'Array', proto: true, forced: ES3_STRINGS || !STRICT_METHOD$5 }, {
  join: function join(separator) {
    return un$Join(toIndexedObject$2(this), separator === undefined ? ',' : separator);
  }
});

/* eslint-disable es-x/no-array-prototype-lastindexof -- safe */
var apply = functionApply;
var toIndexedObject$1 = toIndexedObject$d;
var toIntegerOrInfinity$2 = toIntegerOrInfinity$7;
var lengthOfArrayLike$4 = lengthOfArrayLike$h;
var arrayMethodIsStrict$4 = arrayMethodIsStrict$9;

var min$1 = Math.min;
var $lastIndexOf = [].lastIndexOf;
var NEGATIVE_ZERO = !!$lastIndexOf && 1 / [1].lastIndexOf(1, -0) < 0;
var STRICT_METHOD$4 = arrayMethodIsStrict$4('lastIndexOf');
var FORCED$1 = NEGATIVE_ZERO || !STRICT_METHOD$4;

// `Array.prototype.lastIndexOf` method implementation
// https://tc39.es/ecma262/#sec-array.prototype.lastindexof
var arrayLastIndexOf = FORCED$1 ? function lastIndexOf(searchElement /* , fromIndex = @[*-1] */) {
  // convert -0 to +0
  if (NEGATIVE_ZERO) return apply($lastIndexOf, this, arguments) || 0;
  var O = toIndexedObject$1(this);
  var length = lengthOfArrayLike$4(O);
  var index = length - 1;
  if (arguments.length > 1) index = min$1(index, toIntegerOrInfinity$2(arguments[1]));
  if (index < 0) index = length + index;
  for (;index >= 0; index--) if (index in O && O[index] === searchElement) return index || 0;
  return -1;
} : $lastIndexOf;

var $$8 = _export;
var lastIndexOf = arrayLastIndexOf;

// `Array.prototype.lastIndexOf` method
// https://tc39.es/ecma262/#sec-array.prototype.lastindexof
// eslint-disable-next-line es-x/no-array-prototype-lastindexof -- required for testing
$$8({ target: 'Array', proto: true, forced: lastIndexOf !== [].lastIndexOf }, {
  lastIndexOf: lastIndexOf
});

var $$7 = _export;
var $map = arrayIteration.map;
var arrayMethodHasSpeciesSupport$2 = arrayMethodHasSpeciesSupport$5;

var HAS_SPECIES_SUPPORT$2 = arrayMethodHasSpeciesSupport$2('map');

// `Array.prototype.map` method
// https://tc39.es/ecma262/#sec-array.prototype.map
// with adding support of @@species
$$7({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT$2 }, {
  map: function map(callbackfn /* , thisArg */) {
    return $map(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

var global$4 = global$H;
var aCallable$1 = aCallable$8;
var toObject$2 = toObject$l;
var IndexedObject = indexedObject;
var lengthOfArrayLike$3 = lengthOfArrayLike$h;

var TypeError$2 = global$4.TypeError;

// `Array.prototype.{ reduce, reduceRight }` methods implementation
var createMethod$1 = function (IS_RIGHT) {
  return function (that, callbackfn, argumentsLength, memo) {
    aCallable$1(callbackfn);
    var O = toObject$2(that);
    var self = IndexedObject(O);
    var length = lengthOfArrayLike$3(O);
    var index = IS_RIGHT ? length - 1 : 0;
    var i = IS_RIGHT ? -1 : 1;
    if (argumentsLength < 2) while (true) {
      if (index in self) {
        memo = self[index];
        index += i;
        break;
      }
      index += i;
      if (IS_RIGHT ? index < 0 : length <= index) {
        throw TypeError$2('Reduce of empty array with no initial value');
      }
    }
    for (;IS_RIGHT ? index >= 0 : length > index; index += i) if (index in self) {
      memo = callbackfn(memo, self[index], index, O);
    }
    return memo;
  };
};

var arrayReduce = {
  // `Array.prototype.reduce` method
  // https://tc39.es/ecma262/#sec-array.prototype.reduce
  left: createMethod$1(false),
  // `Array.prototype.reduceRight` method
  // https://tc39.es/ecma262/#sec-array.prototype.reduceright
  right: createMethod$1(true)
};

var classof = classofRaw$1;
var global$3 = global$H;

var engineIsNode = classof(global$3.process) == 'process';

var $$6 = _export;
var $reduce = arrayReduce.left;
var arrayMethodIsStrict$3 = arrayMethodIsStrict$9;
var CHROME_VERSION$1 = engineV8Version;
var IS_NODE$1 = engineIsNode;

var STRICT_METHOD$3 = arrayMethodIsStrict$3('reduce');
// Chrome 80-82 has a critical bug
// https://bugs.chromium.org/p/chromium/issues/detail?id=1049982
var CHROME_BUG$1 = !IS_NODE$1 && CHROME_VERSION$1 > 79 && CHROME_VERSION$1 < 83;

// `Array.prototype.reduce` method
// https://tc39.es/ecma262/#sec-array.prototype.reduce
$$6({ target: 'Array', proto: true, forced: !STRICT_METHOD$3 || CHROME_BUG$1 }, {
  reduce: function reduce(callbackfn /* , initialValue */) {
    var length = arguments.length;
    return $reduce(this, callbackfn, length, length > 1 ? arguments[1] : undefined);
  }
});

var $$5 = _export;
var $reduceRight = arrayReduce.right;
var arrayMethodIsStrict$2 = arrayMethodIsStrict$9;
var CHROME_VERSION = engineV8Version;
var IS_NODE = engineIsNode;

var STRICT_METHOD$2 = arrayMethodIsStrict$2('reduceRight');
// Chrome 80-82 has a critical bug
// https://bugs.chromium.org/p/chromium/issues/detail?id=1049982
var CHROME_BUG = !IS_NODE && CHROME_VERSION > 79 && CHROME_VERSION < 83;

// `Array.prototype.reduceRight` method
// https://tc39.es/ecma262/#sec-array.prototype.reduceright
$$5({ target: 'Array', proto: true, forced: !STRICT_METHOD$2 || CHROME_BUG }, {
  reduceRight: function reduceRight(callbackfn /* , initialValue */) {
    return $reduceRight(this, callbackfn, arguments.length, arguments.length > 1 ? arguments[1] : undefined);
  }
});

var $$4 = _export;
var uncurryThis$2 = functionUncurryThis;
var isArray$1 = isArray$7;

var un$Reverse = uncurryThis$2([].reverse);
var test$1 = [1, 2];

// `Array.prototype.reverse` method
// https://tc39.es/ecma262/#sec-array.prototype.reverse
// fix for Safari 12.0 bug
// https://bugs.webkit.org/show_bug.cgi?id=188794
$$4({ target: 'Array', proto: true, forced: String(test$1) === String(test$1.reverse()) }, {
  reverse: function reverse() {
    // eslint-disable-next-line no-self-assign -- dirty hack
    if (isArray$1(this)) this.length = this.length;
    return un$Reverse(this);
  }
});

var $$3 = _export;
var global$2 = global$H;
var isArray = isArray$7;
var isConstructor = isConstructor$4;
var isObject = isObject$g;
var toAbsoluteIndex$1 = toAbsoluteIndex$6;
var lengthOfArrayLike$2 = lengthOfArrayLike$h;
var toIndexedObject = toIndexedObject$d;
var createProperty$1 = createProperty$8;
var wellKnownSymbol$1 = wellKnownSymbol$i;
var arrayMethodHasSpeciesSupport$1 = arrayMethodHasSpeciesSupport$5;
var un$Slice = arraySlice$2;

var HAS_SPECIES_SUPPORT$1 = arrayMethodHasSpeciesSupport$1('slice');

var SPECIES$1 = wellKnownSymbol$1('species');
var Array$1 = global$2.Array;
var max$1 = Math.max;

// `Array.prototype.slice` method
// https://tc39.es/ecma262/#sec-array.prototype.slice
// fallback for not array-like ES3 strings and DOM objects
$$3({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT$1 }, {
  slice: function slice(start, end) {
    var O = toIndexedObject(this);
    var length = lengthOfArrayLike$2(O);
    var k = toAbsoluteIndex$1(start, length);
    var fin = toAbsoluteIndex$1(end === undefined ? length : end, length);
    // inline `ArraySpeciesCreate` for usage native `Array#slice` where it's possible
    var Constructor, result, n;
    if (isArray(O)) {
      Constructor = O.constructor;
      // cross-realm fallback
      if (isConstructor(Constructor) && (Constructor === Array$1 || isArray(Constructor.prototype))) {
        Constructor = undefined;
      } else if (isObject(Constructor)) {
        Constructor = Constructor[SPECIES$1];
        if (Constructor === null) Constructor = undefined;
      }
      if (Constructor === Array$1 || Constructor === undefined) {
        return un$Slice(O, k, fin);
      }
    }
    result = new (Constructor === undefined ? Array$1 : Constructor)(max$1(fin - k, 0));
    for (n = 0; k < fin; k++, n++) if (k in O) createProperty$1(result, n, O[k]);
    result.length = n;
    return result;
  }
});

var $$2 = _export;
var $some = arrayIteration.some;
var arrayMethodIsStrict$1 = arrayMethodIsStrict$9;

var STRICT_METHOD$1 = arrayMethodIsStrict$1('some');

// `Array.prototype.some` method
// https://tc39.es/ecma262/#sec-array.prototype.some
$$2({ target: 'Array', proto: true, forced: !STRICT_METHOD$1 }, {
  some: function some(callbackfn /* , thisArg */) {
    return $some(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

var arraySlice = arraySliceSimple;

var floor = Math.floor;

var mergeSort = function (array, comparefn) {
  var length = array.length;
  var middle = floor(length / 2);
  return length < 8 ? insertionSort(array, comparefn) : merge(
    array,
    mergeSort(arraySlice(array, 0, middle), comparefn),
    mergeSort(arraySlice(array, middle), comparefn),
    comparefn
  );
};

var insertionSort = function (array, comparefn) {
  var length = array.length;
  var i = 1;
  var element, j;

  while (i < length) {
    j = i;
    element = array[i];
    while (j && comparefn(array[j - 1], element) > 0) {
      array[j] = array[--j];
    }
    if (j !== i++) array[j] = element;
  } return array;
};

var merge = function (array, left, right, comparefn) {
  var llength = left.length;
  var rlength = right.length;
  var lindex = 0;
  var rindex = 0;

  while (lindex < llength || rindex < rlength) {
    array[lindex + rindex] = (lindex < llength && rindex < rlength)
      ? comparefn(left[lindex], right[rindex]) <= 0 ? left[lindex++] : right[rindex++]
      : lindex < llength ? left[lindex++] : right[rindex++];
  } return array;
};

var arraySort = mergeSort;

var userAgent = engineUserAgent;

var firefox = userAgent.match(/firefox\/(\d+)/i);

var engineFfVersion = !!firefox && +firefox[1];

var UA = engineUserAgent;

var engineIsIeOrEdge = /MSIE|Trident/.test(UA);

var $$1 = _export;
var uncurryThis$1 = functionUncurryThis;
var aCallable = aCallable$8;
var toObject$1 = toObject$l;
var lengthOfArrayLike$1 = lengthOfArrayLike$h;
var toString$2 = toString$5;
var fails = fails$y;
var internalSort = arraySort;
var arrayMethodIsStrict = arrayMethodIsStrict$9;
var FF = engineFfVersion;
var IE_OR_EDGE = engineIsIeOrEdge;
var V8 = engineV8Version;
var WEBKIT = engineWebkitVersion;

var test = [];
var un$Sort = uncurryThis$1(test.sort);
var push = uncurryThis$1(test.push);

// IE8-
var FAILS_ON_UNDEFINED = fails(function () {
  test.sort(undefined);
});
// V8 bug
var FAILS_ON_NULL = fails(function () {
  test.sort(null);
});
// Old WebKit
var STRICT_METHOD = arrayMethodIsStrict('sort');

var STABLE_SORT = !fails(function () {
  // feature detection can be too slow, so check engines versions
  if (V8) return V8 < 70;
  if (FF && FF > 3) return;
  if (IE_OR_EDGE) return true;
  if (WEBKIT) return WEBKIT < 603;

  var result = '';
  var code, chr, value, index;

  // generate an array with more 512 elements (Chakra and old V8 fails only in this case)
  for (code = 65; code < 76; code++) {
    chr = String.fromCharCode(code);

    switch (code) {
      case 66: case 69: case 70: case 72: value = 3; break;
      case 68: case 71: value = 4; break;
      default: value = 2;
    }

    for (index = 0; index < 47; index++) {
      test.push({ k: chr + index, v: value });
    }
  }

  test.sort(function (a, b) { return b.v - a.v; });

  for (index = 0; index < test.length; index++) {
    chr = test[index].k.charAt(0);
    if (result.charAt(result.length - 1) !== chr) result += chr;
  }

  return result !== 'DGBEFHACIJK';
});

var FORCED = FAILS_ON_UNDEFINED || !FAILS_ON_NULL || !STRICT_METHOD || !STABLE_SORT;

var getSortCompare = function (comparefn) {
  return function (x, y) {
    if (y === undefined) return -1;
    if (x === undefined) return 1;
    if (comparefn !== undefined) return +comparefn(x, y) || 0;
    return toString$2(x) > toString$2(y) ? 1 : -1;
  };
};

// `Array.prototype.sort` method
// https://tc39.es/ecma262/#sec-array.prototype.sort
$$1({ target: 'Array', proto: true, forced: FORCED }, {
  sort: function sort(comparefn) {
    if (comparefn !== undefined) aCallable(comparefn);

    var array = toObject$1(this);

    if (STABLE_SORT) return comparefn === undefined ? un$Sort(array) : un$Sort(array, comparefn);

    var items = [];
    var arrayLength = lengthOfArrayLike$1(array);
    var itemsLength, index;

    for (index = 0; index < arrayLength; index++) {
      if (index in array) push(items, array[index]);
    }

    internalSort(items, getSortCompare(comparefn));

    itemsLength = items.length;
    index = 0;

    while (index < itemsLength) array[index] = items[index++];
    while (index < arrayLength) delete array[index++];

    return array;
  }
});

var getBuiltIn = getBuiltIn$9;
var definePropertyModule = objectDefineProperty;
var wellKnownSymbol = wellKnownSymbol$i;
var DESCRIPTORS = descriptors;

var SPECIES = wellKnownSymbol('species');

var setSpecies$1 = function (CONSTRUCTOR_NAME) {
  var Constructor = getBuiltIn(CONSTRUCTOR_NAME);
  var defineProperty = definePropertyModule.f;

  if (DESCRIPTORS && Constructor && !Constructor[SPECIES]) {
    defineProperty(Constructor, SPECIES, {
      configurable: true,
      get: function () { return this; }
    });
  }
};

var setSpecies = setSpecies$1;

// `Array[@@species]` getter
// https://tc39.es/ecma262/#sec-get-array-@@species
setSpecies('Array');

var $ = _export;
var global$1 = global$H;
var toAbsoluteIndex = toAbsoluteIndex$6;
var toIntegerOrInfinity$1 = toIntegerOrInfinity$7;
var lengthOfArrayLike = lengthOfArrayLike$h;
var toObject = toObject$l;
var arraySpeciesCreate = arraySpeciesCreate$5;
var createProperty = createProperty$8;
var arrayMethodHasSpeciesSupport = arrayMethodHasSpeciesSupport$5;

var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('splice');

var TypeError$1 = global$1.TypeError;
var max = Math.max;
var min = Math.min;
var MAX_SAFE_INTEGER = 0x1FFFFFFFFFFFFF;
var MAXIMUM_ALLOWED_LENGTH_EXCEEDED = 'Maximum allowed length exceeded';

// `Array.prototype.splice` method
// https://tc39.es/ecma262/#sec-array.prototype.splice
// with adding support of @@species
$({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT }, {
  splice: function splice(start, deleteCount /* , ...items */) {
    var O = toObject(this);
    var len = lengthOfArrayLike(O);
    var actualStart = toAbsoluteIndex(start, len);
    var argumentsLength = arguments.length;
    var insertCount, actualDeleteCount, A, k, from, to;
    if (argumentsLength === 0) {
      insertCount = actualDeleteCount = 0;
    } else if (argumentsLength === 1) {
      insertCount = 0;
      actualDeleteCount = len - actualStart;
    } else {
      insertCount = argumentsLength - 2;
      actualDeleteCount = min(max(toIntegerOrInfinity$1(deleteCount), 0), len - actualStart);
    }
    if (len + insertCount - actualDeleteCount > MAX_SAFE_INTEGER) {
      throw TypeError$1(MAXIMUM_ALLOWED_LENGTH_EXCEEDED);
    }
    A = arraySpeciesCreate(O, actualDeleteCount);
    for (k = 0; k < actualDeleteCount; k++) {
      from = actualStart + k;
      if (from in O) createProperty(A, k, O[from]);
    }
    A.length = actualDeleteCount;
    if (insertCount < actualDeleteCount) {
      for (k = actualStart; k < len - actualDeleteCount; k++) {
        from = k + actualDeleteCount;
        to = k + insertCount;
        if (from in O) O[to] = O[from];
        else delete O[to];
      }
      for (k = len; k > len - actualDeleteCount + insertCount; k--) delete O[k - 1];
    } else if (insertCount > actualDeleteCount) {
      for (k = len - actualDeleteCount; k > actualStart; k--) {
        from = k + actualDeleteCount - 1;
        to = k + insertCount - 1;
        if (from in O) O[to] = O[from];
        else delete O[to];
      }
    }
    for (k = 0; k < insertCount; k++) {
      O[k + actualStart] = arguments[k + 2];
    }
    O.length = len - actualDeleteCount + insertCount;
    return A;
  }
});

// this method was added to unscopables after implementation
// in popular engines, so it's moved to a separate module
var addToUnscopables$1 = addToUnscopables$9;

// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables$1('flat');

// this method was added to unscopables after implementation
// in popular engines, so it's moved to a separate module
var addToUnscopables = addToUnscopables$9;

// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables('flatMap');

var uncurryThis = functionUncurryThis;
var toIntegerOrInfinity = toIntegerOrInfinity$7;
var toString$1 = toString$5;
var requireObjectCoercible = requireObjectCoercible$3;

var charAt$1 = uncurryThis(''.charAt);
var charCodeAt = uncurryThis(''.charCodeAt);
var stringSlice = uncurryThis(''.slice);

var createMethod = function (CONVERT_TO_STRING) {
  return function ($this, pos) {
    var S = toString$1(requireObjectCoercible($this));
    var position = toIntegerOrInfinity(pos);
    var size = S.length;
    var first, second;
    if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
    first = charCodeAt(S, position);
    return first < 0xD800 || first > 0xDBFF || position + 1 === size
      || (second = charCodeAt(S, position + 1)) < 0xDC00 || second > 0xDFFF
        ? CONVERT_TO_STRING
          ? charAt$1(S, position)
          : first
        : CONVERT_TO_STRING
          ? stringSlice(S, position, position + 2)
          : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
  };
};

var stringMultibyte = {
  // `String.prototype.codePointAt` method
  // https://tc39.es/ecma262/#sec-string.prototype.codepointat
  codeAt: createMethod(false),
  // `String.prototype.at` method
  // https://github.com/mathiasbynens/String.prototype.at
  charAt: createMethod(true)
};

var charAt = stringMultibyte.charAt;
var toString = toString$5;
var InternalStateModule = internalState;
var defineIterator = defineIterator$2;

var STRING_ITERATOR = 'String Iterator';
var setInternalState = InternalStateModule.set;
var getInternalState = InternalStateModule.getterFor(STRING_ITERATOR);

// `String.prototype[@@iterator]` method
// https://tc39.es/ecma262/#sec-string.prototype-@@iterator
defineIterator(String, 'String', function (iterated) {
  setInternalState(this, {
    type: STRING_ITERATOR,
    string: toString(iterated),
    index: 0
  });
// `%StringIteratorPrototype%.next` method
// https://tc39.es/ecma262/#sec-%stringiteratorprototype%.next
}, function next() {
  var state = getInternalState(this);
  var string = state.string;
  var index = state.index;
  var point;
  if (index >= string.length) return { value: undefined, done: true };
  point = charAt(string, index);
  state.index += point.length;
  return { value: point, done: false };
});

var path = path$3;

path.Array;
