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

const ensurePathValid = exports.ensurePathValid = function(filePath) {
  var dirname = Path.dirname(filePath)
  if (directoryExists(dirname)) {
    return true
  }
  ensurePathValid(dirname)
  FS.mkdirSync(dirname)
}

const getFilesInDir = exports.getFilesInDir = function(args) {
  args = ArgsObject({baseDir:null, ignoreDirs:[]},args)
  let out = []
  if(!directoryExists(args.baseDir)) return out
  FS.readdirSync(args.baseDir).forEach(f => {
    f = args.baseDir+Path.sep+f
    let stat = FS.statSync(f)
    if(stat.isDirectory()) {
      if(args.ignoreDirs.indexOf(Path.basename(f) == -1 ))
        getFilesInDir({baseDir:f, ignoreDirs:args.ignoreDirs}).forEach(p => out.push(p))
    }
    out.push(f)
  })
  return out
}

module.exports.stringBeginsWith = function() {
  const first = arguments[0]
  var args = []
  for(var i = 1; i<arguments.length; i++)
    args.push(arguments[i])
    
  if(args.length>1)
    return args.filter(i => first.indexOf(i) == 0).length != 0
    
  return first.indexOf(arguments[0]) == 0
}

module.exports.loadJson = function(path) {
  return JSON.parse(FS.readFileSync(path))
}

module.exports.moduleExists = function(name) {
  try { require.resolve(name) }
  catch(e) { return false }
  return true
}

module.exports.loadJsonFromDir = function(args) {
  args = ArgsObject({directory:null, filename:null}, args)
  return ArrayUtils(FS.readdirSync(args.directory)
		.filter(file => { return Path.basename(file) == args.filename })
		.map(file => { return JSON.parse(FS.readFileSync(Path.join(args.directory, file))) })
    ).firstOrDefault(null)
}

const ArgsObject = module.exports.ArgsObject = function(defaults, input) {
  let args = {}
  for(let k in defaults) {
    if(defaults[k] === null)
      if(!input.hasOwnProperty(k))
        throw `Missing argument "${k}" is required`
    args[k] = input.hasOwnProperty(k) ? input[k] : defaults[k]
  }
  return args
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
