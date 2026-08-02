import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceCommit = '7debf6e99628972b418b485d47d96e0118c2e92a';

const assets = [
    {
        name: 'oldinterlis.png',
        url: `https://raw.githubusercontent.com/edigonzales/interlis-ide/${sourceCommit}/applications/electron/resources/oldinterlis.png`,
        gitBlobSha1: '0079e36663dbb2cc126cd10b568c07075bef666a',
        targets: [
            'applications/electron/resources/branding/oldinterlis.png',
        ],
    },
    {
        name: 'ililogo1024.png',
        url: `https://raw.githubusercontent.com/edigonzales/interlis-ide/${sourceCommit}/applications/electron/resources/ililogo1024.png`,
        gitBlobSha1: 'c130c2e5af2949a306d2c10ac53004a75fc11857',
        targets: [
            'applications/electron/resources/branding/ililogo1024.png',
            'theia-extensions/interlis-editor-product/src/browser/style/ililogo1024.png',
        ],
    },
    {
        name: 'interlis-app-icon.icns',
        url: `https://raw.githubusercontent.com/edigonzales/interlis-ide/bbecd90c7380ad42bd7bcc6ea93d7973148127eb/applications/electron/resources/icons/MacLauncherIcons/icon.icns`,
        gitBlobSha1: 'fe0efefa58236d01b664f2083c0ebfeb14ecae6d',
        targets: [
            'applications/electron/resources/branding/interlis-app-icon.icns',
        ],
    },
    {
        name: 'interlis-app-icon.png',
        url: `https://raw.githubusercontent.com/edigonzales/interlis-ide/bbecd90c7380ad42bd7bcc6ea93d7973148127eb/applications/electron/resources/icons/MacLauncherIcons/icon.icon/Assets/icon.png`,
        gitBlobSha1: '77f6a730c7c6eccaf33f5ebb39fcdfa5932bda87',
        targets: [
            'applications/electron/resources/branding/interlis-app-icon.png',
        ],
    },
];

function gitBlobSha1(data) {
    const header = Buffer.from(`blob ${data.length}\0`, 'utf8');
    return createHash('sha1').update(header).update(data).digest('hex');
}

async function validExistingFile(path, expectedSha) {
    try {
        return gitBlobSha1(await readFile(path)) === expectedSha;
    } catch (error) {
        if (error?.code === 'ENOENT') {
            return false;
        }
        throw error;
    }
}

async function download(asset) {
    const firstTarget = resolve(root, asset.targets[0]);
    if (await validExistingFile(firstTarget, asset.gitBlobSha1)) {
        return readFile(firstTarget);
    }

    const response = await fetch(asset.url, {
        headers: { 'user-agent': 'interlis-editor-build' },
        redirect: 'follow',
    });
    if (!response.ok) {
        throw new Error(`Failed to download ${asset.name}: ${response.status} ${response.statusText}`);
    }

    const data = Buffer.from(await response.arrayBuffer());
    const actualSha = gitBlobSha1(data);
    if (actualSha !== asset.gitBlobSha1) {
        throw new Error(`Hash mismatch for ${asset.name}: expected ${asset.gitBlobSha1}, got ${actualSha}`);
    }
    return data;
}

for (const asset of assets) {
    const data = await download(asset);
    for (const relativeTarget of asset.targets) {
        const target = resolve(root, relativeTarget);
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, data);
        const writtenSha = gitBlobSha1(await readFile(target));
        if (writtenSha !== asset.gitBlobSha1) {
            throw new Error(`Verification after write failed for ${relativeTarget}`);
        }
    }
    console.log(`Verified ${asset.name} (${asset.gitBlobSha1})`);
}
