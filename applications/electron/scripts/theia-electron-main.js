'use strict';

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.resolve(__dirname, '..', 'package.json');
const product = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (process.argv.includes('--version')) {
    process.stdout.write(`${product.productName} ${product.version}\n`);
    process.exit(0);
}

if (process.argv.includes('--help')) {
    process.stdout.write(`${product.productName}\n\nUsage: interlis-editor [file-or-workspace]\n`);
    process.exit(0);
}

const bundledPluginsDir = __dirname.includes('.asar')
    ? path.join(process.resourcesPath, 'app', 'plugins')
    : path.resolve(__dirname, '..', '..', '..', 'plugins');

process.env.THEIA_DEFAULT_PLUGINS = `local-dir:${bundledPluginsDir}`;

require('../lib/backend/electron-main.js');
