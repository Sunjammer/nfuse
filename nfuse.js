#! /usr/bin/env node
'use strict'
const FUSEPATH = 'fuse'

const Process = require('process')
const Path = require('path')
const ChildProcess = require('child_process')
const ProjectTools = require('./unoproj-tools')
const Utils = require('./Utils')
const resolve = require('./resolve')
const createUnoFile = require('./createUnoFile')


const cwd = Path.normalize(Process.cwd())
console.log('Running from '+cwd)
const mainProjectPath = ProjectTools.getProjectPathFromDir(cwd) 
const mainProject = ProjectTools.loadProjectFromPath(mainProjectPath)
const mainProjectName = ProjectTools.getNameFromProjectDir(cwd)

const npmPackageDir = cwd+Path.sep+'NPM-Packages'
const moduleProjPath = Path.join(npmPackageDir, mainProjectName + '_modules.unoproj')
const moduleProject = ProjectTools.createModuleProject()

const rootPackage = Utils.loadJsonFromDir({directory:cwd, filename:'package.json'})

let includes = []
for(let moduleName in rootPackage.dependencies)
{
  let files = resolve({baseDir:cwd, moduleName:moduleName})
  files = files.map(p => Path.relative(cwd, p))
  if(files.length==0) throw `Couldn't resolve dependency "${moduleName}", make sure to run "npm install"`
  includes = includes.concat(files.map(f => Path.relative(npmPackageDir, f)))
  let filePath = createUnoFile({
    name : moduleName, 
    mainPath : Path.relative(npmPackageDir, files[0]),
    projectname : mainProjectName + '_modules',
    outDir : npmPackageDir
  })
  includes.push(Path.relative(npmPackageDir, filePath))
}

ProjectTools.addIncludes({project:moduleProject, includesArray:includes})
ProjectTools.saveProjectToFile({project:moduleProject, path:moduleProjPath})
ProjectTools.addProjects({project:mainProject, projectsArray:[Path.relative(cwd, moduleProjPath)]})
ProjectTools.saveProjectToFile({project:mainProject, path:mainProjectPath})

let args = Process.argv.slice(2)
if(args.length>0)
{
  const first = args.shift()
  const fuseArgs = [first].concat(args)
  const fuse = ChildProcess.spawn(FUSEPATH, fuseArgs)

  fuse.stdout.on('data', data => 
    Process.stdout.write(data)
  )

  fuse.stderr.on('data', data => 
    Process.stdout.write(data)
  )

  fuse.on('close', code => 
    console.log(`Fuse exited with code ${code}`)
  )
}
