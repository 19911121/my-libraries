const {minify} = require('terser');
const prettier = require('prettier');
const glob = require('glob');
const fs = require('fs');
const path = require('path');

// terser
const terserDir = './dist/babel/js';
const terserGlobPattern = `${terserDir}/**/*.js`;
const terserFilePaths = glob.sync(terserGlobPattern, {});
const terserOptions = {
  compress: true,
  mangle: true,
};
const terserFiles = [];

// preiiter
const prettierDeployDir = './dist/next/js/';
const prettierGlobPattern = `${prettierDeployDir}/**/*.js`;
const prettierFilePaths = glob.sync(prettierGlobPattern, {});

// copy
const copyDir = './src';
const copyDeployDirs = [
  './dist/next/ts/',
  '../ncc-integrated-front-admin/src/libraries',
  '../ncc-seller-front-admin/src/libraries'
];
const copyGlobPattern = `${copyDir}/**/*.ts`;
const copyFilePaths = glob.sync(copyGlobPattern, {});

async function task(cb) {
  try {
    console.log('---------- glup build start');

    await execTerser();
    await execPrettier();
    await execCopy();

    console.log('---------- glup build end');

    cb();
  } catch (error) {
    console.error('build error...', error);
  }
}

async function execTerser() {
  terserFilePaths.forEach((filePath) => {
    const filePathInfo = path.parse(filePath);
    const outputFileExt = 'js';
    const outputFileName = filePathInfo.name;
    const outputFileFullName = `${outputFileName}.${outputFileExt}`;

    terserFiles.push({
      dir: filePathInfo.dir,
      fullName: outputFileFullName,
      name: outputFileName,
      ext: outputFileExt,
      contents: fs.readFileSync(filePath, 'utf8'),
    });
  });

  for (const file of terserFiles) {
    const terserContents = (await minify(file.contents, terserOptions)).code;

    fs.writeFileSync(`${file.dir}/${file.name}.min.${file.ext}`, terserContents);
  }
}

async function execPrettier() {
  const config = JSON.parse(fs.readFileSync(path.resolve(".prettierrc"), 'utf8'));

  prettierFilePaths.forEach((filePath) => {
    fs.writeFileSync(
      path.resolve(filePath),
      prettier.format(
        fs.readFileSync(path.resolve(filePath), 'utf8'), {
          ...config,
          parser: 'babel'
        }
      )
    );
  });
}

function execCopy() {
  copyFilePaths.forEach((filePath) => {
    const filePathInfo = path.parse(filePath);
    const outputFileExt = 'ts';
    const outputFileName = filePathInfo.name;
    
    for(const dir of copyDeployDirs) {
      const outputFileDir = `${filePathInfo.dir.replace(copyDir, dir)}/`;
      const outputFileFullName = `${outputFileDir}${outputFileName}.${outputFileExt}`;

      if (!fs.existsSync(outputFileDir)) fs.mkdirSync(outputFileDir, {recursive: true});

      fs.copyFileSync(filePath, outputFileFullName);
    }
  });
}

exports.default = task;
