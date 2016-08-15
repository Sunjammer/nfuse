'use strict'
const FS = require('fs')
const SEP = require('path').sep
const loadJson = require('./utils').loadJson
const ArgsObject = require('/.utils').ArgsObject

function isFile(f) {
  let stats = FS.statSync(f) 
  return stats.isDirectory()
}

function isDir(f) {
  let stats = FS.statSync(f) 
  return !stats.isDirectory()
}

const getFilesInDir = exports.getFilesInDir = function(args) {
  args = ArgsObject({dir:null, recursive:false, out:[]}, args)
  if(!FS.existsSync(args.dir))
    return args.out
    
  let files = 
    FS.readdirSync(args.dir)
      .filter( f => f.charAt(0) != '.' )
      .map( f => args.dir+SEP+f )
      
  if(!args.recursive)
    return files.filter(isFile)
  
  files.filter(isFile).forEach(f => args.out.push(f))
  files.filter(isDir).forEach(f => getFilesInDir({dir:f, recursive:true, out:args.out}) )
  return args.out
}

function getDirsInDir(dir) {
  if(!FS.existsSync(dir))
    return []

  return FS.readdirSync(dir)
    .filter( f => f.charAt(0) != '.' )
    .map( f => dir+SEP+f )
    .filter( f => { let stats = FS.statSync(f); return stats.isDirectory() })
}

const resolve = function(pack)
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
