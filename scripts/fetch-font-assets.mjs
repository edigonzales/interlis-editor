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
    process.exit(0);
}

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
