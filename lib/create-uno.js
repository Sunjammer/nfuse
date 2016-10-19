'use strict';

var FS = require('fs');
var utils = require('./utils');

function gen(typeName, name, mainPath, projectname) {
  return '\n  using Uno.Threading;\n  using Uno;\n  using Uno.IO;\n  using Uno.UX;\n  using Fuse.Scripting;\n  \n  namespace NpmModules\n  {\n    [UXGlobalModule]\n    public sealed class Lib_' + typeName + ' : FileModule, IModuleProvider\n    {\n      public Module GetModule()\n  \t\t{\n  \t\t\treturn this;\n  \t\t}\n      \n      public Lib_' + typeName + '() : base(GetSource())\n      {\n  \t\t\tResource.SetGlobalKey(this, "' + name + '");\n      }\n      \n      static FileSource GetSource()\n      {\n        return Bundle.Get("' + projectname + '").GetFile("' + mainPath + '");\n      }\n    }\n  }\n  ';
}

module.exports = function (def) {
  var mainPath = def.mainPath.split('\\').join('/');
  var typeName = def.name.split('-').join('_').split('.').join('_');
  var src = gen(typeName, def.name, mainPath, def.projectname);
  var filePath = def.outDir + ('/Lib_' + typeName + '.uno');
  utils.ensurePathValid(filePath);
  FS.writeFileSync(filePath, src);
  return filePath;
};