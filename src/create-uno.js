'use strict'
const FS = require('fs')
const utils = require('./utils')

function gen(typeName, name, mainPath, projectname) {
  return `
  using Uno.Threading;
  using Uno;
  using Uno.IO;
  using Uno.UX;
  using Fuse.Scripting;
  
  namespace NpmModules
  {
    [UXGlobalModule]
    public sealed class Lib_${typeName} : FileModule, IModuleProvider
    {
      public Module GetModule()
  		{
  			return this;
  		}
      
      public Lib_${typeName}() : base(GetSource())
      {
  			Resource.SetGlobalKey(this, "${name}");
      }
      
      static FileSource GetSource()
      {
        return Bundle.Get("${projectname}").GetFile("${mainPath}");
      }
    }
  }
  `
}

module.exports = function(def/*{name, mainPath, projectname, outDir}*/) {
  let mainPath = def.mainPath.split('\\').join('/')
  let typeName = def.name.split('-').join('_').split('.').join('_')
  let src = gen(typeName, def.name, mainPath, def.projectname)
  let filePath = def.outDir + `/Lib_${typeName}.uno`
  utils.ensurePathValid(filePath)
  FS.writeFileSync(filePath, src)
  return filePath
}
