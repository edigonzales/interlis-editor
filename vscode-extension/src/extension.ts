import * as path from 'path';
import * as vscode from 'vscode';
import {
  Executable,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions
} from 'vscode-languageclient/node';

let client: LanguageClient | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const jarPath = context.asAbsolutePath(path.join('server', 'interlis-language-server.jar'));

  const serverOptions: ServerOptions = (): Executable => ({
    command: 'java',
    args: ['-jar', jarPath],
    options: { cwd: context.extensionPath }
  });

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'ili' }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/*.ili')
    }
  };

  client = new LanguageClient('interlisLanguageClient', 'INTERLIS Language Client', serverOptions, clientOptions);
  context.subscriptions.push(client.start());
}

export async function deactivate(): Promise<void> {
  if (client) {
    await client.stop();
    client = undefined;
  }
}
