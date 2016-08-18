
'use strict';

var FS = require('fs');
var Path = require('path');

var _require = require('./utils');

var ArrayUtils = _require.ArrayUtils;


module.exports.getProjectPathFromDir = function (dir) {
  return ArrayUtils(FS.readdirSync(dir).filter(function (file) {
    return Path.extname(file) == '.unoproj';
  })).firstOrDefault(null);
};

module.exports.loadProjectFromPath = function (Path) {
  return JSON.parse(FS.readFileSync(Path));
};

function addUniqueArrayValues(obj, arrayName, values) {
  if (!obj.hasOwnProperty(arrayName)) obj[arrayName] = [];

  values.map(function (i) {
    return i.split('\\').join('/');
  }).filter(function (i) {
    return obj[arrayName].indexOf(i) == -1;
  }).forEach(function (i) {
    return obj[arrayName].push(i);
  });
}

module.exports.addProjects = function (_ref) {
  var project = _ref.project;
  var projectsArray = _ref.projectsArray;

  addUniqueArrayValues(project, 'Projects', projectsArray);
  return project;
};

module.exports.addIncludes = function (_ref2) {
  var project = _ref2.project;
  var includesArray = _ref2.includesArray;

  includesArray = includesArray.map(function (i) {
    return i + (Path.extname(i) == '.js' ? ':Bundle' : '');
  });
  addUniqueArrayValues(project, 'Includes', includesArray);
  return project;
};

module.exports.getNameFromProjectDir = function (dir) {
  return dir.split(Path.sep).pop();
};

module.exports.saveProjectToFile = function (_ref3) {
  var project = _ref3.project;
  var path = _ref3.path;

  var str = JSON.stringify(project, null, 2);
  FS.writeFileSync(path, str);
};

module.exports.createModuleProject = function () {
  return { 'Packages': ['FuseCore', 'Fuse.Scripting'], 'Includes': [] };
};