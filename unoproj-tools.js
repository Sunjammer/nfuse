
'use strict'
const FS = require('fs')
const Path = require('path')
const {ArrayUtils} = require('./utils')

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

module.exports.addProjects = function({project, projectsArray}) {
  addUniqueArrayValues(project, 'Projects', projectsArray)
  return project
}

module.exports.addIncludes = function({project, includesArray}) {
  includesArray = includesArray.map(i => i + (Path.extname(i) == '.js' ? ':Bundle' : ''))
  addUniqueArrayValues(project, 'Includes', includesArray)
  return project
}

module.exports.getNameFromProjectDir = function(dir) {
  return dir.split(Path.sep).pop()
}

module.exports.saveProjectToFile = function({project, path}) {
  let str = JSON.stringify(project, null, 2) //defaulting to spaces here may not be popular everywhere?
  FS.writeFileSync(path, str)
}

module.exports.createModuleProject = function() {
  return {'Packages':['Fuse','Fuse.Scripting'], 'Includes':[] }
}
