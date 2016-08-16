'use strict'
const FS = require('fs')
const SEP = require('path').sep
const {loadJson} = require('./utils')

function isFile(f) {
  let stats = FS.statSync(f) 
  return stats.isDirectory()
}

function isDir(f) {
  let stats = FS.statSync(f) 
  return !stats.isDirectory()
}

const getFilesInDir = exports.getFilesInDir = function({dir, recursive=false, out=[]}) {
  if(!FS.existsSync(dir))
    return out
    
  let files = 
    FS.readdirSync(dir)
      .filter( f => f.charAt(0) != '.' )
      .map( f => dir+SEP+f )
      
  if(!recursive)
    return files.filter(isFile)
  
  files.filter(isFile).forEach(f => out.push(f))
  files.filter(isDir).forEach(f => getFilesInDir({dir:f, recursive:true, out:out}) )
  return out
}

function getDirsInDir(dir) {
  if(!FS.existsSync(dir))
    return []

  return FS.readdirSync(dir)
    .filter( f => f.charAt(0) != '.' )
    .map( f => dir+SEP+f )
    .filter( f => { let stats = FS.statSync(f); return stats.isDirectory() })
}

function resolve(pack)
{
  return pack.browser !== undefined
    ? pack.browser
    : pack.main !== undefined
      ? pack.main
      : null
}

const getDependencies = exports.getDependencies = function(moduleDir, out) {
  if(out===undefined) out = []
  let pack = loadJson(moduleDir)
  let mainPath = resolve(pack, moduleDir)

  if(mainPath!==null) {
    if(typeof mainPath === 'object')
      console.log(moduleDir+' -> '+mainPath)
      
    let f = mainPath.indexOf('.js') > -1
      ? mainPath
      : mainPath + '.js' //This is nonsense

    out.push(moduleDir+SEP+f)
  }

  getDirsInDir(moduleDir+SEP+'node_modules')
    .forEach(d => getDependencies(d, out))

  return out
}
