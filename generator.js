import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { spawnSync } from 'child_process';

import generateIndex from './index-generator.js';

const argv = yargs(hideBin(process.argv)).argv;

if(!argv.t) {
    console.log("You need to specify JSON template file as -t <path-to-template-file>.");
    process.exit();
}

if(!argv.o && !argv.or) {
    console.log("You need to specify output root folder as -o <absolute-path-to-root-folder>");
    console.log("or relative path to output root folder as -or <relative-path-to-root-folder>.");
    process.exit();
}

const settings = JSON.parse(fs.readFileSync("./generator-settings.json", {encoding: 'utf8'}));
console.log(settings);
const template = JSON.parse(fs.readFileSync(argv.t, {encoding: 'utf8'}));
let newFolder = "";
if(argv.o){
    newFolder = path.join(argv.o == "." ? process.cwd() : argv.o, template.name);
} else {
    newFolder = path.join(process.cwd(), argv.or == "." ? "": argv.or, template.name);
}


console.log(`Creating new folder at ${newFolder}.`);
if (!fs.existsSync(newFolder)){
    fs.mkdirSync(newFolder);
}

console.log(`Initializing npm project.`);
spawnSync("npm", ["init", "-y"], {
    cwd: newFolder,
    shell: true,
    stdio: 'inherit'
});

console.log(`Installing core modules.`);
spawnSync("npm", ["install", ...settings.modules], {
    cwd: newFolder,
    shell: true,
    stdio: 'inherit'
});

console.log(`Installing dev modules.`);
spawnSync("npm", ["install", "--dev", ...settings.devModules], {
    cwd: newFolder,
    shell: true,
    stdio: 'inherit'
});

console.log(`Creating index file.`);
const index = generateIndex(template);
const indexFile = `${template.name}.js`;
const indexFilePath = path.join(newFolder, indexFile);
fs.writeFileSync(indexFilePath, index, {encoding: 'utf8'});

spawnSync("npx", ["prettier --write", indexFile], {
    cwd: newFolder,
    shell: true,
    stdio: 'inherit'
});

console.log(`Making changes to package.json.`);
const packageJSON_path = path.join(newFolder, "package.json");
const packageJSON = JSON.parse(fs.readFileSync(packageJSON_path, {encoding: 'utf8'}));
packageJSON.type = "module";
packageJSON.main = indexFile;
packageJSON.scripts.start = `node ${indexFile}`;
packageJSON.scripts.dev = `nodemon ${indexFile}`;
fs.writeFileSync(packageJSON_path, JSON.stringify(packageJSON), {encoding: 'utf8'});

spawnSync("npx", ["prettier --write", "package.json"], {
    cwd: newFolder,
    shell: true,
    stdio: 'inherit'
});

