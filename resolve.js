'use strict'
const fs = require('fs')
const path = require('path')
const utils = require('./utils')

function loadAsFile(filePath, outPaths) {
  if(!fs.existsSync(filePath)) {
    if(!fs.existsSync(filePath+'.js'))
      return false
    filePath = filePath+'.js'
  }
  
  if(!fs.statSync(filePath).isFile()) 
    return false
  
  if(utils.stringEndsWith(filePath, '.js')) {
    outPaths.push(filePath)
    return true
  }
  /*
  3. If X.json is a file, parse X.json to a JavaScript Object.  STOP
  4. If X.node is a file, load X.node as binary addon.  STOP
  */
  if(utils.stringEndsWith(filePath, '.node', '.json'))
    throw '.node and .json not supported'
  
  // If it's a file without extension, we still allow it through :(
  outPaths.push(filePath)
  return true
}

function loadAsDir(f, outPaths){
  if(!fs.existsSync(f)) 
    return false
    
  if(fs.statSync(f).isFile()) 
    return false
  
  let success = false
  let packagePath = f + path.sep + 'package.json'
  if(fs.existsSync(packagePath)) {
    let pack = utils.loadJson(packagePath)
    if(pack.main !== undefined) {
      // I'm not sure I should return here, but how node would handle a main AND an index isn't documented
      let mainPath = f+path.sep+pack.main
      if(!(success = loadAsFile(mainPath, outPaths)))
        success = loadAsFile(mainPath+'.js', outPaths)
    }
  }
  
  success = success 
    || loadAsFile(f+path.sep+'index.js', outPaths) 
    || loadAsFile(f+path.sep+'index.json', outPaths) 
    || loadAsFile(f+path.sep+'index.node', outPaths)
    
  if(success) {  
    let entryPoint = path.normalize(outPaths[outPaths.length-1])
    // Get all the other files outside of node_modules and npmignore
    utils.getFilesInDir({baseDir:f, ignoreDirs:['node_modules']})
      .filter(f => f != entryPoint && path.extname(f) == '.js')
      .forEach(f => outPaths.push(f))
  }
    
  if(!success)
    console.log(`Couldn't resolve ${f} as directory`)
    
  return success
}

function loadNodeModules(moduleName, startPath, outPaths) {
  let dirs = nodeModulesPaths(startPath)
  dirs.forEach( dir => {
    loadAsFile(dir+path.sep+moduleName, outPaths)
    loadAsDir(dir+path.sep+moduleName, outPaths)
  })
}

function nodeModulesPaths(startPath) {
  let node_modules = 'node_modules'
  let parts = startPath.split(path.sep)
  var i = parts.length
  let dirs = []
  while(i >= 0) {
    if(parts[i] != node_modules) {
      let dir = []
      for(let j = 0; j < i; j++)
        dir.push(parts[j])
      dir = dir.join(path.sep)+path.sep+node_modules
      dirs.push(dir)
    }
    i--
  }
  return dirs
}

module.exports = function({baseDir, moduleName}) {
  let outPaths = []
  
  /*1. If X is a core module,
     a. return the core module
     b. STOP*/ // Super Polyfill Bros 2
  loadNodeModules(moduleName, baseDir, outPaths)
  return outPaths
}
