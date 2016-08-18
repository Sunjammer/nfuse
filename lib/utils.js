'use strict';

var FS = require('fs');
var Path = require('path');

function directoryExists(p) {
  try {
    return FS.statSync(p).isDirectory();
  } catch (err) {
    return false;
  }
}

var fileExists = exports.fileExists = function (filePath) {
  try {
    return FS.statSync(filePath);
  } catch (err) {
    return false;
  }
};

var ensurePathValid = exports.ensurePathValid = function (filePath) {
  var dirname = Path.dirname(filePath);
  if (directoryExists(dirname)) {
    return true;
  }
  ensurePathValid(dirname);
  FS.mkdirSync(dirname);
};

var getFilesInDir = exports.getFilesInDir = function (_ref) {
  var baseDir = _ref.baseDir;
  var _ref$ignoreDirs = _ref.ignoreDirs;
  var ignoreDirs = _ref$ignoreDirs === undefined ? [] : _ref$ignoreDirs;

  var out = [];
  if (!directoryExists(baseDir)) return out;
  FS.readdirSync(baseDir).forEach(function (f) {
    f = baseDir + Path.sep + f;
    var stat = FS.statSync(f);
    if (stat.isDirectory()) {
      if (ignoreDirs.indexOf(Path.basename(f) == -1)) getFilesInDir({ baseDir: f, ignoreDirs: ignoreDirs }).forEach(function (p) {
        return out.push(p);
      });
    }
    out.push(f);
  });
  return out;
};

module.exports.loadJson = function (path) {
  return JSON.parse(FS.readFileSync(path));
};

module.exports.saveJson = function (_ref2) {
  var obj = _ref2.obj;
  var path = _ref2.path;

  var str = JSON.stringify(obj, null, 2);
  FS.writeFileSync(path, str);
};

module.exports.moduleExists = function (name) {
  try {
    require.resolve(name);
  } catch (e) {
    return false;
  }
  return true;
};

module.exports.loadJsonFromDir = function (_ref3) {
  var directory = _ref3.directory;
  var filename = _ref3.filename;

  return ArrayUtils(FS.readdirSync(directory).filter(function (file) {
    return Path.basename(file) == filename;
  }).map(function (file) {
    return JSON.parse(FS.readFileSync(Path.join(directory, file)));
  })).firstOrDefault(null);
};

module.exports.stringEndsWith = function () {
  var first = arguments[0];
  var args = [];
  for (var i = 1; i < arguments.length; i++) {
    args.push(arguments[i]);
  }if (args.length > 1) return args.filter(function (i) {
    return first.indexOf(i) == first.length - i.length;
  }).length != 0;

  var second = arguments[0];
  return first.indexOf(second) == first.length - second.length;
};

var ArrayUtils = exports.ArrayUtils = function (array) {
  array.firstOrDefault = function (def) {
    if (array.length > 0) return array[0];else return def;
  };

  array.flatMap = function (func) {
    return array.concat.apply([], array.map(func));
  };

  return array;
};