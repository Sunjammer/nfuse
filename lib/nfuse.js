#! /usr/bin/env node

'use strict';

var Process = require('process');
var Path = require('path');
var FS = require('fs');
var ProjectTools = require('./unoproj');
var Utils = require('./utils');

var _require = require('./resolve'),
    resolve = _require.resolve;

var _require2 = require('./resolve'),
    getSubDependencies = _require2.getSubDependencies;

var createUnoFile = require('./create-uno');
var ignore = require('fstream-ignore');
var _ = require('lodash');
var cliArgs = require('./cli')();

var cwd = Path.normalize(Process.cwd());

var rootPackage = Utils.loadJsonFromDir({ directory: cwd, filename: 'package.json' });
if (rootPackage == null) {
  console.error('nfuse: No package.json found in ' + cwd);
  Process.exit(1);
}

var mainProjectPath = ProjectTools.getProjectPathFromDir(cwd);
var mainProject = ProjectTools.loadProjectFromPath(mainProjectPath);
var mainProjectName = ProjectTools.getNameFromProjectDir(cwd);

var moduleProjectDir = cwd + Path.sep + 'NPM-Packages';
var depCachePath = moduleProjectDir + Path.sep + 'dependencies.json';
var moduleProjectPath = Path.join(moduleProjectDir, mainProjectName + '_modules.unoproj');
var previousDeps = Utils.fileExists(depCachePath) ? Utils.loadJson(depCachePath).dependencies : [];
var moduleProject = ProjectTools.createModuleProject();

var includes = [];
var packageDirs = [];

var currentDeps = [];
var newDeps = [];
for (var moduleName in rootPackage.dependencies) {
  currentDeps.push(moduleName + ':' + rootPackage.dependencies[moduleName]);
}previousDeps.sort();
currentDeps.sort();

if (cliArgs.include.length == 0 && !cliArgs.force && _.isEqual(previousDeps.sort(), currentDeps.sort())) {
  console.warn('nfuse: No changes required');
  Process.exit(0);
} else {
  Utils.getFilesInDir({ baseDir: moduleProjectDir }).filter(function (f) {
    return Path.extname(f) == '.uno';
  }).forEach(function (f) {
    return FS.unlinkSync(f);
  });
  buildModuleProject();
}

function buildModuleProject() {
  try {
    var modulesToResolve = [];

    for (var _moduleName in rootPackage.dependencies) {
      modulesToResolve.push(_moduleName);
      if (cliArgs.experimental) modulesToResolve = modulesToResolve.concat(getSubDependencies({ baseDir: cwd, moduleName: _moduleName }));
    }

    modulesToResolve.map(function (moduleName) {
      var _resolve = resolve({ baseDir: cwd, moduleName: moduleName, preferBrowser: _.flatten(cliArgs.browser) }),
          files = _resolve.files,
          dirs = _resolve.dirs;

      packageDirs = packageDirs.concat(dirs);
      files = files.map(function (p) {
        return Path.relative(cwd, p);
      });
      if (files.length == 0) {
        console.error('nfuse: Couldn\'t resolve dependency \'' + moduleName + '\', make sure to run \'npm install\'');
        Process.exit(1);
      }
      console.log('nfuse: Including module \'' + moduleName + '\' as \'' + files[0] + '\'');
      includes = includes.concat(files.map(function (f) {
        return Path.relative(moduleProjectDir, f);
      }));
      newDeps.push(moduleName + ':' + rootPackage.dependencies[moduleName]);

      return {
        name: moduleName,
        mainPath: Path.relative(moduleProjectDir, files[0]),
        projectname: mainProjectName + '_modules',
        outDir: moduleProjectDir
      };
    }).forEach(function (m) {
      includes.push(Path.relative(m.outDir, createUnoFile(m)));
    });

    _.flatten(cliArgs.include).forEach(function (includePath) {
      console.log('nfuse: Including module from source at \'' + includePath + '\'');
      if (!FS.existsSync(includePath)) throw includePath + ' does not exist';
      var filePath = createUnoFile({
        name: Path.basename(includePath, '.js'),
        mainPath: Path.relative(moduleProjectDir, includePath),
        projectname: mainProjectName + '_modules',
        outDir: moduleProjectDir
      });
      includes.push(Path.relative(moduleProjectDir, includePath));
      includes.push(Path.relative(moduleProjectDir, filePath));
    });
  } catch (e) {
    console.error(e);
    console.log('nfuse: Failed');
    Process.exit(1);
  }
  step();
}

function step() {
  if (packageDirs.length > 0) collate(packageDirs.shift(), includes);else finish();
}

function collate(dir, out) {
  ignore({ path: dir, ignoreFiles: ['.npmignore', '.gitignore'] }).on('child', function (c) {
    var ext = Path.extname(c.path);
    if (ext != '.js' && ext != '.unoproj') return;
    var relativePath = Path.relative(moduleProjectDir, c.path);
    if (out.indexOf(relativePath) == -1) out.push(relativePath);
  }).on('end', step);
}

function finish() {
  ProjectTools.addIncludes({ project: moduleProject, includesArray: includes });
  Utils.saveJson({ obj: moduleProject, path: moduleProjectPath });
  ProjectTools.addProjects({ project: mainProject, projectsArray: [Path.relative(cwd, moduleProjectPath)] });
  ProjectTools.addExcludes({ project: mainProject, excludesArray: ['node_modules', 'NPM-Packages'] });
  Utils.saveJson({ obj: mainProject, path: mainProjectPath });
  Utils.saveJson({ obj: { 'dependencies': newDeps }, path: depCachePath });
  console.log('nfuse: Completed successfully');
}