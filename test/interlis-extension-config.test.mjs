import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allowedExtensionIds, allowedPluginDirectories } from '../scripts/builtin-plugin-policy.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const readText = path => readFile(resolve(root, path), 'utf8');
const rootPackage = JSON.parse(await readText('package.json'));
const applicationPackage = JSON.parse(await readText('applications/electron/package.json'));
const expectedExtensionId = ['edigonzales', 'interlis-language-tools'].join('.');
const legacyExtensionId = ['edigonzales', 'interlis-editor'].join('.');
const legacyRepository = 'github.com/edigonzales/' + 'interlis-lsp';

test('pins the current INTERLIS Language Tools extension exactly', () => {
    const version = rootPackage.interlisEditor.extensionVersion;
    const [publisher, name] = expectedExtensionId.split('.');
    const expectedUrl = `https://open-vsx.org/api/${publisher}/${name}/${version}/file/${expectedExtensionId}-${version}.vsix`;

    assert.equal(rootPackage.interlisEditor.extensionId, expectedExtensionId);
    assert.equal(version, '0.1.0');
    assert.equal(rootPackage.theiaPlugins[expectedExtensionId], expectedUrl);
    assert.equal(rootPackage.theiaPlugins[legacyExtensionId], undefined);
    assert.deepEqual(
        Object.keys(rootPackage.theiaPlugins).filter(id => id.startsWith('edigonzales.')),
        [expectedExtensionId],
    );
});

test('keeps the built-in plugin policy free of the legacy extension', () => {
    assert.ok(allowedExtensionIds.includes(expectedExtensionId));
    assert.ok(allowedPluginDirectories.includes(expectedExtensionId));
    assert.equal(allowedExtensionIds.includes(legacyExtensionId), false);
    assert.equal(allowedPluginDirectories.includes(legacyExtensionId), false);
    assert.equal(new Set(allowedExtensionIds).size, allowedExtensionIds.length);
    assert.equal(new Set(allowedPluginDirectories).size, allowedPluginDirectories.length);
});

test('uses 14 px as the default editor font size without changing font families', () => {
    const preferences = applicationPackage.theia.frontend.config.preferences;

    assert.equal(preferences['editor.fontSize'], 14);
    assert.equal(preferences['editor.fontFamily'], 'JetBrains Mono, monospace');
    assert.equal(preferences['terminal.integrated.fontFamily'], "'MesloLGS NF', monospace");
});

test('does not retain legacy extension or repository references in product text', async () => {
    const texts = await Promise.all([
        readText('README.md'),
        readText('theia-extensions/interlis-editor-product/src/browser/branding-util.tsx'),
    ]);
    for (const text of texts) {
        assert.equal(text.includes(legacyExtensionId), false);
        assert.equal(text.includes(legacyRepository), false);
    }
});
