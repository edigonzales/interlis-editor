package ch.interlis.lsp;

import java.util.concurrent.CompletableFuture;

import org.eclipse.lsp4j.ExecuteCommandParams;
import org.eclipse.lsp4j.services.WorkspaceService;

/**
 * Minimal workspace service placeholder. Commands will be registered in later
 * iterations to drive model transformations and diagram interactions.
 */
public class InterlisWorkspaceService implements WorkspaceService {

    @Override
    public void didChangeConfiguration(org.eclipse.lsp4j.DidChangeConfigurationParams params) {
        // Configuration handling can be wired up once the client exposes settings.
    }

    @Override
    public void didChangeWatchedFiles(org.eclipse.lsp4j.DidChangeWatchedFilesParams params) {
        // React to external file changes here when needed.
    }

    @Override
    public CompletableFuture<Object> executeCommand(ExecuteCommandParams params) {
        return CompletableFuture.completedFuture(null);
    }
}
