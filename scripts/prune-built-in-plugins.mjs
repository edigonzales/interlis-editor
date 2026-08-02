import { readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allowedPluginDirectories } from './builtin-plugin-policy.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const pluginsDir = resolve(root, 'plugins');
const allowed = new Set(allowedPluginDirectories);

let entries;
try {
    entries = await readdir(pluginsDir, { withFileTypes: true });
} catch (error) {
    if (error?.code === 'ENOENT') {
        console.log('No generated plugins directory found; nothing to prune.');
        process.exit(0);
    }
    throw error;
}

for (const entry of entries) {
    if (allowed.has(entry.name)) {
        continue;
    }
    await rm(resolve(pluginsDir, entry.name), { recursive: true, force: true });
    console.log(`Pruned built-in plugin ${entry.name}.`);
}
