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
const ignore = require('fstream-ignore')


const cwd = Path.normalize(Process.cwd())
const mainProjectPath = ProjectTools.getProjectPathFromDir(cwd) 
const mainProject = ProjectTools.loadProjectFromPath(mainProjectPath)
const mainProjectName = ProjectTools.getNameFromProjectDir(cwd)

const npmPackageDir = cwd+Path.sep+'NPM-Packages'
const moduleProjPath = Path.join(npmPackageDir, mainProjectName + '_modules.unoproj')
const moduleProject = ProjectTools.createModuleProject()

const rootPackage = Utils.loadJsonFromDir({directory:cwd, filename:'package.json'})

let includes = []
let packageDirs = []
for(let moduleName in rootPackage.dependencies) {
  let {files, dirs} = resolve({baseDir:cwd, moduleName:moduleName})
  packageDirs = packageDirs.concat(dirs)
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

function step() {
  if(packageDirs.length>0)
    collate(packageDirs.shift(), includes)
  else
    finish()
}

function collate(dir, out) {
  ignore({ path: dir, ignoreFiles: [".npmignore", ".gitignore"] })
    .on("child", c => {
      if(Path.extname(c.path) != ".js") return
      let relativePath = Path.relative(npmPackageDir, c.path)
      if(out.indexOf(relativePath) == -1) out.push(relativePath)
    }) 
    .on('end', step)
}

function finish()
{
  
  ProjectTools.addIncludes({project:moduleProject, includesArray:includes})
  ProjectTools.saveProjectToFile({project:moduleProject, path:moduleProjPath})
  ProjectTools.addProjects({project:mainProject, projectsArray:[Path.relative(cwd, moduleProjPath)]})
  ProjectTools.saveProjectToFile({project:mainProject, path:mainProjectPath})

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

step()
