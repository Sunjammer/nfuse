'use strict';

var FS = require('fs');
var Path = require('path');
var Utils = require('./utils');

function loadAsFile(root, filePath, outPaths) {
  if (!FS.existsSync(filePath)) {
    if (!FS.existsSync(filePath + '.js')) return false;
    filePath = filePath + '.js';
  }

  if (!FS.statSync(filePath).isFile()) return false;

  if (Utils.stringEndsWith(filePath, '.js')) {
    outPaths.push(filePath);
    return true;
  }

  if (Utils.stringEndsWith(filePath, '.node', '.json')) throw '.node and .json not supported';

  outPaths.push(filePath);
  return true;
}

function loadAsDir(root, f, outPaths, outDirs, preferBrowser) {
  if (!FS.existsSync(f)) return false;

  if (FS.statSync(f).isFile()) return false;

  var success = false;
  var packagePath = f + Path.sep + 'package.json';
  if (FS.existsSync(packagePath)) {
    outDirs.push(f);
    var pack = Utils.loadJson(packagePath);
    var mainPath = '';
    if (preferBrowser.indexOf(pack.name) > -1 && pack.browser !== undefined) {
      mainPath = f + Path.sep + pack.browser;
    } else if (pack.main !== undefined) {
      mainPath = f + Path.sep + pack.main;
    }

    if (!(success = loadAsFile(root, mainPath, outPaths))) success = loadAsFile(root, mainPath + '.js', outPaths);

    for (var d in pack.dependencies) {
      loadNodeModules(d, root, outPaths, outDirs, preferBrowser);
    }
  }

  success = success || loadAsFile(root, f + Path.sep + 'index.js', outPaths) || loadAsFile(root, f + Path.sep + 'index.json', outPaths) || loadAsFile(root, f + Path.sep + 'index.node', outPaths);

  if (!success) console.log('Couldn\'t resolve ' + f + ' as directory');

  return success;
}

function loadNodeModules(moduleName, startPath, outPaths, outDirs, preferBrowser) {
  var dirs = nodeModulesPaths(startPath);
  dirs.forEach(function (dir) {
    loadAsFile(startPath, dir + Path.sep + moduleName, outPaths);
    loadAsDir(startPath, dir + Path.sep + moduleName, outPaths, outDirs, preferBrowser);
  });
}

function nodeModulesPaths(startPath) {
  var node_modules = 'node_modules';
  var parts = startPath.split(Path.sep);
  var i = parts.length;
  var dirs = [];
  while (i >= 0) {
    if (parts[i] != node_modules) {
      var dir = [];
      for (var j = 0; j < i; j++) {
        dir.push(parts[j]);
      }dir = dir.join(Path.sep) + Path.sep + node_modules;
      dirs.push(dir);
    }
    i--;
  }
  return dirs;
}

function resolve(_ref) {
  var baseDir = _ref.baseDir,
      moduleName = _ref.moduleName,
      _ref$preferBrowser = _ref.preferBrowser,
      preferBrowser = _ref$preferBrowser === undefined ? [] : _ref$preferBrowser;

  var output = { files: [], dirs: [] };

  loadNodeModules(moduleName, baseDir, output.files, output.dirs, preferBrowser);
  return output;
}

function getSubDependencies(_ref2) {
  var baseDir = _ref2.baseDir,
      moduleName = _ref2.moduleName;

  var output = [];
  var dirs = nodeModulesPaths(baseDir);
  dirs.forEach(function (dir) {
    var f = dir + Path.sep + moduleName;
    if (!FS.existsSync(f)) return false;

    var packagePath = f + Path.sep + 'package.json';
    if (FS.existsSync(packagePath)) {
      var pack = Utils.loadJson(packagePath);
      for (var d in pack.dependencies) {
        output.push(d);
      }
    }
  });
  return output;
}

module.exports = {
  resolve: resolve,
  getSubDependencies: getSubDependencies
};