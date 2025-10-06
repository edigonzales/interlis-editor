# Interlis Theia Application

This package contains a minimal Eclipse Theia desktop application. The dependencies
cover the default file navigation, workspace management, Monaco-based editor and
terminal support. It also wires in the Electron distribution so we can package
the application as a standalone desktop editor in later iterations.

## Development

Install dependencies and build the application:

```bash
yarn install
yarn build
```

Start the desktop application:

```bash
yarn start:electron
```

During early development it is often sufficient to run the browser-based version:

```bash
yarn start
```

Additional Theia extensions and custom functionality can be added by editing the
`package.json` dependencies. We will introduce workspaces for the custom
INTERLIS functionality in subsequent steps.
