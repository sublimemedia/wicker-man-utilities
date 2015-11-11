(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'bluebird'], factory);
  } else if (typeof exports !== 'undefined') {
    factory(exports, require('bluebird'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.Promise);
    global.wmutilities = mod.exports;
  }
})(this, function (exports, _bluebird) {
  'use strict';

  Object.defineProperty(exports, '__esModule', {
    value: true
  });

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  var _Promise = _interopRequireDefault(_bluebird);

  // Regex
  function regexCaptures(string, regex, index) {
    var matches = [],
        match = undefined;

    index = index || 1;

    while (match = regex.exec(string)) {
      matches.push(match[index]);
    }

    return matches;
  }

  // Counter
  var Counter = function Counter() {
    // TODO: Replace with generator
    var id = 1;

    function count() {
      return id++;
    }

    return count;
  };

  function objToArray(obj) {
    return Array.prototype.slice.call(obj, 0);
  }

  function currentPathVal(current, startingObj, existingPath) {
    return current || (existingPath.parent && existingPath.key ? existingPath.parent[existingPath.key] : startingObj);
  }

  function createPath(path, startingObj, moreInfo) {
    var existingPath = getFromPath(path, startingObj, true);

    startingObj = startingObj && typeof startingObj === 'object' ? startingObj : window;

    if (existingPath && (existingPath.value && typeof existingPath.value === 'object') || typeof existingPath.value === 'undefined') {
      var _ret = (function () {
        var current = undefined;
        var result = extend({}, existingPath);

        existingPath.argsRemaining.forEach(function (name) {
          var currentVal = currentPathVal(current, startingObj, existingPath);

          if (typeof currentVal !== 'object') {
            currentVal = existingPath.parent[existingPath.key] = {};
          }

          result.parent = current = currentVal;
          current = current[name] = {};
          result.key = name;
        });

        result.value = currentPathVal(current, startingObj, existingPath);

        return {
          v: moreInfo ? result : result.value
        };
      })();

      if (typeof _ret === 'object') return _ret.v;
    } else if (moreInfo) {
      return existingPath;
    }
  }

  function getFromPath(path, startingObj, moreInfo, callback) {
    startingObj = startingObj && typeof startingObj === 'object' ? startingObj : window;

    if (typeof path === 'string') {
      var _ret2 = (function () {
        var pathArgs = path.split('.'),
            pathArgsRemaining = extend([], pathArgs),
            pathInfo = {
          parent: undefined,
          key: undefined,
          value: startingObj,
          argsRemaining: pathArgsRemaining
        };

        pathArgs.some(function (frag) {
          if (frag) {
            if (Object.prototype.hasOwnProperty.call(pathInfo.value, frag)) {
              pathArgsRemaining.splice(0, 1);

              pathInfo.key = frag;
              pathInfo.parent = pathInfo.value;
              pathInfo.value = pathInfo.value[frag];

              if (typeof callback === 'function') {
                callback(pathInfo);
              }
            } else {
              pathInfo.value = undefined;
              return true;
            }
          }
        });

        return {
          v: moreInfo ? pathInfo : pathInfo.value
        };
      })();

      if (typeof _ret2 === 'object') return _ret2.v;
    }
  }

  // TODO: Refactor to use getFromPath
  function getFromPromisePath(path, startingObj) {
    var resolver = new WMBee();
    var rejector = new WMBee();
    var status = new _Promise['default'](function (resolve, reject) {
      resolver.onValue(resolve);
      rejector.onValue(reject);
    });

    startingObj = typeof startingObj === 'object' ? startingObj : window;

    if (typeof path === 'string') {
      var pathArgs = path.split('.'),
          pathArgsRemaining = extend([], pathArgs),
          fullPath = startingObj;

      pathArgs.some(function (frag, index) {
        pathArgsRemaining.splice(0, 1);

        if (Object.prototype.hasOwnProperty.call(fullPath, frag)) {
          fullPath = fullPath[frag];
        } else {
          fullPath = undefined;
          return true;
        }

        if (isPromise(fullPath)) {
          return true;
        }
      });

      if (isPromise(fullPath) && pathArgsRemaining.length) {
        // reconfig with .then? fullPath is a promise?
        fullPath.then(function (data) {

          getFromPromisePath(pathArgsRemaining.join('.'), data).then(function (resolved) {
            resolver.set(resolved);
          })['catch'](function (err) {
            rejector.set(err);
          });
        })['catch'](function (err) {
          // potential problem, setting with empty string?
          rejector.set(err);
        });
      } else {
        resolver.set(fullPath); // resolve with path
      }
    } else {
        rejector.set(' ');
      }

    return status;
  }

  function isFunction(item) {
    return typeof item === 'function';
  }

  function isPromise(item) {
    return typeof item === 'object' && isFunction(item.then);
  }

  function objFirst(_x) {
    var _again = true;

    _function: while (_again) {
      var arr = _x;
      _again = false;
      if (typeof arr[0] === 'object') {
        return arr;
      } else {
        _x = arr.shift();
        _again = true;
        continue _function;
      }
    }
  }

  function extend(arg) {
    var _arguments2 = arguments;

    if (arg || typeof arg === 'boolean') {
      var _ret3 = (function () {
        var deep = typeof arg === 'boolean' && arg,
            objs = objFirst([].slice.call(_arguments2, deep ? 1 : 0));

        return {
          v: objs.reduce(function (prevV, curV) {
            if (typeof curV === 'object' && curV) {
              Object.keys(curV).forEach(function (key) {
                var val = curV[key];

                prevV[key] = deep && typeof val === 'object' ? extend(true, prevV[key] instanceof Array ? [] : {}, prevV[key], val) : val;
              });
            }

            return prevV;
          })
        };
      })();

      if (typeof _ret3 === 'object') return _ret3.v;
    } else {
      // TODO: Warn of no/bad input
    }
  }

  exports.Counter = Counter;
  exports.objToArray = objToArray;
  exports.isPromise = isPromise;
  exports.getFromPath = getFromPath;
  exports.getFromPromisePath = getFromPromisePath;
  exports.regexCaptures = regexCaptures;
  exports.createPath = createPath;
  exports.isFunction = isFunction;
  exports.extend = extend;
});