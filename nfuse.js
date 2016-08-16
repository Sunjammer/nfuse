#! /usr/bin/env node
'use strict'
const FUSEPATH = 'fuse'
const Process = require('process')
const Path = require('path')
const FS = require('fs')
const ChildProcess = require('child_process')
const ProjectTools = require('./unoproj-tools')
const Utils = require('./Utils')
const resolve = require('./resolve')
const createUnoFile = require('./createUnoFile')
const ignore = require('fstream-ignore')
const _ = require('lodash')

const cwd = Path.normalize(Process.cwd())

const rootPackage = Utils.loadJsonFromDir({directory:cwd, filename:'package.json'})

if(rootPackage==null)
  throw 'nfuse requires a package.json to resolve dependencies'

const mainProjectPath = ProjectTools.getProjectPathFromDir(cwd) 
const mainProject = ProjectTools.loadProjectFromPath(mainProjectPath)
const mainProjectName = ProjectTools.getNameFromProjectDir(cwd)

const moduleProjectDir = cwd + Path.sep + 'NPM-Packages'
const depCachePath = moduleProjectDir + Path.sep + 'dependencies.json'
const moduleProjectPath = Path.join(moduleProjectDir, mainProjectName + '_modules.unoproj')
let previousDeps = Utils.fileExists(depCachePath) ? Utils.loadJson(depCachePath).dependencies : []
const moduleProject = ProjectTools.createModuleProject()


let includes = []
let packageDirs = []

let currentDeps = []
let newDeps = []
for(let moduleName in rootPackage.dependencies)
  currentDeps.push(moduleName+':'+rootPackage.dependencies[moduleName])
  
previousDeps.sort()
currentDeps.sort()
  
if(_.isEqual(previousDeps.sort(), currentDeps.sort())) {
  runFuse()
} else {
  Utils.getFilesInDir({baseDir:moduleProjectDir})
    .forEach(f => FS.unlinkSync(f) )
  buildModuleProject()
}

function buildModuleProject()
{
  for(let moduleName in rootPackage.dependencies) {
    let {files, dirs} = resolve({baseDir:cwd, moduleName:moduleName})
    packageDirs = packageDirs.concat(dirs)
    files = files.map(p => Path.relative(cwd, p))
    if(files.length==0) throw `Couldn't resolve dependency '${moduleName}', make sure to run 'npm install'`
    includes = includes.concat(files.map(f => Path.relative(moduleProjectDir, f)))
    let filePath = createUnoFile({
      name : moduleName, 
      mainPath : Path.relative(moduleProjectDir, files[0]),
      projectname : mainProjectName + '_modules',
      outDir : moduleProjectDir
    })
    newDeps.push(moduleName+':'+rootPackage.dependencies[moduleName])
    includes.push(Path.relative(moduleProjectDir, filePath))
  }
  step()
}

function step() {
  if(packageDirs.length>0)
    collate(packageDirs.shift(), includes)
  else
    finish()
}

function collate(dir, out) {
  ignore({ path: dir, ignoreFiles: ['.npmignore', '.gitignore'] })
    .on('child', c => {
      if(Path.extname(c.path) != '.js') return
      let relativePath = Path.relative(moduleProjectDir, c.path)
      if(out.indexOf(relativePath) == -1) out.push(relativePath)
    }) 
    .on('end', step)
}

function finish()
{
  ProjectTools.addIncludes({project:moduleProject, includesArray:includes})
  Utils.saveJson({obj:moduleProject, path:moduleProjectPath})
  ProjectTools.addProjects({project:mainProject, projectsArray:[Path.relative(cwd, moduleProjectPath)]})
  Utils.saveJson({obj:mainProject, path:mainProjectPath})
  Utils.saveJson({obj:{'dependencies':newDeps}, path:depCachePath})
  runFuse()
}

function runFuse()
{
  let args = Process.argv.slice(2)
  if(args.length>0) {
    const first = args.shift()
    const fuseArgs = [first].concat(args)
    const fuse = ChildProcess.spawn(FUSEPATH, fuseArgs)
    
    const write = data => Process.stdout.write(data)

    fuse.stdout.on('data', write)
    fuse.stderr.on('data', write)

    fuse.on('close', code => 
      console.log(`Fuse exited with code ${code}`)
    )
  }
}
