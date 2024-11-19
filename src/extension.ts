import * as vscode from 'vscode';

let logger: vscode.OutputChannel;

// Function to log messages to the output channel
function log(message: string): void {
  logger.appendLine(message);
}

// Function to get the current time in milliseconds
function getCurrentTimeMillis(): number {
  const [seconds, nanoseconds] = process.hrtime();
  return seconds * 1000 + nanoseconds / 1e6;
}

// Custom Editor Provider
class FitsFileEditorProvider implements vscode.CustomTextEditorProvider {
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new FitsFileEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(FitsFileEditorProvider.viewType, provider, {
        webviewOptions: {
            retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: true,
    });
    return providerRegistration;
  }

  private static readonly viewType = 'pyfitsvsc.fitsFileEditor';

  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel, _token: vscode.CancellationToken): Promise<void> {
    const startTime = getCurrentTimeMillis();
    log(`Opening .fits file as custom editor: ${document.uri.toString()}`);

    webviewPanel.webview.options = {
      enableScripts: true
    };

    const localFilePath = document.uri.fsPath;
    log(`Local file path: ${localFilePath}`);

    const flaskServerUrl = `http://127.0.0.1:5000/preview_rendered?file=${encodeURIComponent(localFilePath)}&extname=-1`;
    log(`Flask server URL: ${flaskServerUrl}`);

    const fetchStartTime = getCurrentTimeMillis();
    // Mockup example of server request timing (assuming here you would fetch something).
    // const response = await fetch(flaskServerUrl);
    // const fetchEndTime = getCurrentTimeMillis();

    const renderStartTime = getCurrentTimeMillis();
    webviewPanel.webview.html = getWebviewContent(flaskServerUrl);
    const renderEndTime = getCurrentTimeMillis();
    log(`Server request time: ${(fetchStartTime - startTime).toPrecision(4)} ms`);
    log(`Webview content setting time: ${(renderEndTime - renderStartTime).toPrecision(4)} ms`);
    log(`Total time: ${(renderEndTime - startTime).toPrecision(4)} ms`);


    log('Webview content set.');
  }
}

export function activate(context: vscode.ExtensionContext) {
  // Initialize the output channel
  logger = vscode.window.createOutputChannel('FITS Preview');
  logger.show(true); // Show the output channel immediately

  log('Activating the extension.');

  context.subscriptions.push(FitsFileEditorProvider.register(context));
  log('Custom editor provider registered for FITS files.');
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
    body { margin: 0; padding: 0; overflow: hidden; height: 100vh; display: flex; justify-content: center; align-items: center; }
    iframe.centered { border: none; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <iframe class="centered" src="${url}"></iframe>
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
