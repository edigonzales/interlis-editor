import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VSCODE_THEME_FILES, VSCODE_THEME_VERSION } from './vscode-theme-sources.mjs';

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

function gitBlobSha1(content) {
    const header = Buffer.from(`blob ${content.length}\0`, 'utf8');
    return createHash('sha1').update(header).update(content).digest('hex');
}

const packages = [];
for (const packageJsonPath of await findPackageJson(pluginsDir)) {
    try {
        packages.push({
            pkg: JSON.parse(await readFile(packageJsonPath, 'utf8')),
            packageJsonPath,
        });
    } catch {
        // Ignore package metadata that is not valid VS Code extension metadata.
    }
}

const interlisExtension = packages.find(({ pkg }) => pkg.publisher === 'edigonzales' && pkg.name === 'interlis-editor');
if (!interlisExtension) {
    throw new Error('Downloaded plugins do not contain edigonzales.interlis-editor');
}
if (interlisExtension.pkg.version !== expectedVersion) {
    throw new Error(`Expected INTERLIS extension ${expectedVersion}, got ${interlisExtension.pkg.version}`);
}
if (!interlisExtension.pkg.main) {
    throw new Error('INTERLIS extension has no main entry point');
}

const themeExtension = packages.find(({ pkg }) => pkg.publisher === 'interlis' && pkg.name === 'interlis-editor-themes');
if (!themeExtension) {
    throw new Error('Prepared plugins do not contain interlis.interlis-editor-themes');
}
const themes = themeExtension.pkg.contributes?.themes ?? [];
for (const [id, uiTheme] of [['Dark 2026', 'vs-dark'], ['Light 2026', 'vs']]) {
    const contribution = themes.find(theme => theme.id === id);
    if (!contribution || contribution.uiTheme !== uiTheme) {
        throw new Error(`Theme extension does not correctly contribute ${id}`);
    }
}

const themeRoot = dirname(themeExtension.packageJsonPath);
for (const [fileName, expectedSha] of Object.entries(VSCODE_THEME_FILES)) {
    const path = resolve(themeRoot, 'themes', fileName);
    if (!(await stat(path)).isFile()) {
        throw new Error(`Missing generated VS Code theme file: ${fileName}`);
    }
    const content = await readFile(path);
    const actualSha = gitBlobSha1(content);
    if (actualSha !== expectedSha) {
        throw new Error(`VS Code theme hash mismatch for ${fileName}: expected ${expectedSha}, got ${actualSha}`);
    }
}

const darkTheme = await readFile(resolve(themeRoot, 'themes/2026-dark.json'), 'utf8');
const lightTheme = await readFile(resolve(themeRoot, 'themes/2026-light.json'), 'utf8');
if (!darkTheme.includes('"include": "./dark_modern.json"')) {
    throw new Error('Dark 2026 does not inherit the complete Dark Modern syntax theme');
}
if (!lightTheme.includes('"include": "./light_modern.json"')) {
    throw new Error('Light 2026 does not inherit the complete Light Modern syntax theme');
}

console.log(`Verified built-in extension edigonzales.interlis-editor ${interlisExtension.pkg.version}.`);
console.log(`Verified Dark 2026 and Light 2026 from VS Code ${VSCODE_THEME_VERSION}.`);
