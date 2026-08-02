import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const modulePath = resolve(root, 'theia-extensions/interlis-editor-product/lib/browser/interlis-editor-frontend-module.js');
const declarationPath = resolve(root, 'theia-extensions/interlis-editor-product/lib/browser/interlis-editor-about-dialog.d.ts');
const logoPath = resolve(root, 'theia-extensions/interlis-editor-product/src/browser/style/ililogo1024.png');
const stylePath = resolve(root, 'theia-extensions/interlis-editor-product/src/browser/style/index.css');
const fontDirectory = resolve(root, 'theia-extensions/interlis-editor-product/src/browser/style/fonts');
const fontPaths = [
    'JetBrainsMono-Regular.woff2',
    'JetBrainsMono-Italic.woff2',
    'JetBrainsMono-Bold.woff2',
    'JetBrainsMono-BoldItalic.woff2',
    'OFL.txt',
].map(file => resolve(fontDirectory, file));
const mesloFontPaths = [
    'MesloLGS-NF-Regular.ttf',
    'MesloLGS-NF-Italic.ttf',
    'MesloLGS-NF-Bold.ttf',
    'MesloLGS-NF-Bold-Italic.ttf',
    'MesloLGS-NF-License.txt',
].map(file => resolve(fontDirectory, file));

for (const path of [modulePath, declarationPath, logoPath, stylePath, ...fontPaths, ...mesloFontPaths]) {
    await access(path, constants.R_OK);
}
const compiled = await readFile(modulePath, 'utf8');
if (!compiled.includes('interlis-editor-about-dialog')) {
    throw new Error('Compiled Product Extension does not register the custom About dialog');
}
const style = await readFile(stylePath, 'utf8');
for (const fontFile of fontPaths.slice(0, 4)) {
    if (!style.includes(basename(fontFile))) {
        throw new Error(`Product Extension CSS does not reference ${fontFile}`);
    }
}
for (const fontFile of mesloFontPaths.slice(0, 4)) {
    if (!style.includes(basename(fontFile))) {
        throw new Error(`Product Extension CSS does not reference ${fontFile}`);
    }
}
console.log('Product Extension build verification passed.');
