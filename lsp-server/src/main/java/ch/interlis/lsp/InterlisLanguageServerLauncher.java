package ch.interlis.lsp;

import java.io.IOException;

import org.eclipse.lsp4j.jsonrpc.Launcher;
import org.eclipse.lsp4j.services.LanguageClient;

/**
 * Bootstraps the INTERLIS language server from stdio. The VS Code extension as
 * well as the Theia integration can start the server using this entry point.
 */
public final class InterlisLanguageServerLauncher {

    private InterlisLanguageServerLauncher() {
    }

    public static void main(String[] args) throws IOException {
        InterlisLanguageServer server = new InterlisLanguageServer();
        Launcher<LanguageClient> launcher = new Launcher.Builder<LanguageClient>()
                .setLocalService(server)
                .setRemoteInterface(LanguageClient.class)
                .setInput(System.in)
                .setOutput(System.out)
                .create();
        server.connect(launcher.getRemoteProxy());
        launcher.startListening();
    }
}
