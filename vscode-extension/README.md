# INTERLIS VS Code Extension

This folder contains the VS Code client implementation for the INTERLIS language
server. The extension starts the server JAR from the `server/` directory when an
`.ili` file is opened and wires it up through the `vscode-languageclient` library.

## Getting Started

```bash
yarn install
yarn run compile
```

The compiled output is written to `out/`. A packaged server JAR should be copied
into `server/interlis-language-server.jar` (the build pipeline can automate this
step).

## Development Notes

* Activation happens on the custom `ili` language.
* Syntax highlighting is provided through a minimal TextMate grammar.
* The extension exports `activate` and `deactivate` helpers for integration tests.
