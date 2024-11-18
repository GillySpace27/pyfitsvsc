import * as vscode from 'vscode';
import * as path from 'path';

let logger: vscode.OutputChannel;

// Function to log messages to the output channel
function log(message: string): void {
  logger.appendLine(message);
}

export function activate(context: vscode.ExtensionContext) {
  // Initialize the output channel
  logger = vscode.window.createOutputChannel('FITS Preview');
  logger.show(true); // Show the output channel immediately

  log('Activating the extension.');

  let disposable = vscode.commands.registerCommand('pyfitsvsc.openPreview', async (uri: vscode.Uri) => {
    log(`Command 'pyfitsvsc.openPreview' called with URI: ${uri.toString()}`);

    try {
      const panel = vscode.window.createWebviewPanel(
        'fitsPreview',
        'Preview FITS File',
        vscode.ViewColumn.One,
        {
          enableScripts: true
        }
      );
      log('Webview panel created.');

      const localFilePath = uri.fsPath;
      log(`Local file path: ${localFilePath}`);

      const flaskServerUrl = `http://127.0.0.1:5000/preview_rendered?file=${encodeURIComponent(localFilePath)}&extname=-1`;
      log(`Flask server URL: ${flaskServerUrl}`);

      panel.webview.html = getWebviewContent(flaskServerUrl);
      log('Webview content set.');
    } catch (error: any) {
      log(`Error in openPreview command: ${error.message}`);
      log(`Stack trace: ${error.stack}`);
      vscode.window.showErrorMessage(`Failed to open FITS preview: ${error.message}`);
    }
  });

  context.subscriptions.push(disposable);
  log('Disposable added to context subscriptions.');
}

function getWebviewContent(url: string): string {
  log(`Generating webview content for URL: ${url}`);
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FITS File Preview</title>
      <style>
        body { margin: 0; padding: 0; overflow: hidden; height: 100vh; }
        iframe { border: none; width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <iframe src="${url}"></iframe>
    </body>
    </html>
  `;
}

export function deactivate() {
  if (logger) {
    log('Deactivating the extension.');
    logger.dispose();
  }
}
