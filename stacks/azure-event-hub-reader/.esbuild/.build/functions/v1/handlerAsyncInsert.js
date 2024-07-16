var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../../node_modules/lodash.merge/index.js
var require_lodash = __commonJS({
  "../../node_modules/lodash.merge/index.js"(exports, module2) {
    var LARGE_ARRAY_SIZE = 200;
    var HASH_UNDEFINED = "__lodash_hash_undefined__";
    var HOT_COUNT = 800;
    var HOT_SPAN = 16;
    var MAX_SAFE_INTEGER = 9007199254740991;
    var argsTag = "[object Arguments]";
    var arrayTag = "[object Array]";
    var asyncTag = "[object AsyncFunction]";
    var boolTag = "[object Boolean]";
    var dateTag = "[object Date]";
    var errorTag = "[object Error]";
    var funcTag = "[object Function]";
    var genTag = "[object GeneratorFunction]";
    var mapTag = "[object Map]";
    var numberTag = "[object Number]";
    var nullTag = "[object Null]";
    var objectTag = "[object Object]";
    var proxyTag = "[object Proxy]";
    var regexpTag = "[object RegExp]";
    var setTag = "[object Set]";
    var stringTag = "[object String]";
    var undefinedTag = "[object Undefined]";
    var weakMapTag = "[object WeakMap]";
    var arrayBufferTag = "[object ArrayBuffer]";
    var dataViewTag = "[object DataView]";
    var float32Tag = "[object Float32Array]";
    var float64Tag = "[object Float64Array]";
    var int8Tag = "[object Int8Array]";
    var int16Tag = "[object Int16Array]";
    var int32Tag = "[object Int32Array]";
    var uint8Tag = "[object Uint8Array]";
    var uint8ClampedTag = "[object Uint8ClampedArray]";
    var uint16Tag = "[object Uint16Array]";
    var uint32Tag = "[object Uint32Array]";
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
    var reIsHostCtor = /^\[object .+?Constructor\]$/;
    var reIsUint = /^(?:0|[1-9]\d*)$/;
    var typedArrayTags = {};
    typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
    typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
    var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
    var freeSelf = typeof self == "object" && self && self.Object === Object && self;
    var root = freeGlobal || freeSelf || Function("return this")();
    var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
    var freeModule = freeExports && typeof module2 == "object" && module2 && !module2.nodeType && module2;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var freeProcess = moduleExports && freeGlobal.process;
    var nodeUtil = function() {
      try {
        var types = freeModule && freeModule.require && freeModule.require("util").types;
        if (types) {
          return types;
        }
        return freeProcess && freeProcess.binding && freeProcess.binding("util");
      } catch (e) {
      }
    }();
    var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
    function apply(func, thisArg, args) {
      switch (args.length) {
        case 0:
          return func.call(thisArg);
        case 1:
          return func.call(thisArg, args[0]);
        case 2:
          return func.call(thisArg, args[0], args[1]);
        case 3:
          return func.call(thisArg, args[0], args[1], args[2]);
      }
      return func.apply(thisArg, args);
    }
    function baseTimes(n, iteratee) {
      var index = -1, result = Array(n);
      while (++index < n) {
        result[index] = iteratee(index);
      }
      return result;
    }
    function baseUnary(func) {
      return function(value) {
        return func(value);
      };
    }
    function getValue(object, key) {
      return object == null ? void 0 : object[key];
    }
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }
    var arrayProto = Array.prototype;
    var funcProto = Function.prototype;
    var objectProto = Object.prototype;
    var coreJsData = root["__core-js_shared__"];
    var funcToString = funcProto.toString;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var maskSrcKey = function() {
      var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
      return uid ? "Symbol(src)_1." + uid : "";
    }();
    var nativeObjectToString = objectProto.toString;
    var objectCtorString = funcToString.call(Object);
    var reIsNative = RegExp(
      "^" + funcToString.call(hasOwnProperty).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
    );
    var Buffer2 = moduleExports ? root.Buffer : void 0;
    var Symbol2 = root.Symbol;
    var Uint8Array2 = root.Uint8Array;
    var allocUnsafe = Buffer2 ? Buffer2.allocUnsafe : void 0;
    var getPrototype = overArg(Object.getPrototypeOf, Object);
    var objectCreate = Object.create;
    var propertyIsEnumerable = objectProto.propertyIsEnumerable;
    var splice = arrayProto.splice;
    var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
    var defineProperty = function() {
      try {
        var func = getNative(Object, "defineProperty");
        func({}, "", {});
        return func;
      } catch (e) {
      }
    }();
    var nativeIsBuffer = Buffer2 ? Buffer2.isBuffer : void 0;
    var nativeMax = Math.max;
    var nativeNow = Date.now;
    var Map2 = getNative(root, "Map");
    var nativeCreate = getNative(Object, "create");
    var baseCreate = /* @__PURE__ */ function() {
      function object() {
      }
      return function(proto) {
        if (!isObject(proto)) {
          return {};
        }
        if (objectCreate) {
          return objectCreate(proto);
        }
        object.prototype = proto;
        var result = new object();
        object.prototype = void 0;
        return result;
      };
    }();
    function Hash(entries) {
      var index = -1, length = entries == null ? 0 : entries.length;
      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }
    function hashClear() {
      this.__data__ = nativeCreate ? nativeCreate(null) : {};
      this.size = 0;
    }
    function hashDelete(key) {
      var result = this.has(key) && delete this.__data__[key];
      this.size -= result ? 1 : 0;
      return result;
    }
    function hashGet(key) {
      var data = this.__data__;
      if (nativeCreate) {
        var result = data[key];
        return result === HASH_UNDEFINED ? void 0 : result;
      }
      return hasOwnProperty.call(data, key) ? data[key] : void 0;
    }
    function hashHas(key) {
      var data = this.__data__;
      return nativeCreate ? data[key] !== void 0 : hasOwnProperty.call(data, key);
    }
    function hashSet(key, value) {
      var data = this.__data__;
      this.size += this.has(key) ? 0 : 1;
      data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED : value;
      return this;
    }
    Hash.prototype.clear = hashClear;
    Hash.prototype["delete"] = hashDelete;
    Hash.prototype.get = hashGet;
    Hash.prototype.has = hashHas;
    Hash.prototype.set = hashSet;
    function ListCache(entries) {
      var index = -1, length = entries == null ? 0 : entries.length;
      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }
    function listCacheClear() {
      this.__data__ = [];
      this.size = 0;
    }
    function listCacheDelete(key) {
      var data = this.__data__, index = assocIndexOf(data, key);
      if (index < 0) {
        return false;
      }
      var lastIndex = data.length - 1;
      if (index == lastIndex) {
        data.pop();
      } else {
        splice.call(data, index, 1);
      }
      --this.size;
      return true;
    }
    function listCacheGet(key) {
      var data = this.__data__, index = assocIndexOf(data, key);
      return index < 0 ? void 0 : data[index][1];
    }
    function listCacheHas(key) {
      return assocIndexOf(this.__data__, key) > -1;
    }
    function listCacheSet(key, value) {
      var data = this.__data__, index = assocIndexOf(data, key);
      if (index < 0) {
        ++this.size;
        data.push([key, value]);
      } else {
        data[index][1] = value;
      }
      return this;
    }
    ListCache.prototype.clear = listCacheClear;
    ListCache.prototype["delete"] = listCacheDelete;
    ListCache.prototype.get = listCacheGet;
    ListCache.prototype.has = listCacheHas;
    ListCache.prototype.set = listCacheSet;
    function MapCache(entries) {
      var index = -1, length = entries == null ? 0 : entries.length;
      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }
    function mapCacheClear() {
      this.size = 0;
      this.__data__ = {
        "hash": new Hash(),
        "map": new (Map2 || ListCache)(),
        "string": new Hash()
      };
    }
    function mapCacheDelete(key) {
      var result = getMapData(this, key)["delete"](key);
      this.size -= result ? 1 : 0;
      return result;
    }
    function mapCacheGet(key) {
      return getMapData(this, key).get(key);
    }
    function mapCacheHas(key) {
      return getMapData(this, key).has(key);
    }
    function mapCacheSet(key, value) {
      var data = getMapData(this, key), size = data.size;
      data.set(key, value);
      this.size += data.size == size ? 0 : 1;
      return this;
    }
    MapCache.prototype.clear = mapCacheClear;
    MapCache.prototype["delete"] = mapCacheDelete;
    MapCache.prototype.get = mapCacheGet;
    MapCache.prototype.has = mapCacheHas;
    MapCache.prototype.set = mapCacheSet;
    function Stack(entries) {
      var data = this.__data__ = new ListCache(entries);
      this.size = data.size;
    }
    function stackClear() {
      this.__data__ = new ListCache();
      this.size = 0;
    }
    function stackDelete(key) {
      var data = this.__data__, result = data["delete"](key);
      this.size = data.size;
      return result;
    }
    function stackGet(key) {
      return this.__data__.get(key);
    }
    function stackHas(key) {
      return this.__data__.has(key);
    }
    function stackSet(key, value) {
      var data = this.__data__;
      if (data instanceof ListCache) {
        var pairs = data.__data__;
        if (!Map2 || pairs.length < LARGE_ARRAY_SIZE - 1) {
          pairs.push([key, value]);
          this.size = ++data.size;
          return this;
        }
        data = this.__data__ = new MapCache(pairs);
      }
      data.set(key, value);
      this.size = data.size;
      return this;
    }
    Stack.prototype.clear = stackClear;
    Stack.prototype["delete"] = stackDelete;
    Stack.prototype.get = stackGet;
    Stack.prototype.has = stackHas;
    Stack.prototype.set = stackSet;
    function arrayLikeKeys(value, inherited) {
      var isArr = isArray(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer(value), isType = !isArr && !isArg && !isBuff && isTypedArray(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value.length, String) : [], length = result.length;
      for (var key in value) {
        if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
        (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
        isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
        isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
        isIndex(key, length)))) {
          result.push(key);
        }
      }
      return result;
    }
    function assignMergeValue(object, key, value) {
      if (value !== void 0 && !eq(object[key], value) || value === void 0 && !(key in object)) {
        baseAssignValue(object, key, value);
      }
    }
    function assignValue(object, key, value) {
      var objValue = object[key];
      if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) || value === void 0 && !(key in object)) {
        baseAssignValue(object, key, value);
      }
    }
    function assocIndexOf(array, key) {
      var length = array.length;
      while (length--) {
        if (eq(array[length][0], key)) {
          return length;
        }
      }
      return -1;
    }
    function baseAssignValue(object, key, value) {
      if (key == "__proto__" && defineProperty) {
        defineProperty(object, key, {
          "configurable": true,
          "enumerable": true,
          "value": value,
          "writable": true
        });
      } else {
        object[key] = value;
      }
    }
    var baseFor = createBaseFor();
    function baseGetTag(value) {
      if (value == null) {
        return value === void 0 ? undefinedTag : nullTag;
      }
      return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
    }
    function baseIsArguments(value) {
      return isObjectLike(value) && baseGetTag(value) == argsTag;
    }
    function baseIsNative(value) {
      if (!isObject(value) || isMasked(value)) {
        return false;
      }
      var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
      return pattern.test(toSource(value));
    }
    function baseIsTypedArray(value) {
      return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
    }
    function baseKeysIn(object) {
      if (!isObject(object)) {
        return nativeKeysIn(object);
      }
      var isProto = isPrototype(object), result = [];
      for (var key in object) {
        if (!(key == "constructor" && (isProto || !hasOwnProperty.call(object, key)))) {
          result.push(key);
        }
      }
      return result;
    }
    function baseMerge(object, source, srcIndex, customizer, stack) {
      if (object === source) {
        return;
      }
      baseFor(source, function(srcValue, key) {
        stack || (stack = new Stack());
        if (isObject(srcValue)) {
          baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
        } else {
          var newValue = customizer ? customizer(safeGet(object, key), srcValue, key + "", object, source, stack) : void 0;
          if (newValue === void 0) {
            newValue = srcValue;
          }
          assignMergeValue(object, key, newValue);
        }
      }, keysIn);
    }
    function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
      var objValue = safeGet(object, key), srcValue = safeGet(source, key), stacked = stack.get(srcValue);
      if (stacked) {
        assignMergeValue(object, key, stacked);
        return;
      }
      var newValue = customizer ? customizer(objValue, srcValue, key + "", object, source, stack) : void 0;
      var isCommon = newValue === void 0;
      if (isCommon) {
        var isArr = isArray(srcValue), isBuff = !isArr && isBuffer(srcValue), isTyped = !isArr && !isBuff && isTypedArray(srcValue);
        newValue = srcValue;
        if (isArr || isBuff || isTyped) {
          if (isArray(objValue)) {
            newValue = objValue;
          } else if (isArrayLikeObject(objValue)) {
            newValue = copyArray(objValue);
          } else if (isBuff) {
            isCommon = false;
            newValue = cloneBuffer(srcValue, true);
          } else if (isTyped) {
            isCommon = false;
            newValue = cloneTypedArray(srcValue, true);
          } else {
            newValue = [];
          }
        } else if (isPlainObject(srcValue) || isArguments(srcValue)) {
          newValue = objValue;
          if (isArguments(objValue)) {
            newValue = toPlainObject(objValue);
          } else if (!isObject(objValue) || isFunction(objValue)) {
            newValue = initCloneObject(srcValue);
          }
        } else {
          isCommon = false;
        }
      }
      if (isCommon) {
        stack.set(srcValue, newValue);
        mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
        stack["delete"](srcValue);
      }
      assignMergeValue(object, key, newValue);
    }
    function baseRest(func, start) {
      return setToString(overRest(func, start, identity), func + "");
    }
    var baseSetToString = !defineProperty ? identity : function(func, string) {
      return defineProperty(func, "toString", {
        "configurable": true,
        "enumerable": false,
        "value": constant(string),
        "writable": true
      });
    };
    function cloneBuffer(buffer, isDeep) {
      if (isDeep) {
        return buffer.slice();
      }
      var length = buffer.length, result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);
      buffer.copy(result);
      return result;
    }
    function cloneArrayBuffer(arrayBuffer) {
      var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
      new Uint8Array2(result).set(new Uint8Array2(arrayBuffer));
      return result;
    }
    function cloneTypedArray(typedArray, isDeep) {
      var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
      return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
    }
    function copyArray(source, array) {
      var index = -1, length = source.length;
      array || (array = Array(length));
      while (++index < length) {
        array[index] = source[index];
      }
      return array;
    }
    function copyObject(source, props, object, customizer) {
      var isNew = !object;
      object || (object = {});
      var index = -1, length = props.length;
      while (++index < length) {
        var key = props[index];
        var newValue = customizer ? customizer(object[key], source[key], key, object, source) : void 0;
        if (newValue === void 0) {
          newValue = source[key];
        }
        if (isNew) {
          baseAssignValue(object, key, newValue);
        } else {
          assignValue(object, key, newValue);
        }
      }
      return object;
    }
    function createAssigner(assigner) {
      return baseRest(function(object, sources) {
        var index = -1, length = sources.length, customizer = length > 1 ? sources[length - 1] : void 0, guard = length > 2 ? sources[2] : void 0;
        customizer = assigner.length > 3 && typeof customizer == "function" ? (length--, customizer) : void 0;
        if (guard && isIterateeCall(sources[0], sources[1], guard)) {
          customizer = length < 3 ? void 0 : customizer;
          length = 1;
        }
        object = Object(object);
        while (++index < length) {
          var source = sources[index];
          if (source) {
            assigner(object, source, index, customizer);
          }
        }
        return object;
      });
    }
    function createBaseFor(fromRight) {
      return function(object, iteratee, keysFunc) {
        var index = -1, iterable = Object(object), props = keysFunc(object), length = props.length;
        while (length--) {
          var key = props[fromRight ? length : ++index];
          if (iteratee(iterable[key], key, iterable) === false) {
            break;
          }
        }
        return object;
      };
    }
    function getMapData(map, key) {
      var data = map.__data__;
      return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
    }
    function getNative(object, key) {
      var value = getValue(object, key);
      return baseIsNative(value) ? value : void 0;
    }
    function getRawTag(value) {
      var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
      try {
        value[symToStringTag] = void 0;
        var unmasked = true;
      } catch (e) {
      }
      var result = nativeObjectToString.call(value);
      if (unmasked) {
        if (isOwn) {
          value[symToStringTag] = tag;
        } else {
          delete value[symToStringTag];
        }
      }
      return result;
    }
    function initCloneObject(object) {
      return typeof object.constructor == "function" && !isPrototype(object) ? baseCreate(getPrototype(object)) : {};
    }
    function isIndex(value, length) {
      var type = typeof value;
      length = length == null ? MAX_SAFE_INTEGER : length;
      return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
    }
    function isIterateeCall(value, index, object) {
      if (!isObject(object)) {
        return false;
      }
      var type = typeof index;
      if (type == "number" ? isArrayLike(object) && isIndex(index, object.length) : type == "string" && index in object) {
        return eq(object[index], value);
      }
      return false;
    }
    function isKeyable(value) {
      var type = typeof value;
      return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
    }
    function isMasked(func) {
      return !!maskSrcKey && maskSrcKey in func;
    }
    function isPrototype(value) {
      var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
      return value === proto;
    }
    function nativeKeysIn(object) {
      var result = [];
      if (object != null) {
        for (var key in Object(object)) {
          result.push(key);
        }
      }
      return result;
    }
    function objectToString(value) {
      return nativeObjectToString.call(value);
    }
    function overRest(func, start, transform) {
      start = nativeMax(start === void 0 ? func.length - 1 : start, 0);
      return function() {
        var args = arguments, index = -1, length = nativeMax(args.length - start, 0), array = Array(length);
        while (++index < length) {
          array[index] = args[start + index];
        }
        index = -1;
        var otherArgs = Array(start + 1);
        while (++index < start) {
          otherArgs[index] = args[index];
        }
        otherArgs[start] = transform(array);
        return apply(func, this, otherArgs);
      };
    }
    function safeGet(object, key) {
      if (key === "constructor" && typeof object[key] === "function") {
        return;
      }
      if (key == "__proto__") {
        return;
      }
      return object[key];
    }
    var setToString = shortOut(baseSetToString);
    function shortOut(func) {
      var count = 0, lastCalled = 0;
      return function() {
        var stamp = nativeNow(), remaining = HOT_SPAN - (stamp - lastCalled);
        lastCalled = stamp;
        if (remaining > 0) {
          if (++count >= HOT_COUNT) {
            return arguments[0];
          }
        } else {
          count = 0;
        }
        return func.apply(void 0, arguments);
      };
    }
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString.call(func);
        } catch (e) {
        }
        try {
          return func + "";
        } catch (e) {
        }
      }
      return "";
    }
    function eq(value, other) {
      return value === other || value !== value && other !== other;
    }
    var isArguments = baseIsArguments(/* @__PURE__ */ function() {
      return arguments;
    }()) ? baseIsArguments : function(value) {
      return isObjectLike(value) && hasOwnProperty.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
    };
    var isArray = Array.isArray;
    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction(value);
    }
    function isArrayLikeObject(value) {
      return isObjectLike(value) && isArrayLike(value);
    }
    var isBuffer = nativeIsBuffer || stubFalse;
    function isFunction(value) {
      if (!isObject(value)) {
        return false;
      }
      var tag = baseGetTag(value);
      return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
    }
    function isLength(value) {
      return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }
    function isObject(value) {
      var type = typeof value;
      return value != null && (type == "object" || type == "function");
    }
    function isObjectLike(value) {
      return value != null && typeof value == "object";
    }
    function isPlainObject(value) {
      if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
        return false;
      }
      var proto = getPrototype(value);
      if (proto === null) {
        return true;
      }
      var Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
      return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
    }
    var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
    function toPlainObject(value) {
      return copyObject(value, keysIn(value));
    }
    function keysIn(object) {
      return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
    }
    var merge3 = createAssigner(function(object, source, srcIndex) {
      baseMerge(object, source, srcIndex);
    });
    function constant(value) {
      return function() {
        return value;
      };
    }
    function identity(value) {
      return value;
    }
    function stubFalse() {
      return false;
    }
    module2.exports = merge3;
  }
});

// functions/v1/handlerAsyncInsert.ts
var handlerAsyncInsert_exports = {};
__export(handlerAsyncInsert_exports, {
  insertHydratedEvents: () => insertHydratedEvents,
  insertHydratedEventsDlq: () => insertHydratedEventsDlq
});
module.exports = __toCommonJS(handlerAsyncInsert_exports);

// ../../node_modules/@aws-lambda-powertools/commons/lib/esm/Utility.js
var Utility = class {
  coldStart = true;
  defaultServiceName = "service_undefined";
  /**
   * Get the cold start status of the current execution environment.
   *
   * @example
   * ```typescript
   * import { Utility } from '@aws-lambda-powertools/commons';
   *
   * const utility = new Utility();
   * utility.isColdStart(); // true
   * utility.isColdStart(); // false
   * ```
   *
   * The method also flips the cold start status to `false` after the first invocation.
   */
  getColdStart() {
    if (this.coldStart) {
      this.coldStart = false;
      return true;
    }
    return false;
  }
  /**
   * Get the cold start status of the current execution environment.
   *
   * @example
   * ```typescript
   * import { Utility } from '@aws-lambda-powertools/commons';
   *
   * const utility = new Utility();
   * utility.isColdStart(); // true
   * utility.isColdStart(); // false
   * ```
   *
   * @see {@link getColdStart}
   */
  isColdStart() {
    return this.getColdStart();
  }
  /**
   * Get the default service name.
   */
  getDefaultServiceName() {
    return this.defaultServiceName;
  }
  /**
   * Validate that the service name provided is valid.
   * Used internally during initialization.
   *
   * @param serviceName Service name to validate
   */
  isValidServiceName(serviceName) {
    return typeof serviceName === "string" && serviceName.trim().length > 0;
  }
};

// ../../node_modules/@aws-lambda-powertools/commons/lib/esm/config/EnvironmentVariablesService.js
var EnvironmentVariablesService = class {
  /**
   * Increase JSON indentation for Logger to ease debugging when running functions locally or in a non-production environment
   */
  devModeVariable = "POWERTOOLS_DEV";
  /**
   * Set service name used for tracing namespace, metrics dimension and structured logging
   */
  serviceNameVariable = "POWERTOOLS_SERVICE_NAME";
  /**
   * AWS X-Ray Trace ID environment variable
   * @private
   */
  xRayTraceIdVariable = "_X_AMZN_TRACE_ID";
  /**
   * Get the value of an environment variable by name.
   *
   * @param {string} name The name of the environment variable to fetch.
   */
  get(name) {
    return process.env[name]?.trim() || "";
  }
  /**
   * Get the value of the `POWERTOOLS_SERVICE_NAME` environment variable.
   */
  getServiceName() {
    return this.get(this.serviceNameVariable);
  }
  /**
   * Get the value of the `_X_AMZN_TRACE_ID` environment variable.
   *
   * The AWS X-Ray Trace data available in the environment variable has this format:
   * `Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1`,
   *
   * The actual Trace ID is: `1-5759e988-bd862e3fe1be46a994272793`.
   */
  getXrayTraceId() {
    const xRayTraceData = this.getXrayTraceData();
    return xRayTraceData?.Root;
  }
  /**
   * Determine if the current invocation is part of a sampled X-Ray trace.
   *
   * The AWS X-Ray Trace data available in the environment variable has this format:
   * `Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1`,
   */
  getXrayTraceSampled() {
    const xRayTraceData = this.getXrayTraceData();
    return xRayTraceData?.Sampled === "1";
  }
  /**
   * Determine if the current invocation is running in a development environment.
   */
  isDevMode() {
    return this.isValueTrue(this.get(this.devModeVariable));
  }
  /**
   * Helper function to determine if a value is considered thruthy.
   *
   * @param value The value to check for truthiness.
   */
  isValueTrue(value) {
    const truthyValues = ["1", "y", "yes", "t", "true", "on"];
    return truthyValues.includes(value.toLowerCase());
  }
  /**
   * Get the AWS X-Ray Trace data from the environment variable.
   *
   * The method parses the environment variable `_X_AMZN_TRACE_ID` and returns an object with the key-value pairs.
   */
  getXrayTraceData() {
    const xRayTraceEnv = this.get(this.xRayTraceIdVariable);
    if (xRayTraceEnv === "")
      return void 0;
    if (!xRayTraceEnv.includes("="))
      return { Root: xRayTraceEnv };
    const xRayTraceData = {};
    xRayTraceEnv.split(";").forEach((field) => {
      const [key, value] = field.split("=");
      xRayTraceData[key] = value;
    });
    return xRayTraceData;
  }
};

// ../../node_modules/@aws-lambda-powertools/commons/lib/esm/awsSdkUtils.js
var EXEC_ENV = process.env.AWS_EXECUTION_ENV || "NA";

// ../../node_modules/@aws-lambda-powertools/commons/lib/esm/middleware/constants.js
var PREFIX = "powertools-for-aws";
var TRACER_KEY = `${PREFIX}.tracer`;
var METRICS_KEY = `${PREFIX}.metrics`;
var LOGGER_KEY = `${PREFIX}.logger`;
var IDEMPOTENCY_KEY = `${PREFIX}.idempotency`;

// ../../node_modules/@aws-lambda-powertools/logger/lib/esm/Logger.js
var import_lodash2 = __toESM(require_lodash(), 1);
var import_node_console = require("node:console");
var import_node_crypto = require("node:crypto");

// ../../node_modules/@aws-lambda-powertools/logger/lib/esm/config/EnvironmentVariablesService.js
var EnvironmentVariablesService2 = class extends EnvironmentVariablesService {
  // Reserved environment variables
  awsLogLevelVariable = "AWS_LAMBDA_LOG_LEVEL";
  awsRegionVariable = "AWS_REGION";
  currentEnvironmentVariable = "ENVIRONMENT";
  functionNameVariable = "AWS_LAMBDA_FUNCTION_NAME";
  functionVersionVariable = "AWS_LAMBDA_FUNCTION_VERSION";
  logEventVariable = "POWERTOOLS_LOGGER_LOG_EVENT";
  logLevelVariable = "POWERTOOLS_LOG_LEVEL";
  logLevelVariableLegacy = "LOG_LEVEL";
  memoryLimitInMBVariable = "AWS_LAMBDA_FUNCTION_MEMORY_SIZE";
  sampleRateValueVariable = "POWERTOOLS_LOGGER_SAMPLE_RATE";
  tzVariable = "TZ";
  /**
   * It returns the value of the `AWS_LAMBDA_LOG_LEVEL` environment variable.
   *
   * The `AWS_LAMBDA_LOG_LEVEL` environment variable is set by AWS Lambda when configuring
   * the function's log level using the Advanced Logging Controls feature. This value always
   * takes precedence over other means of configuring the log level.
   *
   * @note we need to map the `FATAL` log level to `CRITICAL`, see {@link https://docs.aws.amazon.com/lambda/latest/dg/configuration-logging.html#configuration-logging-log-levels AWS Lambda Log Levels}.
   *
   * @returns {string}
   */
  getAwsLogLevel() {
    const awsLogLevelVariable = this.get(this.awsLogLevelVariable);
    return awsLogLevelVariable === "FATAL" ? "CRITICAL" : awsLogLevelVariable;
  }
  /**
   * It returns the value of the AWS_REGION environment variable.
   *
   * @returns {string}
   */
  getAwsRegion() {
    return this.get(this.awsRegionVariable);
  }
  /**
   * It returns the value of the ENVIRONMENT environment variable.
   *
   * @returns {string}
   */
  getCurrentEnvironment() {
    return this.get(this.currentEnvironmentVariable);
  }
  /**
   * It returns the value of the AWS_LAMBDA_FUNCTION_MEMORY_SIZE environment variable.
   *
   * @returns {string}
   */
  getFunctionMemory() {
    const value = this.get(this.memoryLimitInMBVariable);
    return Number(value);
  }
  /**
   * It returns the value of the AWS_LAMBDA_FUNCTION_NAME environment variable.
   *
   * @returns {string}
   */
  getFunctionName() {
    return this.get(this.functionNameVariable);
  }
  /**
   * It returns the value of the AWS_LAMBDA_FUNCTION_VERSION environment variable.
   *
   * @returns {string}
   */
  getFunctionVersion() {
    return this.get(this.functionVersionVariable);
  }
  /**
   * It returns the value of the POWERTOOLS_LOGGER_LOG_EVENT environment variable.
   *
   * @returns {boolean}
   */
  getLogEvent() {
    const value = this.get(this.logEventVariable);
    return this.isValueTrue(value);
  }
  /**
   * It returns the value of the `POWERTOOLS_LOG_LEVEL, or `LOG_LEVEL` (legacy) environment variables
   * when the first one is not set.
   *
   * @note The `LOG_LEVEL` environment variable is considered legacy and will be removed in a future release.
   * @note The `AWS_LAMBDA_LOG_LEVEL` environment variable always takes precedence over the ones above.
   *
   * @returns {string}
   */
  getLogLevel() {
    const logLevelVariable = this.get(this.logLevelVariable);
    const logLevelVariableAlias = this.get(this.logLevelVariableLegacy);
    return logLevelVariable !== "" ? logLevelVariable : logLevelVariableAlias;
  }
  /**
   * It returns the value of the POWERTOOLS_LOGGER_SAMPLE_RATE environment variable.
   *
   * @returns {number|undefined}
   */
  getSampleRateValue() {
    const value = this.get(this.sampleRateValueVariable);
    return value && value.length > 0 ? Number(value) : void 0;
  }
  /**
   * It returns the value of the `TZ` environment variable or `UTC` if it is not set.
   *
   * @returns {string}
   */
  getTimezone() {
    const value = this.get(this.tzVariable);
    return value.length > 0 ? value : "UTC";
  }
};

// ../../node_modules/@aws-lambda-powertools/logger/lib/esm/constants.js
var LogJsonIndent = {
  PRETTY: 4,
  COMPACT: 0
};

// ../../node_modules/@aws-lambda-powertools/logger/lib/esm/formatter/LogFormatter.js
var LogFormatter = class {
  /**
   * EnvironmentVariablesService instance.
   * If set, it allows to access environment variables.
   */
  envVarsService;
  constructor(options) {
    this.envVarsService = options?.envVarsService;
  }
  /**
   * It formats a given Error parameter.
   *
   * @param {Error} error
   * @returns {LogAttributes}
   */
  formatError(error) {
    return {
      name: error.name,
      location: this.getCodeLocation(error.stack),
      message: error.message,
      stack: error.stack,
      cause: error.cause instanceof Error ? this.formatError(error.cause) : error.cause
    };
  }
  /**
   * Formats a given date into an ISO 8601 string, considering the configured timezone.
   * If `envVarsService` is set and the configured timezone differs from 'UTC',
   * the date is formatted to that timezone. Otherwise, it defaults to 'UTC'.
   *
   * @param {Date} now
   * @returns {string}
   */
  formatTimestamp(now) {
    const defaultTimezone = "UTC";
    const configuredTimezone = this.envVarsService?.getTimezone();
    if (configuredTimezone && !configuredTimezone.includes(defaultTimezone))
      return this.#generateISOTimestampWithOffset(now, configuredTimezone);
    return now.toISOString();
  }
  /**
   * It returns a string containing the location of an error, given a particular stack trace.
   *
   * @param stack
   * @returns {string}
   */
  getCodeLocation(stack) {
    if (!stack) {
      return "";
    }
    const stackLines = stack.split("\n");
    const regex = /\(([^)]*?):(\d+?):(\d+?)\)\\?$/;
    let i;
    for (i = 0; i < stackLines.length; i++) {
      const match = regex.exec(stackLines[i]);
      if (Array.isArray(match)) {
        return `${match[1]}:${Number(match[2])}`;
      }
    }
    return "";
  }
  /**
   * Generates a new Intl.DateTimeFormat object configured with the specified time zone
   * and formatting options. The time is displayed in 24-hour format (hour12: false).
   *
   * @param {string} timeZone - the IANA time zone identifier (e.g., "Asia/Dhaka").
   */
  #getDateFormatter = (timeZone) => {
    const twoDigitFormatOption = "2-digit";
    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: twoDigitFormatOption,
      day: twoDigitFormatOption,
      hour: twoDigitFormatOption,
      minute: twoDigitFormatOption,
      second: twoDigitFormatOption,
      hour12: false,
      timeZone
    });
  };
  /**
   * Generates an ISO 8601 timestamp string with the specified time zone and the local time zone offset.
   *
   * @param {Date} date - the date to format
   * @param {string} timeZone - the IANA time zone identifier (e.g., "Asia/Dhaka").
   */
  #generateISOTimestampWithOffset(date, timeZone) {
    const { year, month, day, hour, minute, second } = this.#getDateFormatter(timeZone).formatToParts(date).reduce((acc, item) => {
      acc[item.type] = item.value;
      return acc;
    }, {});
    const datePart = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    const offset = -date.getTimezoneOffset();
    const offsetSign = offset >= 0 ? "+" : "-";
    const offsetHours = Math.abs(Math.floor(offset / 60)).toString().padStart(2, "0");
    const offsetMinutes = Math.abs(offset % 60).toString().padStart(2, "0");
    const millisecondPart = date.getMilliseconds().toString().padStart(3, "0");
    const offsetPart = `${offsetSign}${offsetHours}:${offsetMinutes}`;
    return `${datePart}.${millisecondPart}${offsetPart}`;
  }
};

// ../../node_modules/@aws-lambda-powertools/logger/lib/esm/formatter/LogItem.js
var import_lodash = __toESM(require_lodash(), 1);
var LogItem = class {
  attributes = {};
  constructor(params) {
    this.addAttributes(params.attributes);
  }
  addAttributes(attributes) {
    (0, import_lodash.default)(this.attributes, attributes);
    return this;
  }
  getAttributes() {
    return this.attributes;
  }
  prepareForPrint() {
    this.setAttributes(this.removeEmptyKeys(this.getAttributes()));
  }
  removeEmptyKeys(attributes) {
    const newAttributes = {};
    for (const key in attributes) {
      if (attributes[key] !== void 0 && attributes[key] !== "" && attributes[key] !== null) {
        newAttributes[key] = attributes[key];
      }
    }
    return newAttributes;
  }
  setAttributes(attributes) {
    this.attributes = attributes;
  }
};

// ../../node_modules/@aws-lambda-powertools/logger/lib/esm/formatter/PowertoolsLogFormatter.js
var PowertoolsLogFormatter = class extends LogFormatter {
  /**
   * It formats key-value pairs of log attributes.
   *
   * @param {UnformattedAttributes} attributes
   * @param {LogAttributes} additionalLogAttributes
   * @returns {LogItem}
   */
  formatAttributes(attributes, additionalLogAttributes) {
    const baseAttributes = {
      cold_start: attributes.lambdaContext?.coldStart,
      function_arn: attributes.lambdaContext?.invokedFunctionArn,
      function_memory_size: attributes.lambdaContext?.memoryLimitInMB,
      function_name: attributes.lambdaContext?.functionName,
      function_request_id: attributes.lambdaContext?.awsRequestId,
      level: attributes.logLevel,
      message: attributes.message,
      sampling_rate: attributes.sampleRateValue,
      service: attributes.serviceName,
      timestamp: this.formatTimestamp(attributes.timestamp),
      xray_trace_id: attributes.xRayTraceId
    };
    const powertoolsLogItem = new LogItem({ attributes: baseAttributes });
    powertoolsLogItem.addAttributes(additionalLogAttributes);
    return powertoolsLogItem;
  }
};

// ../../node_modules/@aws-lambda-powertools/logger/lib/esm/Logger.js
var Logger = class _Logger extends Utility {
  /**
   * Console instance used to print logs.
   *
   * In AWS Lambda, we create a new instance of the Console class so that we can have
   * full control over the output of the logs. In testing environments, we use the
   * default console instance.
   *
   * This property is initialized in the constructor in setOptions().
   *
   * @private
   */
  console;
  /**
   * Custom config service instance used to configure the logger.
   */
  customConfigService;
  /**
   * Environment variables service instance used to fetch environment variables.
   */
  envVarsService = new EnvironmentVariablesService2();
  /**
   * Whether to print the Lambda invocation event in the logs.
   */
  logEvent = false;
  /**
   * Formatter used to format the log items.
   * @default new PowertoolsLogFormatter()
   */
  logFormatter;
  /**
   * JSON indentation used to format the logs.
   */
  logIndentation = LogJsonIndent.COMPACT;
  /**
   * Log level used internally by the current instance of Logger.
   */
  logLevel = 12;
  /**
   * Log level thresholds used internally by the current instance of Logger.
   *
   * The levels are in ascending order from the most verbose to the least verbose (no logs).
   */
  logLevelThresholds = {
    DEBUG: 8,
    INFO: 12,
    WARN: 16,
    ERROR: 20,
    CRITICAL: 24,
    SILENT: 28
  };
  /**
   * Persistent log attributes that will be logged in all log items.
   */
  persistentLogAttributes = {};
  /**
   * Standard attributes managed by Powertools that will be logged in all log items.
   */
  powertoolsLogData = {};
  /**
   * Temporary log attributes that can be appended with `appendKeys()` method.
   */
  temporaryLogAttributes = {};
  /**
   * Buffer used to store logs until the logger is initialized.
   *
   * Sometimes we need to log warnings before the logger is fully initialized, however we can't log them
   * immediately because the logger is not ready yet. This buffer stores those logs until the logger is ready.
   */
  #buffer = [];
  /**
   * Flag used to determine if the logger is initialized.
   */
  #isInitialized = false;
  /**
   * Map used to hold the list of keys and their type.
   *
   * Because keys of different types can be overwritten, we keep a list of keys that were added and their last
   * type. We then use this map at log preparation time to pick the last one.
   */
  #keys = /* @__PURE__ */ new Map();
  /**
   * This is the initial log leval as set during the initialization of the logger.
   *
   * We keep this value to be able to reset the log level to the initial value when the sample rate is refreshed.
   */
  #initialLogLevel = 12;
  /**
   * Log level used by the current instance of Logger.
   *
   * Returns the log level as a number. The higher the number, the less verbose the logs.
   * To get the log level name, use the {@link getLevelName()} method.
   */
  get level() {
    return this.logLevel;
  }
  /**
   * It initializes the Logger class with an optional set of options (settings).
   * *
   * @param {ConstructorOptions} options
   */
  constructor(options = {}) {
    super();
    const { customConfigService, ...rest } = options;
    this.setCustomConfigService(customConfigService);
    this.setOptions(rest);
    this.#isInitialized = true;
    for (const [level, log] of this.#buffer) {
      this.printLog(level, this.createAndPopulateLogItem(...log));
    }
    this.#buffer = [];
  }
  /**
   * It adds the current Lambda function's invocation context data to the powertoolLogData property of the instance.
   * This context data will be part of all printed log items.
   *
   * @param {Context} context
   * @returns {void}
   */
  addContext(context) {
    this.addToPowertoolsLogData({
      lambdaContext: {
        invokedFunctionArn: context.invokedFunctionArn,
        coldStart: this.getColdStart(),
        awsRequestId: context.awsRequestId,
        memoryLimitInMB: context.memoryLimitInMB,
        functionName: context.functionName,
        functionVersion: context.functionVersion
      }
    });
  }
  /**
   * It adds the given persistent attributes (key-value pairs) to all log items generated by this Logger instance.
   *
   * @deprecated This method is deprecated and will be removed in the future major versions, please use {@link appendPersistentKeys()} instead.
   *
   * @param {LogAttributes} attributes
   * @returns {void}
   */
  addPersistentLogAttributes(attributes) {
    this.appendPersistentKeys(attributes);
  }
  /**
   * It adds the given temporary attributes (key-value pairs) to all log items generated by this Logger instance.
   *
   * @param {LogAttributes} attributes
   * @returns {void}
   */
  appendKeys(attributes) {
    for (const attributeKey of Object.keys(attributes)) {
      this.#keys.set(attributeKey, "temp");
    }
    (0, import_lodash2.default)(this.temporaryLogAttributes, attributes);
  }
  /**
   * It adds the given persistent attributes (key-value pairs) to all log items generated by this Logger instance.
   *
   * @param attributes - The attributes to add to all log items.
   */
  appendPersistentKeys(attributes) {
    for (const attributeKey of Object.keys(attributes)) {
      this.#keys.set(attributeKey, "persistent");
    }
    (0, import_lodash2.default)(this.persistentLogAttributes, attributes);
  }
  /**
   * It creates a separate Logger instance, identical to the current one
   * It's possible to overwrite the new instance options by passing them.
   *
   * @param {ConstructorOptions} options
   * @returns {Logger}
   */
  createChild(options = {}) {
    const childLogger = this.createLogger(
      // Merge parent logger options with options passed to createChild,
      // the latter having precedence.
      (0, import_lodash2.default)({}, {
        logLevel: this.getLevelName(),
        serviceName: this.powertoolsLogData.serviceName,
        sampleRateValue: this.powertoolsLogData.sampleRateValue,
        logFormatter: this.getLogFormatter(),
        customConfigService: this.getCustomConfigService(),
        environment: this.powertoolsLogData.environment,
        persistentLogAttributes: this.persistentLogAttributes,
        temporaryLogAttributes: this.temporaryLogAttributes
      }, options)
    );
    if (this.powertoolsLogData.lambdaContext)
      childLogger.addContext(this.powertoolsLogData.lambdaContext);
    return childLogger;
  }
  /**
   * It prints a log item with level CRITICAL.
   *
   * @param {LogItemMessage} input
   * @param {Error | LogAttributes | string} extraInput
   */
  critical(input, ...extraInput) {
    this.processLogItem(24, input, extraInput);
  }
  /**
   * It prints a log item with level DEBUG.
   *
   * @param {LogItemMessage} input
   * @param {Error | LogAttributes | string} extraInput
   * @returns {void}
   */
  debug(input, ...extraInput) {
    this.processLogItem(8, input, extraInput);
  }
  /**
   * It prints a log item with level ERROR.
   *
   * @param {LogItemMessage} input
   * @param {Error | LogAttributes | string} extraInput
   * @returns {void}
   */
  error(input, ...extraInput) {
    this.processLogItem(20, input, extraInput);
  }
  /**
   * Get the log level name of the current instance of Logger.
   *
   * It returns the log level name, i.e. `INFO`, `DEBUG`, etc.
   * To get the log level as a number, use the {@link Logger.level} property.
   *
   * @returns {Uppercase<LogLevel>} The log level name.
   */
  getLevelName() {
    return this.getLogLevelNameFromNumber(this.logLevel);
  }
  /**
   * It returns a boolean value. True means that the Lambda invocation events
   * are printed in the logs.
   *
   * @returns {boolean}
   */
  getLogEvent() {
    return this.logEvent;
  }
  /**
   * It returns the persistent log attributes, which are the attributes
   * that will be logged in all log items.
   *
   * @private
   * @returns {LogAttributes}
   */
  getPersistentLogAttributes() {
    return this.persistentLogAttributes;
  }
  /**
   * It prints a log item with level INFO.
   *
   * @param {LogItemMessage} input
   * @param {Error | LogAttributes | string} extraInput
   * @returns {void}
   */
  info(input, ...extraInput) {
    this.processLogItem(12, input, extraInput);
  }
  /**
   * Method decorator that adds the current Lambda function context as extra
   * information in all log items.
   *
   * The decorator can be used only when attached to a Lambda function handler which
   * is written as method of a class, and should be declared just before the handler declaration.
   *
   * Note: Currently TypeScript only supports decorators on classes and methods. If you are using the
   * function syntax, you should use the middleware instead.
   *
   * @example
   * ```typescript
   * import { Logger } from '@aws-lambda-powertools/logger';
   * import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
   *
   * const logger = new Logger();
   *
   * class Lambda implements LambdaInterface {
   *     // Decorate your handler class method
   *     ⁣@logger.injectLambdaContext()
   *     public async handler(_event: unknown, _context: unknown): Promise<void> {
   *         logger.info('This is an INFO log with some context');
   *     }
   * }
   *
   * const handlerClass = new Lambda();
   * export const handler = handlerClass.handler.bind(handlerClass);
   * ```
   *
   * @see https://www.typescriptlang.org/docs/handbook/decorators.html#method-decorators
   * @returns {HandlerMethodDecorator}
   */
  injectLambdaContext(options) {
    return (_target, _propertyKey, descriptor) => {
      const originalMethod = descriptor.value;
      const loggerRef = this;
      descriptor.value = async function(event, context, callback) {
        _Logger.injectLambdaContextBefore(loggerRef, event, context, options);
        let result;
        try {
          result = await originalMethod.apply(this, [event, context, callback]);
        } catch (error) {
          throw error;
        } finally {
          if (options?.clearState || options?.resetKeys)
            loggerRef.resetKeys();
        }
        return result;
      };
    };
  }
  /**
   * @deprecated This method is deprecated and will be removed in the future major versions. Use {@link resetKeys()} instead.
   */
  /* istanbul ignore next */
  static injectLambdaContextAfterOrOnError(logger2, _persistentAttributes, options) {
    if (options && (options.clearState || options?.resetKeys)) {
      logger2.resetKeys();
    }
  }
  static injectLambdaContextBefore(logger2, event, context, options) {
    logger2.addContext(context);
    let shouldLogEvent = void 0;
    if (options && Object.hasOwn(options, "logEvent")) {
      shouldLogEvent = options.logEvent;
    }
    logger2.logEventIfEnabled(event, shouldLogEvent);
  }
  /**
   * Logs a Lambda invocation event, if it *should*.
   *
   ** @param {unknown} event
   * @param {boolean} [overwriteValue]
   * @returns {void}
   */
  logEventIfEnabled(event, overwriteValue) {
    if (!this.shouldLogEvent(overwriteValue))
      return;
    this.info("Lambda invocation event", { event });
  }
  /**
   * This method allows recalculating the initial sampling decision for changing
   * the log level to DEBUG based on a sample rate value used during initialization,
   * potentially yielding a different outcome.
   *
   * @returns {void}
   */
  refreshSampleRateCalculation() {
    this.setInitialSampleRate(this.powertoolsLogData.sampleRateValue);
  }
  /**
   * It removes temporary attributes based on provided keys to all log items generated by this Logger instance.
   *
   * @param {string[]} keys
   * @returns {void}
   */
  removeKeys(keys) {
    for (const key of keys) {
      this.temporaryLogAttributes[key] = void 0;
      if (this.persistentLogAttributes[key]) {
        this.#keys.set(key, "persistent");
      } else {
        this.#keys.delete(key);
      }
    }
  }
  /**
   * Remove the given keys from the persistent keys.
   *
   * @example
   * ```typescript
   * import { Logger } from '@aws-lambda-powertools/logger';
   *
   * const logger = new Logger({
   *   persistentKeys: {
   *     environment: 'prod',
   *   },
   * });
   *
   * logger.removePersistentKeys(['environment']);
   * ```
   *
   * @param keys - The keys to remove from the persistent attributes.
   */
  removePersistentKeys(keys) {
    for (const key of keys) {
      this.persistentLogAttributes[key] = void 0;
      if (this.temporaryLogAttributes[key]) {
        this.#keys.set(key, "temp");
      } else {
        this.#keys.delete(key);
      }
    }
  }
  /**
   * @deprecated This method is deprecated and will be removed in the future major versions. Use {@link removePersistentKeys()} instead.
   *
   * @param {string[]} keys
   * @returns {void}
   */
  removePersistentLogAttributes(keys) {
    this.removePersistentKeys(keys);
  }
  /**
   * It removes all temporary log attributes added with `appendKeys()` method.
   */
  resetKeys() {
    for (const key of Object.keys(this.temporaryLogAttributes)) {
      if (this.persistentLogAttributes[key]) {
        this.#keys.set(key, "persistent");
      } else {
        this.#keys.delete(key);
      }
    }
    this.temporaryLogAttributes = {};
  }
  /**
   * Set the log level for this Logger instance.
   *
   * If the log level is set using AWS Lambda Advanced Logging Controls, it sets it
   * instead of the given log level to avoid data loss.
   *
   * @param logLevel The log level to set, i.e. `error`, `warn`, `info`, `debug`, etc.
   */
  setLogLevel(logLevel) {
    if (this.awsLogLevelShortCircuit(logLevel))
      return;
    if (this.isValidLogLevel(logLevel)) {
      this.logLevel = this.logLevelThresholds[logLevel];
    } else {
      throw new Error(`Invalid log level: ${logLevel}`);
    }
  }
  /**
   * It sets the given attributes (key-value pairs) to all log items generated by this Logger instance.
   * Note: this replaces the pre-existing value.
   *
   * @deprecated This method is deprecated and will be removed in the future major versions, please use {@link appendPersistentKeys()} instead.
   *
   * @param {LogAttributes} attributes
   * @returns {void}
   */
  setPersistentLogAttributes(attributes) {
    this.persistentLogAttributes = attributes;
  }
  /**
   * It checks whether the current Lambda invocation event should be printed in the logs or not.
   *
   * @private
   * @param {boolean} [overwriteValue]
   * @returns {boolean}
   */
  shouldLogEvent(overwriteValue) {
    if (typeof overwriteValue === "boolean") {
      return overwriteValue;
    }
    return this.getLogEvent();
  }
  /**
   * It prints a log item with level WARN.
   *
   * @param {LogItemMessage} input
   * @param {Error | LogAttributes | string} extraInput
   * @returns {void}
   */
  warn(input, ...extraInput) {
    this.processLogItem(16, input, extraInput);
  }
  /**
   * Factory method for instantiating logger instances. Used by `createChild` method.
   * Important for customization and subclassing. It allows subclasses, like `MyOwnLogger`,
   * to override its behavior while keeping the main business logic in `createChild` intact.
   *
   * @example
   * ```typescript
   * // MyOwnLogger subclass
   * class MyOwnLogger extends Logger {
   *   protected createLogger(options?: ConstructorOptions): MyOwnLogger {
   *     return new MyOwnLogger(options);
   *   }
   *   // No need to re-implement business logic from `createChild` and keep track on changes
   *   public createChild(options?: ConstructorOptions): MyOwnLogger {
   *     return super.createChild(options) as MyOwnLogger;
   *   }
   * }
   * ```
   *
   * @param {ConstructorOptions} [options] Logger configuration options.
   * @returns {Logger} A new logger instance.
   */
  createLogger(options) {
    return new _Logger(options);
  }
  /**
   * It stores information that is printed in all log items.
   *
   * @param {Partial<PowertoolsLogData>} attributes
   * @private
   * @returns {void}
   */
  addToPowertoolsLogData(attributes) {
    (0, import_lodash2.default)(this.powertoolsLogData, attributes);
  }
  awsLogLevelShortCircuit(selectedLogLevel) {
    const awsLogLevel = this.getEnvVarsService().getAwsLogLevel();
    if (this.isValidLogLevel(awsLogLevel)) {
      this.logLevel = this.logLevelThresholds[awsLogLevel];
      if (this.isValidLogLevel(selectedLogLevel) && this.logLevel > this.logLevelThresholds[selectedLogLevel]) {
        this.warn(`Current log level (${selectedLogLevel}) does not match AWS Lambda Advanced Logging Controls minimum log level (${awsLogLevel}). This can lead to data loss, consider adjusting them.`);
      }
      return true;
    }
    return false;
  }
  /**
   * Create a log item and populate it with the given log level, input, and extra input.
   *
   * We start with creating an object with base attributes managed by Powertools.
   * Then we create a second object with persistent attributes provided by customers either
   * directly to the log entry or through initial configuration and `appendKeys` method.
   *
   * Once we have the two objects, we pass them to the formatter that will apply the desired
   * formatting to the log item.
   *
   * @param logLevel The log level of the log item to be printed
   * @param input The main input of the log item, this can be a string or an object with additional attributes
   * @param extraInput Additional attributes to be added to the log item
   */
  createAndPopulateLogItem(logLevel, input, extraInput) {
    let message = "";
    let otherInput = {};
    if (typeof input === "string") {
      message = input;
    } else {
      const { message: inputMessage, ...rest } = input;
      message = inputMessage;
      otherInput = rest;
    }
    const unformattedBaseAttributes = {
      logLevel: this.getLogLevelNameFromNumber(logLevel),
      timestamp: /* @__PURE__ */ new Date(),
      message,
      xRayTraceId: this.envVarsService.getXrayTraceId(),
      ...this.getPowertoolsLogData()
    };
    const additionalAttributes = {};
    for (const [key, type] of this.#keys) {
      if (type === "persistent") {
        additionalAttributes[key] = this.persistentLogAttributes[key];
      } else {
        additionalAttributes[key] = this.temporaryLogAttributes[key];
      }
    }
    (0, import_lodash2.default)(additionalAttributes, otherInput);
    for (const item of extraInput) {
      const attributes = item instanceof Error ? { error: item } : typeof item === "string" ? { extra: item } : item;
      (0, import_lodash2.default)(additionalAttributes, attributes);
    }
    return this.getLogFormatter().formatAttributes(unformattedBaseAttributes, additionalAttributes);
  }
  /**
   * It returns the custom config service, an abstraction used to fetch environment variables.
   *
   * @private
   * @returns {ConfigServiceInterface | undefined}
   */
  getCustomConfigService() {
    return this.customConfigService;
  }
  /**
   * It returns the instance of a service that fetches environment variables.
   *
   * @private
   * @returns {EnvironmentVariablesService}
   */
  getEnvVarsService() {
    return this.envVarsService;
  }
  /**
   * It returns the instance of a service that formats the structure of a
   * log item's keys and values in the desired way.
   *
   * @private
   * @returns {LogFormatterInterface}
   */
  getLogFormatter() {
    return this.logFormatter;
  }
  /**
   * Get the log level name from the log level number.
   *
   * For example, if the log level is 16, it will return 'WARN'.
   *
   * @param logLevel - The log level to get the name of
   * @returns - The name of the log level
   */
  getLogLevelNameFromNumber(logLevel) {
    let found;
    for (const [key, value] of Object.entries(this.logLevelThresholds)) {
      if (value === logLevel) {
        found = key;
        break;
      }
    }
    return found;
  }
  /**
   * It returns information that will be added in all log item by
   * this Logger instance (different from user-provided persistent attributes).
   *
   * @private
   * @returns {LogAttributes}
   */
  getPowertoolsLogData() {
    return this.powertoolsLogData;
  }
  /**
   * When the data added in the log item contains object references or BigInt values,
   * `JSON.stringify()` can't handle them and instead throws errors:
   * `TypeError: cyclic object value` or `TypeError: Do not know how to serialize a BigInt`.
   * To mitigate these issues, this method will find and remove all cyclic references and convert BigInt values to strings.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#exceptions
   * @private
   */
  getReplacer() {
    const references = /* @__PURE__ */ new WeakSet();
    return (key, value) => {
      let item = value;
      if (item instanceof Error) {
        item = this.getLogFormatter().formatError(item);
      }
      if (typeof item === "bigint") {
        return item.toString();
      }
      if (typeof item === "object" && value !== null) {
        if (references.has(item)) {
          return;
        }
        references.add(item);
      }
      return item;
    };
  }
  /**
   * It returns true and type guards the log level if a given log level is valid.
   *
   * @param {LogLevel} logLevel
   * @private
   * @returns {boolean}
   */
  isValidLogLevel(logLevel) {
    return typeof logLevel === "string" && logLevel in this.logLevelThresholds;
  }
  /**
   * It returns true and type guards the sample rate value if a given value is valid.
   *
   * @param sampleRateValue
   * @private
   * @returns {boolean}
   */
  isValidSampleRate(sampleRateValue) {
    return typeof sampleRateValue === "number" && 0 <= sampleRateValue && sampleRateValue <= 1;
  }
  /**
   * It prints a given log with given log level.
   *
   * @param {number} logLevel
   * @param {LogItem} log
   * @private
   */
  printLog(logLevel, log) {
    log.prepareForPrint();
    const consoleMethod = logLevel === 24 ? "error" : this.getLogLevelNameFromNumber(logLevel).toLowerCase();
    this.console[consoleMethod](JSON.stringify(log.getAttributes(), this.getReplacer(), this.logIndentation));
  }
  /**
   * It prints a given log with given log level.
   *
   * @param {number} logLevel
   * @param {LogItemMessage} input
   * @param {LogItemExtraInput} extraInput
   * @private
   */
  processLogItem(logLevel, input, extraInput) {
    if (logLevel >= this.logLevel) {
      if (this.#isInitialized) {
        this.printLog(logLevel, this.createAndPopulateLogItem(logLevel, input, extraInput));
      } else {
        this.#buffer.push([logLevel, [logLevel, input, extraInput]]);
      }
    }
  }
  /**
   * It initializes console property as an instance of the internal version of Console() class (PR #748)
   * or as the global node console if the `POWERTOOLS_DEV' env variable is set and has truthy value.
   *
   * @private
   * @returns {void}
   */
  setConsole() {
    if (!this.getEnvVarsService().isDevMode()) {
      this.console = new import_node_console.Console({
        stdout: process.stdout,
        stderr: process.stderr
      });
    } else {
      this.console = console;
    }
  }
  /**
   * Sets the Logger's customer config service instance, which will be used
   * to fetch environment variables.
   *
   * @private
   * @param {ConfigServiceInterface} customConfigService
   * @returns {void}
   */
  setCustomConfigService(customConfigService) {
    this.customConfigService = customConfigService ? customConfigService : void 0;
  }
  /**
   * Sets the initial Logger log level based on the following order:
   * 1. If a log level is set using AWS Lambda Advanced Logging Controls, it sets it.
   * 2. If a log level is passed to the constructor, it sets it.
   * 3. If a log level is set via custom config service, it sets it.
   * 4. If a log level is set via env variables, it sets it.
   *
   * If none of the above is true, the default log level applies (`INFO`).
   *
   * @private
   * @param {LogLevel} [logLevel] - Log level passed to the constructor
   */
  setInitialLogLevel(logLevel) {
    const constructorLogLevel = logLevel?.toUpperCase();
    if (this.awsLogLevelShortCircuit(constructorLogLevel))
      return;
    if (this.isValidLogLevel(constructorLogLevel)) {
      this.logLevel = this.logLevelThresholds[constructorLogLevel];
      this.#initialLogLevel = this.logLevel;
      return;
    }
    const customConfigValue = this.getCustomConfigService()?.getLogLevel()?.toUpperCase();
    if (this.isValidLogLevel(customConfigValue)) {
      this.logLevel = this.logLevelThresholds[customConfigValue];
      this.#initialLogLevel = this.logLevel;
      return;
    }
    const envVarsValue = this.getEnvVarsService()?.getLogLevel()?.toUpperCase();
    if (this.isValidLogLevel(envVarsValue)) {
      this.logLevel = this.logLevelThresholds[envVarsValue];
      this.#initialLogLevel = this.logLevel;
      return;
    }
  }
  /**
   * It sets sample rate value with the following prioprity:
   * 1. Constructor value
   * 2. Custom config service value
   * 3. Environment variable value
   * 4. Default value (zero)
   *
   * @private
   * @param {number} [sampleRateValue]
   * @returns {void}
   */
  setInitialSampleRate(sampleRateValue) {
    this.powertoolsLogData.sampleRateValue = 0;
    const constructorValue = sampleRateValue;
    const customConfigValue = this.getCustomConfigService()?.getSampleRateValue();
    const envVarsValue = this.getEnvVarsService().getSampleRateValue();
    for (const value of [constructorValue, customConfigValue, envVarsValue]) {
      if (this.isValidSampleRate(value)) {
        this.powertoolsLogData.sampleRateValue = value;
        if (value && (0, import_node_crypto.randomInt)(0, 100) / 100 <= value) {
          this.setLogLevel("DEBUG");
          this.debug("Setting log level to DEBUG due to sampling rate");
        } else {
          this.setLogLevel(this.getLogLevelNameFromNumber(this.#initialLogLevel));
        }
        return;
      }
    }
  }
  /**
   * If the log event feature is enabled via env variable, it sets a property that tracks whether
   * the event passed to the Lambda function handler should be logged or not.
   *
   * @private
   * @returns {void}
   */
  setLogEvent() {
    if (this.getEnvVarsService().getLogEvent()) {
      this.logEvent = true;
    }
  }
  /**
   * It sets the log formatter instance, in charge of giving a custom format
   * to the structured logs
   *
   * @private
   * @param {LogFormatterInterface} logFormatter
   * @returns {void}
   */
  setLogFormatter(logFormatter) {
    this.logFormatter = logFormatter ?? new PowertoolsLogFormatter({ envVarsService: this.getEnvVarsService() });
  }
  /**
   * If the `POWERTOOLS_DEV` env variable is set,
   * it adds JSON indentation for pretty printing logs.
   *
   * @private
   * @returns {void}
   */
  setLogIndentation() {
    if (this.getEnvVarsService().isDevMode()) {
      this.logIndentation = LogJsonIndent.PRETTY;
    }
  }
  /**
   * It configures the Logger instance settings that will affect the Logger's behaviour
   * and the content of all logs.
   *
   * @private
   * @param options Options to configure the Logger instance
   */
  setOptions(options) {
    const {
      logLevel,
      serviceName,
      sampleRateValue,
      logFormatter,
      persistentKeys,
      persistentLogAttributes,
      // deprecated in favor of persistentKeys
      environment
    } = options;
    if (persistentLogAttributes && persistentKeys) {
      this.warn("Both persistentLogAttributes and persistentKeys options were provided. Using persistentKeys as persistentLogAttributes is deprecated and will be removed in future releases");
    }
    this.setPowertoolsLogData(serviceName, environment, persistentKeys || persistentLogAttributes);
    this.setLogEvent();
    this.setInitialLogLevel(logLevel);
    this.setInitialSampleRate(sampleRateValue);
    this.setLogFormatter(logFormatter);
    this.setConsole();
    this.setLogIndentation();
    return this;
  }
  /**
   * It adds important data to the Logger instance that will affect the content of all logs.
   *
   * @param {string} serviceName
   * @param {Environment} environment
   * @param {LogAttributes} persistentLogAttributes
   * @private
   * @returns {void}
   */
  setPowertoolsLogData(serviceName, environment, persistentLogAttributes = {}) {
    this.addToPowertoolsLogData({
      awsRegion: this.getEnvVarsService().getAwsRegion(),
      environment: environment || this.getCustomConfigService()?.getCurrentEnvironment() || this.getEnvVarsService().getCurrentEnvironment(),
      serviceName: serviceName || this.getCustomConfigService()?.getServiceName() || this.getEnvVarsService().getServiceName() || this.getDefaultServiceName()
    });
    this.appendPersistentKeys(persistentLogAttributes);
  }
};

// ../../node_modules/@aws-lambda-powertools/metrics/lib/esm/Metrics.js
var import_node_console2 = require("node:console");

// ../../node_modules/@aws-lambda-powertools/metrics/lib/esm/config/EnvironmentVariablesService.js
var EnvironmentVariablesService3 = class extends EnvironmentVariablesService {
  namespaceVariable = "POWERTOOLS_METRICS_NAMESPACE";
  /**
   * It returns the value of the POWERTOOLS_METRICS_NAMESPACE environment variable.
   *
   * @returns {string}
   */
  getNamespace() {
    return this.get(this.namespaceVariable);
  }
};

// ../../node_modules/@aws-lambda-powertools/metrics/lib/esm/constants.js
var COLD_START_METRIC = "ColdStart";
var DEFAULT_NAMESPACE = "default_namespace";
var MAX_METRICS_SIZE = 100;
var MAX_METRIC_VALUES_SIZE = 100;
var MAX_DIMENSION_COUNT = 29;
var MetricUnit = {
  Seconds: "Seconds",
  Microseconds: "Microseconds",
  Milliseconds: "Milliseconds",
  Bytes: "Bytes",
  Kilobytes: "Kilobytes",
  Megabytes: "Megabytes",
  Gigabytes: "Gigabytes",
  Terabytes: "Terabytes",
  Bits: "Bits",
  Kilobits: "Kilobits",
  Megabits: "Megabits",
  Gigabits: "Gigabits",
  Terabits: "Terabits",
  Percent: "Percent",
  Count: "Count",
  BytesPerSecond: "Bytes/Second",
  KilobytesPerSecond: "Kilobytes/Second",
  MegabytesPerSecond: "Megabytes/Second",
  GigabytesPerSecond: "Gigabytes/Second",
  TerabytesPerSecond: "Terabytes/Second",
  BitsPerSecond: "Bits/Second",
  KilobitsPerSecond: "Kilobits/Second",
  MegabitsPerSecond: "Megabits/Second",
  GigabitsPerSecond: "Gigabits/Second",
  TerabitsPerSecond: "Terabits/Second",
  CountPerSecond: "Count/Second"
};
var MetricResolution = {
  Standard: 60,
  High: 1
};

// ../../node_modules/@aws-lambda-powertools/metrics/lib/esm/Metrics.js
var Metrics = class _Metrics extends Utility {
  /**
   * Console instance used to print logs.
   *
   * In AWS Lambda, we create a new instance of the Console class so that we can have
   * full control over the output of the logs. In testing environments, we use the
   * default console instance.
   *
   * This property is initialized in the constructor in setOptions().
   *
   * @private
   */
  console;
  customConfigService;
  defaultDimensions = {};
  dimensions = {};
  envVarsService;
  functionName;
  isSingleMetric = false;
  metadata = {};
  namespace;
  shouldThrowOnEmptyMetrics = false;
  storedMetrics = {};
  constructor(options = {}) {
    super();
    this.dimensions = {};
    this.setOptions(options);
  }
  /**
   * Add a dimension to the metrics.
   *
   * A dimension is a key-value pair that is used to group metrics.
   *
   * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#Dimension for more details.
   * @param name
   * @param value
   */
  addDimension(name, value) {
    if (MAX_DIMENSION_COUNT <= this.getCurrentDimensionsCount()) {
      throw new RangeError(`The number of metric dimensions must be lower than ${MAX_DIMENSION_COUNT}`);
    }
    this.dimensions[name] = value;
  }
  /**
   * Add multiple dimensions to the metrics.
   *
   * A dimension is a key-value pair that is used to group metrics.
   *
   * @param dimensions A key-value pair of dimensions
   */
  addDimensions(dimensions) {
    const newDimensions = { ...this.dimensions };
    Object.keys(dimensions).forEach((dimensionName) => {
      newDimensions[dimensionName] = dimensions[dimensionName];
    });
    if (Object.keys(newDimensions).length > MAX_DIMENSION_COUNT) {
      throw new RangeError(`Unable to add ${Object.keys(dimensions).length} dimensions: the number of metric dimensions must be lower than ${MAX_DIMENSION_COUNT}`);
    }
    this.dimensions = newDimensions;
  }
  /**
   * A high-cardinality data part of your Metrics log.
   *
   * This is useful when you want to search highly contextual information along with your metrics in your logs.
   *
   * @param key The key of the metadata
   * @param value The value of the metadata
   */
  addMetadata(key, value) {
    this.metadata[key] = value;
  }
  /**
   * Add a metric to the metrics buffer.
   *
   * By default, metrics are buffered and flushed at the end of the Lambda invocation
   * or when calling {@link Metrics.publishStoredMetrics}.
   *
   * You can add a metric by specifying the metric name, unit, and value. For convenience,
   * we provide a set of constants for the most common units in {@link MetricUnit}.
   *
   * @example
   * ```typescript
   * import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });
   *
   * metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
   * ```
   *
   * Optionally, you can specify the metric resolution, which can be either `High` or `Standard`.
   * By default, metrics are published with a resolution of `Standard`, click [here](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#Resolution_definition)
   * to learn more about metric resolutions.
   *
   * @example
   * ```typescript
   * import { Metrics, MetricUnit, MetricResolution } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });
   *
   * metrics.addMetric('successfulBooking', MetricUnit.Count, 1, MetricResolution.High);
   * ```
   *
   * @param name - The metric name
   * @param unit - The metric unit
   * @param value - The metric value
   * @param resolution - The metric resolution
   */
  addMetric(name, unit, value, resolution = MetricResolution.Standard) {
    this.storeMetric(name, unit, value, resolution);
    if (this.isSingleMetric)
      this.publishStoredMetrics();
  }
  /**
   * Create a singleMetric to capture cold start.
   *
   * If it's a cold start invocation, this feature will:
   *   * Create a separate EMF blob that contains a single metric named ColdStart
   *   * Add function_name and service dimensions
   *
   * This has the advantage of keeping cold start metric separate from your application metrics, where you might have unrelated dimensions,
   * as well as avoiding potential data loss from metrics not being published for other reasons.
   *
   * @example
   * ```typescript
   * import { Metrics } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });
   *
   * export const handler = async (_event: unknown, __context: unknown): Promise<void> => {
   *     metrics.captureColdStartMetric();
   * };
   * ```
   */
  captureColdStartMetric() {
    if (!this.isColdStart())
      return;
    const singleMetric = this.singleMetric();
    if (this.defaultDimensions.service) {
      singleMetric.setDefaultDimensions({
        service: this.defaultDimensions.service
      });
    }
    if (this.functionName != null) {
      singleMetric.addDimension("function_name", this.functionName);
    }
    singleMetric.addMetric(COLD_START_METRIC, MetricUnit.Count, 1);
  }
  /**
   * Clear all default dimensions.
   */
  clearDefaultDimensions() {
    this.defaultDimensions = {};
  }
  /**
   * Clear all dimensions.
   */
  clearDimensions() {
    this.dimensions = {};
  }
  /**
   * Clear all metadata.
   */
  clearMetadata() {
    this.metadata = {};
  }
  /**
   * Clear all the metrics stored in the buffer.
   */
  clearMetrics() {
    this.storedMetrics = {};
  }
  /**
   * A decorator automating coldstart capture, throw on empty metrics and publishing metrics on handler exit.
   *
   * @example
   *
   * ```typescript
   * import { Metrics } from '@aws-lambda-powertools/metrics';
   * import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
   *
   * const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });
   *
   * class Lambda implements LambdaInterface {
   *   @metrics.logMetrics({ captureColdStartMetric: true })
   *   public handler(_event: unknown, __context: unknown): Promise<void> {
   *     // ...
   *   }
   * }
   *
   * const handlerClass = new Lambda();
   * export const handler = handlerClass.handler.bind(handlerClass);
   * ```
   *
   * @decorator Class
   */
  logMetrics(options = {}) {
    const { throwOnEmptyMetrics, defaultDimensions, captureColdStartMetric } = options;
    if (throwOnEmptyMetrics) {
      this.throwOnEmptyMetrics();
    }
    if (defaultDimensions !== void 0) {
      this.setDefaultDimensions(defaultDimensions);
    }
    return (_target, _propertyKey, descriptor) => {
      const originalMethod = descriptor.value;
      const metricsRef = this;
      descriptor.value = async function(event, context, callback) {
        metricsRef.functionName = context.functionName;
        if (captureColdStartMetric)
          metricsRef.captureColdStartMetric();
        let result;
        try {
          result = await originalMethod.apply(this, [event, context, callback]);
        } catch (error) {
          throw error;
        } finally {
          metricsRef.publishStoredMetrics();
        }
        return result;
      };
      return descriptor;
    };
  }
  /**
   * Synchronous function to actually publish your metrics. (Not needed if using logMetrics decorator).
   * It will create a new EMF blob and log it to standard output to be then ingested by Cloudwatch logs and processed automatically for metrics creation.
   *
   * @example
   *
   * ```typescript
   * import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' }); // Sets metric namespace, and service as a metric dimension
   *
   * export const handler = async (_event: unknown, __context: unknown): Promise<void> => {
   *   metrics.addMetric('test-metric', MetricUnit.Count, 10);
   *   metrics.publishStoredMetrics();
   * };
   * ```
   */
  publishStoredMetrics() {
    if (!this.shouldThrowOnEmptyMetrics && Object.keys(this.storedMetrics).length === 0) {
      console.warn("No application metrics to publish. The cold-start metric may be published if enabled. If application metrics should never be empty, consider using `throwOnEmptyMetrics`");
    }
    const target = this.serializeMetrics();
    this.console.log(JSON.stringify(target));
    this.clearMetrics();
    this.clearDimensions();
    this.clearMetadata();
  }
  /**
   * Function to create a new metric object compliant with the EMF (Embedded Metric Format) schema which
   * includes the metric name, unit, and optionally storage resolution.
   *
   * The function will create a new EMF blob and log it to standard output to be then ingested by Cloudwatch
   * logs and processed automatically for metrics creation.
   *
   * @returns metrics as JSON object compliant EMF Schema Specification
   * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format_Specification.html for more details
   */
  serializeMetrics() {
    const metricDefinitions = Object.values(this.storedMetrics).map((metricDefinition) => ({
      Name: metricDefinition.name,
      Unit: metricDefinition.unit,
      ...metricDefinition.resolution === MetricResolution.High ? { StorageResolution: metricDefinition.resolution } : {}
    }));
    if (metricDefinitions.length === 0 && this.shouldThrowOnEmptyMetrics) {
      throw new RangeError("The number of metrics recorded must be higher than zero");
    }
    if (!this.namespace)
      console.warn("Namespace should be defined, default used");
    const metricValues = Object.values(this.storedMetrics).reduce((result, { name, value }) => {
      result[name] = value;
      return result;
    }, {});
    const dimensionNames = [
      .../* @__PURE__ */ new Set([
        ...Object.keys(this.defaultDimensions),
        ...Object.keys(this.dimensions)
      ])
    ];
    return {
      _aws: {
        Timestamp: (/* @__PURE__ */ new Date()).getTime(),
        CloudWatchMetrics: [
          {
            Namespace: this.namespace || DEFAULT_NAMESPACE,
            Dimensions: [dimensionNames],
            Metrics: metricDefinitions
          }
        ]
      },
      ...this.defaultDimensions,
      ...this.dimensions,
      ...metricValues,
      ...this.metadata
    };
  }
  /**
   * Sets default dimensions that will be added to all metrics.
   *
   * @param dimensions The default dimensions to be added to all metrics.
   */
  setDefaultDimensions(dimensions) {
    const targetDimensions = {
      ...this.defaultDimensions,
      ...dimensions
    };
    if (MAX_DIMENSION_COUNT <= Object.keys(targetDimensions).length) {
      throw new Error("Max dimension count hit");
    }
    this.defaultDimensions = targetDimensions;
  }
  /**
   * Sets the function name to be added to the metric.
   *
   * @param value The function name to be added to the metric.
   */
  setFunctionName(value) {
    this.functionName = value;
  }
  /**
   * CloudWatch EMF uses the same dimensions across all your metrics. Use singleMetric if you have a metric that should have different dimensions.
   *
   * You don't need to call publishStoredMetrics() after calling addMetric for a singleMetrics, they will be flushed directly.
   *
   * @example
   *
   * ```typescript
   * const singleMetric = metrics.singleMetric();
   * singleMetric.addDimension('InnerDimension', 'true');
   * singleMetric.addMetric('single-metric', MetricUnit.Percent, 50);
   * ```
   *
   * @returns the Metrics
   */
  singleMetric() {
    return new _Metrics({
      namespace: this.namespace,
      serviceName: this.dimensions.service,
      defaultDimensions: this.defaultDimensions,
      singleMetric: true
    });
  }
  /**
   * Throw an Error if the metrics buffer is empty.
   *
   * @example
   *
   * ```typescript
   * import { Metrics } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName:'orders' });
   *
   * export const handler = async (_event: unknown, __context: unknown): Promise<void> => {
   *     metrics.throwOnEmptyMetrics();
   *     metrics.publishStoredMetrics(); // will throw since no metrics added.
   * };
   * ```
   */
  throwOnEmptyMetrics() {
    this.shouldThrowOnEmptyMetrics = true;
  }
  /**
   * Gets the current number of dimensions stored.
   *
   * @returns the number of dimensions currently stored
   */
  getCurrentDimensionsCount() {
    return Object.keys(this.dimensions).length + Object.keys(this.defaultDimensions).length;
  }
  /**
   * Gets the custom config service if it exists.
   *
   * @returns the custom config service if it exists, undefined otherwise
   */
  getCustomConfigService() {
    return this.customConfigService;
  }
  /**
   * Gets the environment variables service.
   *
   * @returns the environment variables service
   */
  getEnvVarsService() {
    return this.envVarsService;
  }
  /**
   * Checks if a metric is new or not.
   *
   * A metric is considered new if there is no metric with the same name already stored.
   *
   * When a metric is not new, we also check if the unit is consistent with the stored metric with
   * the same name. If the units are inconsistent, we throw an error as this is likely a bug or typo.
   * This can happen if a metric is added without using the `MetricUnit` helper in JavaScript codebases.
   *
   * @param name The name of the metric
   * @param unit The unit of the metric
   * @returns true if the metric is new, false if another metric with the same name already exists
   */
  isNewMetric(name, unit) {
    if (this.storedMetrics[name]) {
      if (this.storedMetrics[name].unit !== unit) {
        const currentUnit = this.storedMetrics[name].unit;
        throw new Error(`Metric "${name}" has already been added with unit "${currentUnit}", but we received unit "${unit}". Did you mean to use metric unit "${currentUnit}"?`);
      }
      return false;
    } else {
      return true;
    }
  }
  /**
   * It initializes console property as an instance of the internal version of Console() class (PR #748)
   * or as the global node console if the `POWERTOOLS_DEV' env variable is set and has truthy value.
   *
   * @private
   * @returns {void}
   */
  setConsole() {
    if (!this.getEnvVarsService().isDevMode()) {
      this.console = new import_node_console2.Console({
        stdout: process.stdout,
        stderr: process.stderr
      });
    } else {
      this.console = console;
    }
  }
  /**
   * Sets the custom config service to be used.
   *
   * @param customConfigService The custom config service to be used
   */
  setCustomConfigService(customConfigService) {
    this.customConfigService = customConfigService ? customConfigService : void 0;
  }
  /**
   * Sets the environment variables service to be used.
   */
  setEnvVarsService() {
    this.envVarsService = new EnvironmentVariablesService3();
  }
  /**
   * Sets the namespace to be used.
   *
   * @param namespace The namespace to be used
   */
  setNamespace(namespace) {
    this.namespace = namespace || this.getCustomConfigService()?.getNamespace() || this.getEnvVarsService().getNamespace();
  }
  /**
   * Sets the options to be used by the Metrics instance.
   *
   * This method is used during the initialization of the Metrics instance.
   *
   * @param options The options to be used
   * @returns the Metrics instance
   */
  setOptions(options) {
    const { customConfigService, namespace, serviceName, singleMetric, defaultDimensions } = options;
    this.setEnvVarsService();
    this.setConsole();
    this.setCustomConfigService(customConfigService);
    this.setNamespace(namespace);
    this.setService(serviceName);
    this.setDefaultDimensions(defaultDimensions);
    this.isSingleMetric = singleMetric || false;
    return this;
  }
  /**
   * Sets the service to be used.
   *
   * @param service The service to be used
   */
  setService(service) {
    const targetService = service || this.getCustomConfigService()?.getServiceName() || this.getEnvVarsService().getServiceName() || this.getDefaultServiceName();
    if (targetService.length > 0) {
      this.setDefaultDimensions({ service: targetService });
    }
  }
  /**
   * Stores a metric in the buffer.
   *
   * If the buffer is full, or the metric reaches the maximum number of values,
   * the buffer is published to stdout.
   *
   * @param name The name of the metric to store
   * @param unit The unit of the metric to store
   * @param value The value of the metric to store
   * @param resolution The resolution of the metric to store
   */
  storeMetric(name, unit, value, resolution) {
    if (Object.keys(this.storedMetrics).length >= MAX_METRICS_SIZE) {
      this.publishStoredMetrics();
    }
    if (this.isNewMetric(name, unit)) {
      this.storedMetrics[name] = {
        unit,
        value,
        name,
        resolution
      };
    } else {
      const storedMetric = this.storedMetrics[name];
      if (!Array.isArray(storedMetric.value)) {
        storedMetric.value = [storedMetric.value];
      }
      storedMetric.value.push(value);
      if (storedMetric.value.length === MAX_METRIC_VALUES_SIZE) {
        this.publishStoredMetrics();
      }
    }
  }
};

// ../../lib/ts/v1/initConstants.ts
var IS_DEPLOYED = true;
var ACCOUNT_ID;
if (process.env.STAGE && process.env.STAGE === "local") {
  IS_DEPLOYED = false;
  ACCOUNT_ID = "123456789012";
} else {
  ACCOUNT_ID = process.env.ACCOUNT_ID || "N/A";
}
var SERVICE = process.env.SERVICE || "N/A";
var STAGE = process.env.STAGE || "local";
var REGION = process.env.REGION || "N/A";
var initConstants_default = {
  IS_DEPLOYED,
  SERVICE,
  STAGE,
  ACCOUNT_ID,
  REGION
};

// ../../lib/ts/v1/utilities.ts
var LocalLogger = class {
  _formatMessages(messages) {
    return messages.map(
      (m) => typeof m === "object" ? JSON.stringify(m) : m
    ).join(" ");
  }
  debug(...messages) {
    console.log(`[DEBUG]:`, (/* @__PURE__ */ new Date()).toISOString(), `:`, this._formatMessages(messages));
  }
  info(...messages) {
    console.log(`[INFO]:`, (/* @__PURE__ */ new Date()).toISOString(), `:`, this._formatMessages(messages));
  }
  error(...messages) {
    console.error(`[ERROR]:`, (/* @__PURE__ */ new Date()).toISOString(), `:`, this._formatMessages(messages));
  }
  warn(...messages) {
    console.warn(`[WARNING]:`, (/* @__PURE__ */ new Date()).toISOString(), `:`, this._formatMessages(messages));
  }
  addContext() {
  }
};
var logger = initConstants_default.IS_DEPLOYED ? new Logger({
  persistentLogAttributes: {
    aws_account_id: initConstants_default.ACCOUNT_ID,
    aws_region: initConstants_default.REGION
  }
}) : new LocalLogger();
var metrics = new Metrics({
  defaultDimensions: {
    aws_account_id: initConstants_default.ACCOUNT_ID,
    aws_region: initConstants_default.REGION
  }
});

// functions/v1/handlerAsyncInsert.ts
var insertHydratedEvents = async (event) => {
  logger.info(`Logging only in insertEvents, event: ${JSON.stringify(event)}.`);
};
var insertHydratedEventsDlq = async (event) => {
  logger.info(`Logging only in insertEventsDlq, event: ${JSON.stringify(event)}.`);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  insertHydratedEvents,
  insertHydratedEventsDlq
});
