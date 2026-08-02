# INTERLIS Editor

**INTERLIS Editor** is a dedicated desktop application for modelling INTERLIS
models. It is composed as a small Eclipse Theia product and ships the current,
Java-free
[`edigonzales.interlis-language-tools`](https://open-vsx.org/extension/edigonzales/interlis-language-tools)
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
├── vscode-extensions/interlis-editor-themes/
│                                           Local theme extension manifest/license
├── scripts/                               Asset, theme, consistency and upgrade tools
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
- The VS Code 2026 themes remain a normal VS Code theme extension. Their source
  files are downloaded from a pinned VS Code release and placed in `plugins/`.
- Only the INTERLIS tooling, the product themes, and the selected JSON, Git,
  Markdown, XML, YAML, search, diff, conflict, and icon/theme support are
  bundled. Other language support and development tooling can be installed from
  Open VSX when needed.
- Eclipse Theia itself is consumed only as versioned npm packages. No Theia
  source files are patched or copied into this repository.

## Prerequisites

- Node.js 22
- Yarn 1.22.22
- A platform supported by Electron

The bundled INTERLIS Language Tools extension provides its own language-service
runtime. A separate local Java installation is therefore not part of this
product build.

## Build and run

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
yarn install
yarn verify
yarn fonts
yarn download:plugins
yarn verify:plugins
yarn build
yarn start
```

Der komplette Installations-, Verifikations-, Build- und Packaging-Ablauf kann
alternativ mit einem einzigen Script gestartet werden:

```bash
./scripts/build.sh
```

Das Script erzeugt unter Linux das bestehende Preview-Paket aus
`yarn package:preview`; auf macOS und Windows wird das native Plattformpaket
gebaut. Über `yarn build:all` ist derselbe Ablauf ebenfalls verfügbar.

Für einen schnellen lokalen Build und Start ohne DMG, ZIP oder Installer:

```bash
./scripts/start-editor.sh
```

Alternativ:

```bash
yarn start:dev
```

### macOS-Sicherheitshinweis

Die macOS-Pakete werden ohne Apple-Zertifikat ad-hoc signiert. Beim ersten
Start kann macOS deshalb weiterhin eine Gatekeeper-Warnung anzeigen. Falls
die App nicht direkt geöffnet wird, die App einmal starten und anschließend in
`Systemeinstellungen > Datenschutz & Sicherheit` mit `Dennoch öffnen` bzw.
`Open Anyway` freigeben.

Die Ad-hoc-Signatur schafft keine Apple-Vertrauensstellung und ersetzt weder
ein Developer-ID-Zertifikat noch die Notarisierung. Für eine vollständig
vertrauenswürdige Verteilung wären diese weiterhin erforderlich.

Eine Datei oder ein Workspace kann direkt mitgegeben werden. Dateien werden als Editor-Datei geöffnet, Verzeichnisse als Workspace:

```bash
./scripts/start-editor.sh examples/MinimalModel.ili
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
- `ililogo1024.png` — welcome-page and About-dialog logo
- `interlis-app-icon.icns` — macOS/Dock application icon from the pinned INTERLIS icon commit
- `interlis-app-icon.png` — Windows/Linux application icon from the same commit

The downloaded files are generated build inputs and are ignored by Git. Changing
a source URL or hash requires an explicit edit in
`scripts/fetch-branding-assets.mjs`.

JetBrains Mono v2.304 is downloaded from its pinned official release, validated
by checksum and bundled with the Product Extension. It remains the default
editor font and its OFL-1.1 license is bundled alongside the font files.

MesloLGS NF is downloaded from the pinned Powerlevel10k media commit, validated
by checksum and bundled as the default font for the integrated terminal. The
four TTF styles and the upstream Apache-2.0 license are included in the
Product Extension. The font is available inside the desktop application on
macOS, Windows and Linux; it is not installed as a system font for external
terminal applications.

## Light and dark themes

The editor bundles the official **Dark 2026** and **Light 2026** color themes
from VS Code 1.124.2. Dark 2026 is the product default; both themes remain
selectable through the normal Theia color-theme command.

`yarn themes` downloads the complete inheritance chains from the pinned VS Code
tag and validates every file against its Git blob SHA-1. The generated extension
is written to `plugins/interlis-editor-themes` and is packaged with the desktop
application. The Microsoft MIT license is included in the extension.

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
the application shell, branding or themes are not pinned, or the product name
changes.

## Validation

The GitHub Actions workflow performs:

1. project and version consistency checks;
2. cryptographic validation of both downloaded branding assets;
3. download and inspection of the built-in INTERLIS extension;
4. download and cryptographic validation of Dark 2026 and Light 2026;
5. TypeScript compilation of the custom Product Extension;
6. production Theia/Electron build;
7. Electron packaging to an unpacked Linux application;
8. command-line and graphical startup smoke tests using an example `.ili` file.

## License

MIT. See [LICENSE](LICENSE).
