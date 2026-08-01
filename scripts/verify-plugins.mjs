import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const pluginsDir = resolve(root, 'plugins');
const expectedVersion = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8')).interlisEditor.extensionVersion;

async function findPackageJson(directory, depth = 0) {
    if (depth > 5) {
        return [];
    }
    const found = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = resolve(directory, entry.name);
        if (entry.isDirectory()) {
            found.push(...await findPackageJson(path, depth + 1));
        } else if (entry.name === 'package.json') {
            found.push(path);
        }
    }
    return found;
}

let match;
for (const packageJsonPath of await findPackageJson(pluginsDir)) {
    try {
        const pkg = JSON.parse(await readFile(packageJsonPath, 'utf8'));
        if (pkg.publisher === 'edigonzales' && pkg.name === 'interlis-editor') {
            match = { pkg, packageJsonPath };
            break;
        }
    } catch {
        // Ignore package metadata not belonging to a VS Code extension.
    }
}

if (!match) {
    throw new Error('Downloaded plugins do not contain edigonzales.interlis-editor');
}
if (match.pkg.version !== expectedVersion) {
    throw new Error(`Expected INTERLIS extension ${expectedVersion}, got ${match.pkg.version}`);
}
if (!match.pkg.main) {
    throw new Error('INTERLIS extension has no main entry point');
}

console.log(`Verified built-in extension edigonzales.interlis-editor ${match.pkg.version}.`);
