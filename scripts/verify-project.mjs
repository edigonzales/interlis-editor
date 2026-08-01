import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const readJson = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const rootPackage = await readJson('package.json');
const appPackage = await readJson('applications/electron/package.json');
const productPackage = await readJson('theia-extensions/interlis-editor-product/package.json');
const builder = await readFile(resolve(root, 'applications/electron/electron-builder.yml'), 'utf8');
const assetScript = await readFile(resolve(root, 'scripts/fetch-branding-assets.mjs'), 'utf8');

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

assert(appPackage.productName === 'INTERLIS Editor', 'Electron productName must be INTERLIS Editor');
assert(appPackage.theia.frontend.config.applicationName === 'INTERLIS Editor', 'Theia applicationName must be INTERLIS Editor');
assert(appPackage.theia.frontend.config.electron.appUserModelId === 'ch.interlis.editor', 'Unexpected appUserModelId');
assert(appPackage.theia.frontend.config.electron.splashScreenOptions.content === 'resources/interlis-splash.html', 'Unexpected splash screen entry');
assert(builder.includes('productName: INTERLIS Editor'), 'electron-builder product name is missing');
assert(builder.includes('executableName: interlis-editor'), 'Stable executable name is missing');
assert(builder.includes('resources/branding/ililogo1024.png'), 'Application logo is not configured');

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

for (const required of [
    'applications/electron/resources/interlis-splash.html',
    'theia-extensions/interlis-editor-product/src/browser/interlis-editor-about-dialog.tsx',
    'theia-extensions/interlis-editor-product/src/browser/interlis-editor-getting-started-widget.tsx',
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

console.log(`Project verification passed (Theia ${expectedTheia}, extension ${rootPackage.interlisEditor.extensionVersion}).`);
