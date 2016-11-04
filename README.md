# Fuse project integration utility for NPM

Let's you use most [npm](https://www.npmjs.com/) packages with the [Fuse](https://www.fusetools.com/) scripting layer

`npm install -g nfuse`

1. Make a package.json next to your .unoproj. 
2. Run `nfuse` in that directory
3. Use your NPM packages in Fuse as you would in any other CommonJS environment.
4. ???
5. Profit!

## What does it do really?

`nfuse` is a command written for NodeJS that generates Uno source and project files based on dependencies declared in `package.json` to allow you to easily `require` those modules in your Fuse JavaScript source. When you run it in a fuse project directory, it will create a new subdirectory for NPM shenanigans containing a new Uno project and some Uno source shims. It'll then add a project reference to your original project for happy building times.

In Fuse terms, this means that instead of doing, say, `require('./node_modules/lodash.isnull/index.js')` you would, given a package.json dependency on lodash.isnull, just `require('lodash.isnull')`

## Arguments

* `--force` By default, nfuse will early-out if the list of dependencies in package.json has not changed since last run. This flag overrides that behavior.
* `--browser libname` Some libraries might not function correctly in their node variant when running in Fuse. You may have better luck with the browser entrypoint if the library offers one. This argument lets you specify libraries for which nfuse will prefer the browser entrypoint if available. You can repeat to flag multiple libraries (`-b foo -b bar`).

## Notes on compatibility

Fuse is not a web or browser based platform despite using markup and JS, and the ways that we handle data binding, layout and animation are all idiosyncratic to the platform. Fuse treats JS like a first class component, but it pays little regard to how JS is handled by other platforms: It is simply used as a scripting language. 

Thus, you can assume that any NPM package that acts on the DOM or uses other web concepts won't behave or may not even function at all. Likewise, any NodeJS library that depends on modules like `process` and `fs` won't play nice. 

Generic JavaScript stuff like `ramda`, `lodash`, `rx` and the like will work fine.

Also note that Fuse has very limited native support for ES6 and only packages built for ES5 will function across all targets.

## Disclaimers
Under constant development. YMMV. [Report issues](https://github.com/Sunjammer/nfuse/issues) as you encounter them. 
