# INTERLIS Language Server

This module holds the Java based language server that powers the INTERLIS editor
experience. The project is configured as a Maven application with an executable
JAR assembly so that both the Theia and VS Code clients can spawn it easily.

## Building

```bash
mvn package
```

This produces `target/interlis-language-server-0.1.0-SNAPSHOT-jar-with-dependencies.jar`
which exposes the `ch.interlis.lsp.InterlisLanguageServerLauncher` main class.

## Development Notes

* Java 17 is configured as the baseline.
* `org.eclipse.lsp4j` provides the protocol implementation.
* The current implementation only publishes a placeholder diagnostic when a
  document is opened. Further validation and completion logic can be added under
  `src/main/java`.
