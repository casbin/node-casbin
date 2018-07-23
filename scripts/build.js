const ts = require('typescript');
const fs = require('fs-extra');
const path = require('path');
const rollup = require('rollup');

function clean() {
  fs.removeSync('lib');
}

function build() {
  const tsConfig = path.resolve('tsconfig.json');
  const { config: options, error } = ts.parseConfigFileTextToJson(
    tsConfig,
    ts.sys.readFile(tsConfig)
  );
  if (error) {
    throw new Error(error);
  }
  options.outDir = path.resolve('lib/es6');
  options.declaration = true;
  options.declarationDir = path.resolve('lib/es6');

  const fileNames = [path.resolve('src/casbin.ts')];
  const program = ts.createProgram(fileNames, options);
  const emitResult = program.emit();
  if (emitResult.emitSkipped) {
    throw new Error(`Compile typescript error`);
  }

  rollup
    .rollup({
      input: path.resolve('lib/es6/casbin.js'),
      plugins: [require('rollup-plugin-node-resolve')()]
    })
    .then(bundle =>
      bundle.write({
        file: path.resolve('lib/casbin.js'),
        format: 'cjs'
      })
    );
}

clean();
build();
