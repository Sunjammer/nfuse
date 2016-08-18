'use strict'
const FS = require('fs')
const Path = require('path')

function directoryExists(p) {
  try {
    return FS.statSync(p).isDirectory()
  }
  catch (err) {
    return false
  }
}

const fileExists = exports.fileExists = function(filePath) {
  try {
    return FS.statSync(filePath)
  }
  catch (err) {
    return false
  }
}

const ensurePathValid = exports.ensurePathValid = function(filePath) {
  var dirname = Path.dirname(filePath)
  if (directoryExists(dirname)) {
    return true
  }
  ensurePathValid(dirname)
  FS.mkdirSync(dirname)
}

const getFilesInDir = exports.getFilesInDir = function({baseDir, ignoreDirs=[]}) {
  let out = []
  if(!directoryExists(baseDir)) return out
  FS.readdirSync(baseDir).forEach(f => {
    f = baseDir+Path.sep+f
    let stat = FS.statSync(f)
    if(stat.isDirectory()) {
      if(ignoreDirs.indexOf(Path.basename(f) == -1 ))
        getFilesInDir({baseDir:f, ignoreDirs:ignoreDirs}).forEach(p => out.push(p))
    }
    out.push(f)
  })
  return out
}

module.exports.loadJson = function(path) {
  return JSON.parse(FS.readFileSync(path))
}

module.exports.saveJson = function({obj, path}) {
  let str = JSON.stringify(obj, null, 2) 
  FS.writeFileSync(path, str)
}

module.exports.moduleExists = function(name) {
  try { require.resolve(name) }
  catch(e) { return false }
  return true
}

module.exports.loadJsonFromDir = function({directory, filename}) {
  return ArrayUtils(FS.readdirSync(directory)
    .filter(file => { return Path.basename(file) == filename })
    .map(file => { return JSON.parse(FS.readFileSync(Path.join(directory, file))) })
    ).firstOrDefault(null)
}

module.exports.stringEndsWith = function() {
  const first = arguments[0]
  var args = []
  for(var i = 1; i<arguments.length; i++)
    args.push(arguments[i])
    
  if(args.length>1)
    return args.filter(i => first.indexOf(i) == first.length - i.length).length != 0
  
  const second = arguments[0]
  return first.indexOf(second) == first.length - second.length
}

const ArrayUtils = exports.ArrayUtils = function(array) {
  array.firstOrDefault = function(def)
  {
    if(array.length > 0)
      return array[0]
    else
      return def
  }

  array.flatMap = function(func) {
    return array.concat.apply([], array.map(func))
  }

  return array
}
