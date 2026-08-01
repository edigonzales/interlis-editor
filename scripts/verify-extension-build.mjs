import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const modulePath = resolve(root, 'theia-extensions/interlis-editor-product/lib/browser/interlis-editor-frontend-module.js');
const declarationPath = resolve(root, 'theia-extensions/interlis-editor-product/lib/browser/interlis-editor-about-dialog.d.ts');
const logoPath = resolve(root, 'theia-extensions/interlis-editor-product/src/browser/style/ililogo1024.png');

for (const path of [modulePath, declarationPath, logoPath]) {
    await access(path, constants.R_OK);
}
const compiled = await readFile(modulePath, 'utf8');
if (!compiled.includes('interlis-editor-about-dialog')) {
    throw new Error('Compiled Product Extension does not register the custom About dialog');
}
console.log('Product Extension build verification passed.');
