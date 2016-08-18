'use strict'
const FS = require('fs')
const Path = require('path')
const Utils = require('./utils')

function loadAsFile(filePath, outPaths) {
  if(!FS.existsSync(filePath)) {
    if(!FS.existsSync(filePath+'.js'))
      return false
    filePath = filePath+'.js'
  }
  
  if(!FS.statSync(filePath).isFile()) 
    return false
  
  if(Utils.stringEndsWith(filePath, '.js')) {
    outPaths.push(filePath)
    return true
  }
  /*
  3. If X.json is a file, parse X.json to a JavaScript Object.  STOP
  4. If X.node is a file, load X.node as binary addon.  STOP
  */
  if(Utils.stringEndsWith(filePath, '.node', '.json'))
    throw '.node and .json not supported'
  
  // If it's a file without extension, we still allow it through :(
  outPaths.push(filePath)
  return true
}

function loadAsDir(f, outPaths, outDirs){
  if(!FS.existsSync(f)) 
    return false
    
  if(FS.statSync(f).isFile()) 
    return false
  
  let success = false
  let packagePath = f + Path.sep + 'package.json'
  if(FS.existsSync(packagePath)) {
    outDirs.push(f)
    let pack = Utils.loadJson(packagePath)
    if(pack.main !== undefined) {
      // I'm not sure I should return here, but how node would handle a main AND an index isn't documented
      let mainPath = f+Path.sep+pack.main
      if(!(success = loadAsFile(mainPath, outPaths)))
        success = loadAsFile(mainPath+'.js', outPaths)
    }
  }
  
  success = success 
    || loadAsFile(f+Path.sep+'index.js', outPaths) 
    || loadAsFile(f+Path.sep+'index.json', outPaths) 
    || loadAsFile(f+Path.sep+'index.node', outPaths)
    
  if(!success)
    console.log(`Couldn't resolve ${f} as directory`)
    
  return success
}

function loadNodeModules(moduleName, startPath, outPaths, outDirs) {
  let dirs = nodeModulesPaths(startPath)
  dirs.forEach( dir => {
    loadAsFile(dir + Path.sep + moduleName, outPaths)
    loadAsDir(dir + Path.sep + moduleName, outPaths, outDirs)
  })
}

function nodeModulesPaths(startPath) {
  let node_modules = 'node_modules'
  let parts = startPath.split(Path.sep)
  var i = parts.length
  let dirs = []
  while(i >= 0) {
    if(parts[i] != node_modules) {
      let dir = []
      for(let j = 0; j < i; j++)
        dir.push(parts[j])
      dir = dir.join(Path.sep) + Path.sep + node_modules
      dirs.push(dir)
    }
    i--
  }
  return dirs
}

module.exports = function({baseDir, moduleName}) {
  let output = {files:[], dirs:[]}
  
  /*1. If X is a core module,
     a. return the core module
     b. STOP*/ // Super Polyfill Bros 2
  loadNodeModules(moduleName, baseDir, output.files, output.dirs)
  return output
}
