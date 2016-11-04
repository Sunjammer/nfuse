#! /usr/bin/env node
'use strict'
const Process = require('process')
const Path = require('path')
const FS = require('fs')
const ProjectTools = require('./unoproj')
const Utils = require('./utils')
const {resolve} = require('./resolve')
const {getSubDependencies} = require('./resolve')
const createUnoFile = require('./create-uno')
const ignore = require('fstream-ignore')
const _ = require('lodash')
const cliArgs = require('./cli')()

const cwd = Path.normalize(Process.cwd())

const rootPackage = Utils.loadJsonFromDir({directory:cwd, filename:'package.json'})
if(rootPackage==null){
  console.error(`nfuse: No package.json found in ${cwd}`)
  Process.exit(1)
}

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
  
if(cliArgs.include.length == 0 && !cliArgs.force && _.isEqual(previousDeps.sort(), currentDeps.sort())) {
  console.warn('nfuse: No changes required')
  Process.exit(0)
} else {
  Utils.getFilesInDir({baseDir:moduleProjectDir})
    .filter(f => Path.extname(f) == '.uno' )
    .forEach(f => FS.unlinkSync(f) )
  buildModuleProject()
}

function buildModuleProject()
{
  try{
    let modulesToResolve = []
    
    for(let moduleName in rootPackage.dependencies) {
      modulesToResolve.push(moduleName)
      if(cliArgs.experimental)
        modulesToResolve = modulesToResolve.concat(getSubDependencies({baseDir:cwd, moduleName:moduleName}))
    }
    
    modulesToResolve
      .map(moduleName => {
        let {files, dirs} = resolve({baseDir:cwd, moduleName:moduleName, preferBrowser:_.flatten(cliArgs.browser)})
        packageDirs = packageDirs.concat(dirs)
        files = files.map(p => Path.relative(cwd, p))
        console.log(`nfuse: Including module '${moduleName}'`)
        if(files.length==0){
          console.error(`nfuse: Couldn't resolve dependency '${moduleName}', make sure to run 'npm install'`)
          Process.exit(1)
        } 
        includes = includes.concat(files.map(f => Path.relative(moduleProjectDir, f)))
        newDeps.push(moduleName+':'+rootPackage.dependencies[moduleName])
        
        return {
          name : moduleName, 
          mainPath : Path.relative(moduleProjectDir, files[0]),
          projectname : mainProjectName + '_modules',
          outDir : moduleProjectDir
        }
      })
      .forEach(m => {
        includes.push(Path.relative(m.outDir, createUnoFile(m)))
      })
    
    _.flatten(cliArgs.include).forEach(includePath => {
      console.log(`nfuse: Including module from source at '${includePath}'`)
      if(!FS.existsSync(includePath))
        throw `${includePath} does not exist`
      let filePath = createUnoFile({
        name : Path.basename(includePath, '.js'),
        mainPath : Path.relative(moduleProjectDir, includePath),
        projectname : mainProjectName + '_modules',
        outDir : moduleProjectDir
      })
      includes.push(Path.relative(moduleProjectDir, includePath))
      includes.push(Path.relative(moduleProjectDir, filePath))
    })
  }catch(e){
    console.error(e)
    console.log('nfuse: Failed')
    Process.exit(1)
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
      const ext = Path.extname(c.path)
      if(ext != '.js' && ext != '.unoproj') return
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
  ProjectTools.addExcludes({project:mainProject, excludesArray:['node_modules', 'NPM-Packages']})
  Utils.saveJson({obj:mainProject, path:mainProjectPath})
  Utils.saveJson({obj:{'dependencies':newDeps}, path:depCachePath})
  console.log('nfuse: Completed successfully')
}
