import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VSCODE_THEME_FILES, VSCODE_THEME_VERSION } from './vscode-theme-sources.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const readJson = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const rootPackage = await readJson('package.json');
const appPackage = await readJson('applications/electron/package.json');
const productPackage = await readJson('theia-extensions/interlis-editor-product/package.json');
const themePackage = await readJson('vscode-extensions/interlis-editor-themes/package.json');
const builder = await readFile(resolve(root, 'applications/electron/electron-builder.yml'), 'utf8');
const assetScript = await readFile(resolve(root, 'scripts/fetch-branding-assets.mjs'), 'utf8');
const themeScript = await readFile(resolve(root, 'scripts/prepare-vscode-themes.mjs'), 'utf8');

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

assert(appPackage.productName === 'INTERLIS Editor', 'Electron productName must be INTERLIS Editor');
assert(appPackage.theia.frontend.config.applicationName === 'INTERLIS Editor', 'Theia applicationName must be INTERLIS Editor');
assert(appPackage.theia.frontend.config.electron.appUserModelId === 'ch.interlis.editor', 'Unexpected appUserModelId');
assert(appPackage.theia.frontend.config.electron.splashScreenOptions.content === 'resources/interlis-splash.html', 'Unexpected splash screen entry');
assert(appPackage.theia.frontend.config.preferences['workbench.colorTheme'] === 'Dark 2026', 'Dark 2026 must be the default theme');
assert(appPackage.theia.frontend.config.preferences['editor.fontFamily'] === 'JetBrains Mono, monospace', 'JetBrains Mono must be the default editor font');
assert(appPackage.theia.frontend.config.preferences['terminal.integrated.fontFamily'] === 'JetBrains Mono, monospace', 'JetBrains Mono must be the default terminal font');
assert(builder.includes('productName: INTERLIS Editor'), 'electron-builder product name is missing');
assert(builder.includes('executableName: interlis-editor'), 'Stable executable name is missing');
assert(builder.includes('resources/branding/interlis-app-icon.icns'), 'macOS application icon is not configured');
assert(builder.includes('resources/branding/interlis-app-icon.png'), 'Cross-platform application icon is not configured');
assert(builder.includes('resources/branding/ililogo1024.png') === false, 'Product logo must not be used as the packaged application icon');

const expectedTheia = rootPackage.interlisEditor.theiaVersion;
const packageEntries = [
    ['root', rootPackage],
    ['application', appPackage],
    ['product extension', productPackage],
];
for (const [label, pkg] of packageEntries) {
    for (const section of ['dependencies', 'devDependencies']) {
        for (const [name, version] of Object.entries(pkg[section] ?? {})) {
            if (name.startsWith('@theia/')) {
                assert(version === expectedTheia, `${label}: ${name} must be exactly ${expectedTheia}, got ${version}`);
            }
        }
    }
}

assert(appPackage.dependencies['interlis-editor-product-ext'] === productPackage.version, 'Product Extension dependency/version mismatch');
assert(Object.keys(appPackage.dependencies).filter(name => name.includes('interlis')).join(',') === 'interlis-editor-product-ext', 'Only the custom Product Extension may be linked as INTERLIS application code');
assert(rootPackage.theiaPlugins['edigonzales.interlis-editor'].includes(`/${rootPackage.interlisEditor.extensionVersion}/`), 'Open VSX plugin URL/version mismatch');
assert(productPackage.theiaExtensions?.[0]?.frontend === 'lib/browser/interlis-editor-frontend-module', 'Product Extension frontend module mismatch');
assert(assetScript.includes(rootPackage.interlisEditor.theiaTemplateCommit) === false, 'Branding script must not depend on the Theia template commit');
assert(assetScript.includes('0079e36663dbb2cc126cd10b568c07075bef666a'), 'Splash image hash is not pinned');
assert(assetScript.includes('c130c2e5af2949a306d2c10ac53004a75fc11857'), 'Logo hash is not pinned');
assert(assetScript.includes('fe0efefa58236d01b664f2083c0ebfeb14ecae6d'), 'macOS application icon hash is not pinned');
assert(assetScript.includes('77f6a730c7c6eccaf33f5ebb39fcdfa5932bda87'), 'Cross-platform application icon hash is not pinned');
assert(rootPackage.scripts.fonts === 'node scripts/fetch-font-assets.mjs', 'Font preparation script is not registered');
assert(rootPackage.scripts.build.includes('yarn fonts'), 'Production build must prepare JetBrains Mono');

assert(rootPackage.interlisEditor.vscodeThemeVersion === VSCODE_THEME_VERSION, 'VS Code theme version mismatch');
assert(rootPackage.scripts.themes === 'node scripts/prepare-vscode-themes.mjs', 'Theme preparation script is not registered');
assert(rootPackage.scripts['download:plugins'].includes('yarn themes'), 'Plugin download must prepare the local themes');
assert(rootPackage.scripts.build.includes('yarn themes'), 'Production build must prepare the local themes');
assert(Object.keys(VSCODE_THEME_FILES).length === 8, 'Expected the two complete VS Code 2026 theme inheritance chains');
assert(themeScript.includes('gitBlobSha1'), 'Theme downloader must verify Git blob SHA-1 values');
assert(themePackage.publisher === 'interlis' && themePackage.name === 'interlis-editor-themes', 'Unexpected theme extension identity');
const themeIds = themePackage.contributes?.themes?.map(theme => theme.id).sort();
assert(JSON.stringify(themeIds) === JSON.stringify(['Dark 2026', 'Light 2026']), 'Theme extension must contribute Dark 2026 and Light 2026');

for (const required of [
    'applications/electron/resources/interlis-splash.html',
    'scripts/fetch-font-assets.mjs',
    'theia-extensions/interlis-editor-product/src/browser/interlis-editor-about-dialog.tsx',
    'theia-extensions/interlis-editor-product/src/browser/interlis-editor-getting-started-widget.tsx',
    'vscode-extensions/interlis-editor-themes/package.json',
    'vscode-extensions/interlis-editor-themes/LICENSE-VSCODE.txt',
    'scripts/prepare-vscode-themes.mjs',
    'scripts/vscode-theme-sources.mjs',
    'examples/MinimalModel.ili',
]) {
    assert((await stat(resolve(root, required))).isFile(), `Missing required file: ${required}`);
}

for (const forbidden of ['glsp', 'lsp-server', 'theia-app', 'vscode-extension', 'applications/electron/src']) {
    try {
        await stat(resolve(root, forbidden));
        throw new Error(`Fresh product must not contain legacy or custom application code at ${forbidden}`);
    } catch (error) {
        if (error?.code !== 'ENOENT') {
            throw error;
        }
    }
}

console.log(
    `Project verification passed (Theia ${expectedTheia}, extension ${rootPackage.interlisEditor.extensionVersion}, VS Code themes ${VSCODE_THEME_VERSION}).`,
);
