'use strict';

import Promise from 'bluebird';

// Regex
function regexCaptures(string, regex, index) {
  let matches = [],
      match;

  index = index || 1;

  while (match = regex.exec(string)) {
      matches.push(match[index]);
  }

  return matches;
}

// Counter
var Counter = function () { // TODO: Replace with generator
  let id = 1;

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
  const existingPath = getFromPath(path, startingObj, true);

  startingObj = startingObj && typeof startingObj === 'object' ? startingObj: window;

  if (existingPath &&
    (existingPath.value && typeof existingPath.value === 'object') ||
    (typeof existingPath.value === 'undefined')) {
    let current;
    const result = extend({}, existingPath);

    existingPath.argsRemaining
    .forEach(function(name) {
        let currentVal = currentPathVal(current, startingObj, existingPath);

        if (typeof currentVal !== 'object') {
         currentVal = existingPath.parent[existingPath.key] = {};
        }

        result.parent = current = currentVal;
        current = current[name] = {};
        result.key = name;
    });

    result.value = currentPathVal(current, startingObj, existingPath);

    return moreInfo ? result : result.value;
  } else if (moreInfo) {
    return existingPath;
  }
}

function getFromPath(path, startingObj, moreInfo, callback) {
  startingObj = startingObj && typeof startingObj === 'object' ? startingObj: window;

  if (typeof path === 'string') {
    const pathArgs = path.split('.'),
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

    return moreInfo ? pathInfo : pathInfo.value;
  }
}

// TODO: Refactor to use getFromPath
function getFromPromisePath(path, startingObj) {
  var resolver = new WMBee();
  var rejector = new WMBee();
  var status = new Promise(function(resolve, reject){
      resolver.onValue(resolve);
      rejector.onValue(reject);
  });

  startingObj = typeof startingObj === 'object' ? startingObj: window;

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
          fullPath
          .then(function (data) {

              getFromPromisePath(pathArgsRemaining.join('.'), data)

              .then(function (resolved) {
                  resolver.set(resolved); 
              })

              .catch(function (err) {
                  rejector.set(err); 
              });
          })

          .catch(function (err) {
              // potential problem, setting with empty string?
              rejector.set(err);
          });

      } else {
          resolver.set(fullPath); // resolve with path 
      }
  } else {
      rejector.set(' ')
  }

  return status;
}

function isFunction(item) {
  return typeof item === 'function';
}

function isPromise(item) {
  return typeof item === 'object' && isFunction(item.then);
}

function objFirst(arr) {
  return typeof arr[0] === 'object' ? arr : objFirst(arr.shift());
}

function extend(arg) {
  if (arg || typeof arg === 'boolean') {
    const deep = typeof arg === 'boolean' && arg,
      objs = objFirst([].slice.call(arguments, (deep ? 1 : 0)));

    return objs
    .reduce((prevV, curV) => {
      if (typeof curV === 'object' && curV) {
        Object.keys(curV)
        .forEach(key => {
          const val = curV[key];

          prevV[key] = deep && typeof val === 'object' ? extend(true, {}, val) : val;
        });
      }

      return prevV;
    });
  } else {
    // TODO: Warn of no/bad input
  }
}

export {
    Counter,
    objToArray,
    isPromise,
    getFromPath,
    getFromPromisePath,
    regexCaptures,
    createPath,
    isFunction,
    extend
};