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
        var bundle = Bundle.Get("${projectname}");  
        var f = bundle.GetFile("${mainPath}");
        return f;
      }
    }
  }
  `
}

module.exports = function({name, mainPath, projectname, outDir}) {
  mainPath = mainPath.split('\\').join('/')
  let typeName = name.split('-').join('_')
  let src = gen(typeName, name, mainPath, projectname)
  let filePath = outDir + `/Lib_${typeName}.uno`
  utils.ensurePathValid(filePath)
  FS.writeFileSync(filePath, src)
  return filePath
}
