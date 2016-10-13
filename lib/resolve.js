'use strict';

var FS = require('fs');
var Path = require('path');
var Utils = require('./utils');

function loadAsFile(filePath, outPaths) {
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

function loadAsDir(f, outPaths, outDirs, preferBrowser) {
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
    if (!(success = loadAsFile(mainPath, outPaths))) success = loadAsFile(mainPath + '.js', outPaths);
  }

  success = success || loadAsFile(f + Path.sep + 'index.js', outPaths) || loadAsFile(f + Path.sep + 'index.json', outPaths) || loadAsFile(f + Path.sep + 'index.node', outPaths);

  if (!success) console.log('Couldn\'t resolve ' + f + ' as directory');

  return success;
}

function loadNodeModules(moduleName, startPath, outPaths, outDirs, preferBrowser) {
  var dirs = nodeModulesPaths(startPath);
  dirs.forEach(function (dir) {
    loadAsFile(dir + Path.sep + moduleName, outPaths);
    loadAsDir(dir + Path.sep + moduleName, outPaths, outDirs, preferBrowser);
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

module.exports = function (_ref) {
  var baseDir = _ref.baseDir;
  var moduleName = _ref.moduleName;
  var _ref$preferBrowser = _ref.preferBrowser;
  var preferBrowser = _ref$preferBrowser === undefined ? [] : _ref$preferBrowser;

  var output = { files: [], dirs: [] };

  loadNodeModules(moduleName, baseDir, output.files, output.dirs, preferBrowser);
  return output;
};