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
const mainProjectPath = ProjectTools.getProjectPathFromDir(cwd) 
const mainProject = ProjectTools.loadProjectFromPath(mainProjectPath)
const mainProjectName = ProjectTools.getNameFromProjectDir(cwd)

const moduleProjectDir = cwd + Path.sep + 'NPM-Packages'
const moduleProjectPath = Path.join(moduleProjectDir, mainProjectName + '_modules.unoproj')
let previousDeps = Utils.fileExists(moduleProjectPath) ? ProjectTools.loadProjectFromPath(moduleProjectPath).NPMPackages : []
const moduleProject = ProjectTools.createModuleProject()

const rootPackage = Utils.loadJsonFromDir({directory:cwd, filename:'package.json'})

let includes = []
let packageDirs = []

let currentDeps = []
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
  moduleProject.NPMPackages = []
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
    moduleProject.NPMPackages.push(moduleName+':'+rootPackage.dependencies[moduleName])
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
  ProjectTools.saveProjectToFile({project:moduleProject, path:moduleProjectPath})
  ProjectTools.addProjects({project:mainProject, projectsArray:[Path.relative(cwd, moduleProjectPath)]})
  ProjectTools.saveProjectToFile({project:mainProject, path:mainProjectPath})
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
