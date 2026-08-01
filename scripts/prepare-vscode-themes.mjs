import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    VSCODE_THEME_FILES,
    VSCODE_THEME_SOURCE_BASE,
    VSCODE_THEME_VERSION,
} from './vscode-theme-sources.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const sourceExtensionDir = resolve(root, 'vscode-extensions/interlis-editor-themes');
const targetExtensionDir = resolve(root, 'plugins/interlis-editor-themes');
const targetThemesDir = resolve(targetExtensionDir, 'themes');

function gitBlobSha1(content) {
    const header = Buffer.from(`blob ${content.length}\0`, 'utf8');
    return createHash('sha1').update(header).update(content).digest('hex');
}

async function downloadTheme(fileName, expectedSha) {
    const url = `${VSCODE_THEME_SOURCE_BASE}/${fileName}`;
    const response = await fetch(url, {
        headers: {
            'user-agent': 'interlis-editor-build',
        },
        redirect: 'follow',
    });
    if (!response.ok) {
        throw new Error(`Could not download ${url}: HTTP ${response.status}`);
    }

    const content = Buffer.from(await response.arrayBuffer());
    const actualSha = gitBlobSha1(content);
    if (actualSha !== expectedSha) {
        throw new Error(`Git blob SHA-1 mismatch for ${fileName}: expected ${expectedSha}, got ${actualSha}`);
    }

    await writeFile(resolve(targetThemesDir, fileName), content);
}

await rm(targetExtensionDir, { recursive: true, force: true });
await mkdir(targetThemesDir, { recursive: true });

await Promise.all(Object.entries(VSCODE_THEME_FILES).map(
    ([fileName, expectedSha]) => downloadTheme(fileName, expectedSha),
));

for (const fileName of ['package.json', 'LICENSE-VSCODE.txt']) {
    await copyFile(resolve(sourceExtensionDir, fileName), resolve(targetExtensionDir, fileName));
}

const extensionPackage = JSON.parse(await readFile(resolve(targetExtensionDir, 'package.json'), 'utf8'));
const themeIds = extensionPackage.contributes?.themes?.map(theme => theme.id) ?? [];
if (!themeIds.includes('Dark 2026') || !themeIds.includes('Light 2026')) {
    throw new Error('The local theme extension must contribute Dark 2026 and Light 2026.');
}

console.log(
    `Prepared ${extensionPackage.publisher}.${extensionPackage.name} with ${Object.keys(VSCODE_THEME_FILES).length} pinned files from VS Code ${VSCODE_THEME_VERSION}.`,
);
