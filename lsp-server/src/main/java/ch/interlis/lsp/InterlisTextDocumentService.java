package ch.interlis.lsp;

import java.util.Collections;
import java.util.concurrent.CompletableFuture;

import org.eclipse.lsp4j.Diagnostic;
import org.eclipse.lsp4j.DiagnosticSeverity;
import org.eclipse.lsp4j.DidChangeTextDocumentParams;
import org.eclipse.lsp4j.DidCloseTextDocumentParams;
import org.eclipse.lsp4j.DidOpenTextDocumentParams;
import org.eclipse.lsp4j.DidSaveTextDocumentParams;
import org.eclipse.lsp4j.Position;
import org.eclipse.lsp4j.PublishDiagnosticsParams;
import org.eclipse.lsp4j.Range;
import org.eclipse.lsp4j.WillSaveTextDocumentParams;
import org.eclipse.lsp4j.services.LanguageClient;
import org.eclipse.lsp4j.services.TextDocumentService;

/**
 * Placeholder implementation that simply notifies the client about missing
 * validation logic. Diagnostics can be populated with simple warnings to verify
 * end-to-end communication.
 */
public class InterlisTextDocumentService implements TextDocumentService {

    private LanguageClient client;

    void setClient(LanguageClient client) {
        this.client = client;
    }

    @Override
    public void didOpen(DidOpenTextDocumentParams params) {
        if (client == null) {
            return;
        }
        Diagnostic diagnostic = new Diagnostic(
                new Range(new Position(0, 0), new Position(0, 1)),
                "INTERLIS analysis not implemented yet",
                DiagnosticSeverity.Warning,
                "interlis-lsp");
        PublishDiagnosticsParams diagnostics = new PublishDiagnosticsParams();
        diagnostics.setUri(params.getTextDocument().getUri());
        diagnostics.setDiagnostics(Collections.singletonList(diagnostic));
        client.publishDiagnostics(diagnostics);
    }

    @Override
    public void didChange(DidChangeTextDocumentParams params) {
        // Placeholder for incremental parsing logic.
    }

    @Override
    public void willSave(WillSaveTextDocumentParams params) {
        // Hook for pre-save validation.
    }

    @Override
    public CompletableFuture<java.util.List<org.eclipse.lsp4j.TextEdit>> willSaveWaitUntil(WillSaveTextDocumentParams params) {
        return CompletableFuture.completedFuture(Collections.emptyList());
    }

    @Override
    public void didClose(DidCloseTextDocumentParams params) {
        if (client != null) {
            client.publishDiagnostics(new PublishDiagnosticsParams(params.getTextDocument().getUri(), Collections.emptyList()));
        }
    }

    @Override
    public void didSave(DidSaveTextDocumentParams params) {
        // Placeholder for validation logic.
    }
}
