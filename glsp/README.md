# INTERLIS GLSP Modules

This directory will hold the diagramming functionality powered by the Graphical
Language Server Platform (GLSP). The structure is split into a Java-based server
component and a TypeScript client component so we can integrate the diagrams into
Theia as well as other web frontends.

```
glsp/
├── server/    # Java server side GLSP implementation
└── client/    # TypeScript client widgets and integration glue
```

At this stage we only provide placeholder build files. The actual diagram
implementation will be added alongside the UML-style class diagram tooling.
