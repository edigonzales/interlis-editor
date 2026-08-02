import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allowedExtensionIds, allowedPluginDirectories } from './builtin-plugin-policy.mjs';
import { VSCODE_THEME_FILES, VSCODE_THEME_VERSION } from './vscode-theme-sources.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const pluginsDir = resolve(root, 'plugins');
const rootPackage = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const expectedExtensionId = rootPackage.interlisEditor.extensionId;
const expectedVersion = rootPackage.interlisEditor.extensionVersion;

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

async function assertFile(path, message) {
    try {
        if (!(await stat(path)).isFile()) {
            throw new Error(message);
        }
    } catch (error) {
        if (error?.message === message) {
            throw error;
        }
        throw new Error(message, { cause: error });
    }
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

const expectedPluginIds = new Set(allowedExtensionIds);
const actualPluginIds = new Set(
    packages
        .filter(({ pkg }) => pkg.publisher && pkg.name)
        .map(({ pkg }) => `${pkg.publisher}.${pkg.name}`),
);
const missingPluginIds = [...expectedPluginIds].filter(id => !actualPluginIds.has(id));
const unexpectedPluginIds = [...actualPluginIds].filter(id => !expectedPluginIds.has(id));
if (missingPluginIds.length || unexpectedPluginIds.length) {
    throw new Error([
        missingPluginIds.length ? `Missing built-in plugins: ${missingPluginIds.join(', ')}` : '',
        unexpectedPluginIds.length ? `Unexpected built-in plugins: ${unexpectedPluginIds.join(', ')}` : '',
    ].filter(Boolean).join('. '));
}

const expectedPluginDirectories = new Set(allowedPluginDirectories);
const actualPluginDirectories = new Set(
    (await readdir(pluginsDir, { withFileTypes: true }))
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name),
);
const missingPluginDirectories = [...expectedPluginDirectories].filter(directory => !actualPluginDirectories.has(directory));
const unexpectedPluginDirectories = [...actualPluginDirectories].filter(directory => !expectedPluginDirectories.has(directory));
if (missingPluginDirectories.length || unexpectedPluginDirectories.length) {
    throw new Error([
        missingPluginDirectories.length ? `Missing plugin directories: ${missingPluginDirectories.join(', ')}` : '',
        unexpectedPluginDirectories.length ? `Unexpected plugin directories: ${unexpectedPluginDirectories.join(', ')}` : '',
    ].filter(Boolean).join('. '));
}

const interlisExtension = packages.find(({ pkg }) => `${pkg.publisher}.${pkg.name}` === expectedExtensionId);
if (!interlisExtension) {
    throw new Error(`Downloaded plugins do not contain ${expectedExtensionId}`);
}
const interlisPackage = interlisExtension.pkg;
if (interlisPackage.version !== expectedVersion) {
    throw new Error(`Expected ${expectedExtensionId} ${expectedVersion}, got ${interlisPackage.version}`);
}
if (interlisPackage.publisher !== 'edigonzales' || interlisPackage.name !== 'interlis-language-tools') {
    throw new Error(`Unexpected INTERLIS extension identity: ${interlisPackage.publisher}.${interlisPackage.name}`);
}
if (interlisPackage.type !== 'module') {
    throw new Error('INTERLIS Language Tools must be packaged as an ES module extension');
}
if (interlisPackage.engines?.vscode !== '^1.96.0') {
    throw new Error(`Unexpected INTERLIS Language Tools VS Code engine: ${interlisPackage.engines?.vscode ?? 'missing'}`);
}

const interlisRoot = dirname(interlisExtension.packageJsonPath);
if (typeof interlisPackage.main !== 'string' || typeof interlisPackage.browser !== 'string') {
    throw new Error('INTERLIS Language Tools must provide both main and browser entry points');
}
await assertFile(resolve(interlisRoot, interlisPackage.main), `Missing INTERLIS Language Tools main entry point: ${interlisPackage.main}`);
await assertFile(resolve(interlisRoot, interlisPackage.browser), `Missing INTERLIS Language Tools browser entry point: ${interlisPackage.browser}`);

const activationEvents = new Set(interlisPackage.activationEvents ?? []);
for (const event of ['onLanguage:interlis', 'onCustomEditor:interlisLanguageTools.diagramEditor']) {
    if (!activationEvents.has(event)) {
        throw new Error(`INTERLIS Language Tools is missing activation event ${event}`);
    }
}

const language = (interlisPackage.contributes?.languages ?? []).find(candidate => candidate.id === 'interlis');
if (!language || !language.extensions?.includes('.ili')) {
    throw new Error('INTERLIS Language Tools does not contribute the .ili language');
}
if (typeof language.configuration !== 'string') {
    throw new Error('INTERLIS Language Tools does not provide language configuration');
}
await assertFile(resolve(interlisRoot, language.configuration), `Missing INTERLIS language configuration: ${language.configuration}`);

const grammar = (interlisPackage.contributes?.grammars ?? []).find(candidate => candidate.language === 'interlis');
if (!grammar || typeof grammar.path !== 'string') {
    throw new Error('INTERLIS Language Tools does not contribute an INTERLIS grammar');
}
await assertFile(resolve(interlisRoot, grammar.path), `Missing INTERLIS grammar: ${grammar.path}`);

const diagramEditor = (interlisPackage.contributes?.customEditors ?? []).find(candidate => candidate.viewType === 'interlisLanguageTools.diagramEditor');
if (!diagramEditor || diagramEditor.priority !== 'option' || !diagramEditor.selector?.some(selector => selector.filenamePattern === '*.ili')) {
    throw new Error('INTERLIS Language Tools does not correctly contribute the INTERLIS diagram editor');
}

const requiredCommands = [
    'interlisLanguageTools.compile',
    'interlisLanguageTools.template.new',
    'interlisLanguageTools.diagram.show',
    'interlisLanguageTools.diagram.refresh',
    'interlisLanguageTools.diagram.exportSvg',
    'interlisLanguageTools.diagram.exportVisibleSvg',
    'interlisLanguageTools.docx.export',
];
const commandIds = new Set((interlisPackage.contributes?.commands ?? []).map(command => command.command));
for (const command of requiredCommands) {
    if (!commandIds.has(command)) {
        throw new Error(`INTERLIS Language Tools is missing command ${command}`);
    }
}

for (const [label, uiTheme, fileName] of [
    ['INTERLIS Light', 'vs', 'themes/interlis-color-theme-light.json'],
    ['INTERLIS Dark', 'vs-dark', 'themes/interlis-color-theme-dark.json'],
]) {
    const contribution = (interlisPackage.contributes?.themes ?? []).find(theme => theme.label === label);
    if (!contribution || contribution.uiTheme !== uiTheme || contribution.path !== `./${fileName}`) {
        throw new Error(`INTERLIS Language Tools does not correctly contribute ${label}`);
    }
    await assertFile(resolve(interlisRoot, fileName), `Missing INTERLIS Language Tools theme: ${fileName}`);
}

const themeExtension = packages.find(({ pkg }) => pkg.publisher === 'edigonzales' && pkg.name === 'interlis-editor-themes');
if (!themeExtension) {
    throw new Error('Prepared plugins do not contain edigonzales.interlis-editor-themes');
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

console.log(`Verified built-in extension ${expectedExtensionId} ${interlisPackage.version}.`);
console.log(`Verified Dark 2026 and Light 2026 from VS Code ${VSCODE_THEME_VERSION}.`);
