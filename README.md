# INTERLIS Editor Workspace

This repository aggregates the components required to build a dedicated INTERLIS
modeling environment based on Eclipse Theia, an existing Java language server and
forthcoming GLSP-powered diagramming support.

## Repository Layout

- `theia-app/` – Minimal Eclipse Theia desktop application that will host the
  INTERLIS tooling.
- `lsp-server/` – Java (lsp4j) language server implementation with a placeholder
  diagnostic pipeline and an example `.ili` model.
- `vscode-extension/` – VS Code client extension configured to launch the language
  server and provide a basic syntax definition for `.ili` files.
- `glsp/` – Placeholder structure for future GLSP-based UML class diagram support.

Each sub-project contains its own build instructions and can evolve
independently while sharing the same repository.

## Next Steps

1. Wire the existing language server implementation into the Theia application
   by packaging it as a Theia backend extension.
2. Implement the GLSP server and client modules to provide interactive diagram
   editing synchronized with INTERLIS models.
3. Automate distribution builds so end-users can install a pre-packaged desktop
   editor without manual dependency setup.
