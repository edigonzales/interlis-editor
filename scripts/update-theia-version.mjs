import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error('Usage: yarn update:theia <version>');
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const paths = [
    'package.json',
    'applications/electron/package.json',
    'theia-extensions/interlis-editor-product/package.json',
];

for (const relativePath of paths) {
    const path = resolve(root, relativePath);
    const pkg = JSON.parse(await readFile(path, 'utf8'));
    for (const section of ['dependencies', 'devDependencies']) {
        for (const name of Object.keys(pkg[section] ?? {})) {
            if (name.startsWith('@theia/')) {
                pkg[section][name] = version;
            }
        }
    }
    if (relativePath === 'package.json') {
        pkg.interlisEditor.theiaVersion = version;
    }
    await writeFile(path, `${JSON.stringify(pkg, null, 2)}\n`);
}

console.log(`Updated all direct Eclipse Theia dependencies to ${version}.`);
