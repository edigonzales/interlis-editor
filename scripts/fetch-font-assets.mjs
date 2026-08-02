import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const archiveUrl = 'https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip';
const archiveSha256 = '6f6376c6ed2960ea8a963cd7387ec9d76e3f629125bc33d1fdcd7eb7012f7bbf';
const mesloCommit = '145eb9fbc2f42ee408dacd9b22d8e6e0e553f83d';
const mesloBaseUrl = `https://raw.githubusercontent.com/romkatv/powerlevel10k-media/${mesloCommit}`;
const targetDirectory = resolve(root, 'theia-extensions/interlis-editor-product/src/browser/style/fonts');

const assets = [
    {
        source: 'fonts/webfonts/JetBrainsMono-Regular.woff2',
        target: 'JetBrainsMono-Regular.woff2',
        sha256: 'a9cb1cd82332b23a47e3a1239d25d13c86d16c4220695e34b243effa999f45f2',
    },
    {
        source: 'fonts/webfonts/JetBrainsMono-Italic.woff2',
        target: 'JetBrainsMono-Italic.woff2',
        sha256: 'cb6a1b246318ed3885d7dffa14a2609297fe80e9b8e500bea33b52fa312a36a4',
    },
    {
        source: 'fonts/webfonts/JetBrainsMono-Bold.woff2',
        target: 'JetBrainsMono-Bold.woff2',
        sha256: 'c503cc5ec5f8b2c7666b7ecda1adf44bd45f2e6579b2eba0fc292150416588a2',
    },
    {
        source: 'fonts/webfonts/JetBrainsMono-BoldItalic.woff2',
        target: 'JetBrainsMono-BoldItalic.woff2',
        sha256: '3a013466c0eee979fb9d42c2d7a8887cd3645dc8b897cfc5b71781cf982efc5a',
    },
    {
        source: 'OFL.txt',
        target: 'OFL.txt',
        sha256: '30f0c136e3c88e422d0791acd97238870f9054a9729bc34cf2ff0d4ed8cac4ad',
    },
];

const mesloAssets = [
    {
        source: 'MesloLGS NF Regular.ttf',
        target: 'MesloLGS-NF-Regular.ttf',
        sha256: 'd97946186e97f8d7c0139e8983abf40a1d2d086924f2c5dbf1c29bd8f2c6e57d',
    },
    {
        source: 'MesloLGS NF Italic.ttf',
        target: 'MesloLGS-NF-Italic.ttf',
        sha256: '6f357bcbe2597704e157a915625928bca38364a89c22a4ac36e7a116dcd392ef',
    },
    {
        source: 'MesloLGS NF Bold.ttf',
        target: 'MesloLGS-NF-Bold.ttf',
        sha256: 'b6c0199cf7c7483c8343ea020658925e6de0aeb318b89908152fcb4d19226003',
    },
    {
        source: 'MesloLGS NF Bold Italic.ttf',
        target: 'MesloLGS-NF-Bold-Italic.ttf',
        sha256: '56b4131adecec052c4b324efb818dd326d586dbc316fc68f98f1cae2eb8d1220',
    },
    {
        source: 'MesloLGS NF License.txt',
        target: 'MesloLGS-NF-License.txt',
        sha256: '0eb25f1a4e86320ceae5f650cb75e628117c3f575bc2e332bb13cd08c3be438e',
    },
];

function sha256(data) {
    return createHash('sha256').update(data).digest('hex');
}

async function validExistingAsset(asset) {
    try {
        return sha256(await readFile(resolve(targetDirectory, asset.target))) === asset.sha256;
    } catch (error) {
        if (error?.code === 'ENOENT') {
            return false;
        }
        throw error;
    }
}

if ((await Promise.all(assets.map(validExistingAsset))).every(Boolean)) {
    console.log('Verified JetBrains Mono v2.304 assets.');
} else {
    const temporaryDirectory = await mkdtemp(join(tmpdir(), 'interlis-editor-fonts-'));
    const archivePath = join(temporaryDirectory, 'JetBrainsMono-2.304.zip');

    try {
        const response = await fetch(archiveUrl, {
            headers: { 'user-agent': 'interlis-editor-build' },
            redirect: 'follow',
        });
        if (!response.ok) {
            throw new Error(`Failed to download JetBrains Mono: ${response.status} ${response.statusText}`);
        }

        const archive = Buffer.from(await response.arrayBuffer());
        if (sha256(archive) !== archiveSha256) {
            throw new Error(`JetBrains Mono archive hash mismatch: expected ${archiveSha256}`);
        }
        await writeFile(archivePath, archive);
        await mkdir(targetDirectory, { recursive: true });

        for (const asset of assets) {
            const { stdout } = await execFileAsync('unzip', ['-p', archivePath, asset.source], {
                encoding: null,
                maxBuffer: 1024 * 1024,
            });
            const data = Buffer.from(stdout);
            if (sha256(data) !== asset.sha256) {
                throw new Error(`JetBrains Mono asset hash mismatch for ${asset.source}: expected ${asset.sha256}`);
            }
            await writeFile(resolve(targetDirectory, asset.target), data);
        }
        console.log('Verified JetBrains Mono v2.304 assets.');
    } finally {
        await rm(temporaryDirectory, { recursive: true, force: true });
    }
}

if ((await Promise.all(mesloAssets.map(validExistingAsset))).every(Boolean)) {
    console.log(`Verified MesloLGS NF assets from ${mesloCommit}.`);
} else {
    await mkdir(targetDirectory, { recursive: true });
    for (const asset of mesloAssets) {
        const response = await fetch(`${mesloBaseUrl}/${encodeURIComponent(asset.source)}`, {
            headers: { 'user-agent': 'interlis-editor-build' },
            redirect: 'follow',
        });
        if (!response.ok) {
            throw new Error(`Failed to download MesloLGS NF asset ${asset.source}: ${response.status} ${response.statusText}`);
        }
        const data = Buffer.from(await response.arrayBuffer());
        if (sha256(data) !== asset.sha256) {
            throw new Error(`MesloLGS NF asset hash mismatch for ${asset.source}: expected ${asset.sha256}`);
        }
        await writeFile(resolve(targetDirectory, asset.target), data);
    }
    console.log(`Verified MesloLGS NF assets from ${mesloCommit}.`);
}
