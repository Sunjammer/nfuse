
'use strict'
const FS = require('fs')
const Path = require('path')
const ArrayUtils = require('./utils').ArrayUtils
const ArgsObject = require('./utils').ArgsObject

module.exports.getProjectPathFromDir = function(dir) {
  return ArrayUtils(FS.readdirSync(dir)
    .filter(file => { return Path.extname(file) == '.unoproj' })
    ).firstOrDefault(null)
}

module.exports.loadProjectFromPath = function(Path) {
  return JSON.parse(FS.readFileSync(Path))
}

function addUniqueArrayValues(obj, arrayName, values) {
  if(!obj.hasOwnProperty(arrayName)) 
    obj[arrayName] = []
    
  values.map(i => i.split('\\').join('/'))
    .filter(i => obj[arrayName].indexOf(i) == -1)
    .forEach(i => obj[arrayName].push(i))
}

module.exports.addProjects = function(args) {
  args = ArgsObject({project:null, projectsArray:null}, args)
  addUniqueArrayValues(args.project, 'Projects', args.projectsArray)
  return args.project
}

module.exports.addIncludes = function(args) {
  args = ArgsObject({project:null, includesArray:null}, args)
  args.includesArray = args.includesArray.map(i => i + (Path.extname(i) == '.js' ? ':Bundle' : ''))
  addUniqueArrayValues(args.project, 'Includes', args.includesArray)
  return args.project
}

module.exports.getNameFromProjectDir = function(dir) {
  return dir.split(Path.sep).pop()
}

module.exports.saveProjectToFile = function(args) {
  args = ArgsObject({project:null, path:null},args)
  let str = JSON.stringify(args.project, null, 2) //defaulting to spaces here may not be popular everywhere?
  FS.writeFileSync(args.path, str)
}

module.exports.createModuleProject = function() {
  return {'Packages':['Fuse','Fuse.Scripting'], 'Includes':[] }
}
