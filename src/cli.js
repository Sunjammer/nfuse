const {ArgumentParser} = require('argparse')
const parser = new ArgumentParser({
  prog: 'nfuse',
  version: require('process').env.npm_package_version,
  addHelp:true,
  description: 'Fuse project integration utility for NPM. Creates a Uno project and Uno source to ease the use of NPM packages in Fuse projects based on an adjacent package.json.'
})

parser.addArgument(
  [ '-f', '--force' ],
  {
    defaultValue: false,
    action: 'storeTrue',
    nargs: 0,
    help: 'Force a reconstruction of the package project'
  }
)

parser.addArgument(
  [ '-b', '--browser' ],
  {
    defaultValue: '',
    action: 'append',
    nargs: 1,
    metavar: 'libname',
    help: 'Prefer browser entrypoint for this library over main if found. Repeatable (-b foo -b bar).'
  }
)

module.exports = () => parser.parseArgs()
