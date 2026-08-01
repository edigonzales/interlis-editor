# INTERLIS Editor

**INTERLIS Editor** is a dedicated desktop application for modelling INTERLIS
models. It is composed as a small Eclipse Theia product and ships the existing
[`edigonzales.interlis-editor`](https://open-vsx.org/extension/edigonzales/interlis-editor)
VS Code extension as a built-in extension, so end users do not have to install it.

This repository is a fresh implementation. It does not copy or fork the older
`interlis-ide` application. The project follows the composition pattern of the
official Eclipse Theia IDE template at commit
`208ea0ec23bc738801d57c890bf21cd278f77896` (Theia 1.74.0).

## Architecture

```text
interlis-editor/
├── applications/electron/                 Thin Electron product shell
├── theia-extensions/interlis-editor-product/
│   └── src/browser/                       All product-specific UI code
├── scripts/                               Asset, consistency and upgrade tools
├── examples/                              Smoke-test workspace
└── plugins/                               Generated built-in extensions
```

The separation is deliberate:

- The application package contains only Theia composition, Electron packaging,
  startup resources and the application launcher.
- Product branding, the welcome page and the About dialog live exclusively in
  `interlis-editor-product-ext`.
- The INTERLIS language tooling remains a normal VS Code extension and is
  downloaded from Open VSX during the build.
- Eclipse Theia itself is consumed only as versioned npm packages. No Theia
  source files are patched or copied into this repository.

## Prerequisites

- Node.js 22
- Yarn 1.22.22
- A platform supported by Electron

The published INTERLIS extension provides its own language-server runtime. A
separate local Java installation is therefore not part of this product build.

## Build and run

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
yarn install
yarn verify
yarn download:plugins
yarn verify:plugins
yarn build
yarn start
```

Create an unpacked desktop application for the current platform:

```bash
yarn package:preview
```

## Branding assets

The project intentionally does not duplicate binary files from the older
repository in Git history. `yarn assets` downloads the two requested images from
a pinned commit of `edigonzales/interlis-ide` and validates their Git blob SHA-1
before using them:

- `oldinterlis.png` — Electron splash screen
- `ililogo1024.png` — application icon, welcome-page logo and About-dialog logo

The downloaded files are generated build inputs and are ignored by Git. Changing
a source URL or hash requires an explicit edit in
`scripts/fetch-branding-assets.mjs`.

## Updating Eclipse Theia

All direct `@theia/*` dependencies must use one identical, exact version. Update
them together:

```bash
yarn update:theia 1.75.0
yarn install
yarn verify
yarn download:plugins
yarn build
yarn package:preview
```

`yarn verify` fails when Theia packages diverge, custom product code leaks into
the application shell, branding is not pinned, or the product name changes.

## Validation

The GitHub Actions workflow performs:

1. project and version consistency checks;
2. cryptographic validation of both downloaded branding assets;
3. download and inspection of the built-in INTERLIS extension;
4. TypeScript compilation of the custom Product Extension;
5. production Theia/Electron build;
6. Electron packaging to an unpacked Linux application;
7. command-line and graphical startup smoke tests using an example `.ili` file.

## License

MIT. See [LICENSE](LICENSE).
