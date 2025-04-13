                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        import * as vscode from 'vscode';
import { promises as fs } from 'fs';

/**
 * Represents extracted information from a Django urls.py file.
 * - file: Path to the urls.py file
 * - appName: Django app name, if defined using app_name
 * - namespaces: List of namespaces defined via include(..., namespace='...')
 * - names: List of route names defined using name='...'
 */
type UrlInfo = {
    file: vscode.Uri;
    appName?: string;
    namespaces: string[];
    names: string[];
};

/**
 * Searches all urls.py files in the workspace and attempts to resolve the given namespace path.
 *
 * @param namespaces - Array of namespace segments from a Django URL tag (e.g., ['app', 'route'])
 * @returns A promise that resolves when the corresponding URL definition is found and highlighted
 */
async function searchInFiles(namespaces: any) {
    const files = await vscode.workspace.findFiles('**/urls.py');
    const urlFilesMap: Record<string, UrlInfo[]> = {};

    for (const file of files) {
        try {
            const data = await fs.readFile(file.fsPath, 'utf8');

            const appNameMatch = data.match(/app_name\s*=\s*['"]([^'"]+)['"]/);
            const includeNamespaceMatches = [...data.matchAll(/include\([^)]*namespace\s*=\s*['"]([^'"]+)['"]/g)];
            const namedUrlMatches = [...data.matchAll(/name\s*=\s*['"]([^'"]+)['"]/g)];

            const appName = appNameMatch?.[1];
            const namespacesFound = includeNamespaceMatches.map(m => m[1]);
            const names = namedUrlMatches.map(m => m[1]);

            if (appName || namespacesFound.length || names.length) {
                const info: UrlInfo = {
                    file,
                    appName,
                    namespaces: namespacesFound,
                    names
                };

                const keys = [appName, ...namespacesFound].filter(Boolean) as string[];

                for (const key of keys) {
                    if (!urlFilesMap[key]) {
                        urlFilesMap[key] = [];
                    }
                    urlFilesMap[key].push(info);
                }
            }
        } catch (err) {
            console.error(`Error reading ${file.fsPath}:`, err);
        }
    }

    const location = resolveUrlPath(namespaces, urlFilesMap);
    return location ?? null;
}

/**
 * Resolves the full URL path based on namespaces and names found in urls.py files.
 * If found, it opens and highlights the corresponding line in the file.
 *
 * @param namespaces - The namespace path as an array of strings
 * @param urlFilesMap - A map of namespaces/app names to their corresponding UrlInfo entries
 */
function resolveUrlPath(namespaces: string[], urlFilesMap: Record<string, UrlInfo[]>) {
    let currentInfos = urlFilesMap[namespaces[0]];

    if (!currentInfos || currentInfos.length === 0) {
        vscode.window.showErrorMessage(`Namespace or app_name '${namespaces[0]}' not found.`);
        return;
    }

    for (let i = 1; i < namespaces.length; i++) {
        const ns = namespaces[i];

        const possibleMatches = currentInfos.filter(info =>
            info.names.includes(ns) || info.namespaces.includes(ns)
        );

        if (i === namespaces.length - 1) {
            const match = possibleMatches.find(info => info.names.includes(ns));
            if (match) {
                vscode.workspace.openTextDocument(match.file).then(doc => {
                    vscode.window.showTextDocument(doc).then(editor => {
                        highlightUrlInFile(editor, ns);
                    });
                });
                return;
            }
        }

        currentInfos = urlFilesMap[ns];

        if (!currentInfos || currentInfos.length === 0) {
            vscode.window.showErrorMessage(`Intermediate namespace '${ns}' not found.`);
            return;
        }
    }

    vscode.window.showErrorMessage(`Failed to resolve complete URL path.`);
}

/**
 * Highlights the line in the file where the URL with the specified name is defined.
 *
 * @param editor - The VS Code text editor instance
 * @param urlName - The final segment of the Django URL name to highlight
 */
function highlightUrlInFile(editor: vscode.TextEditor, urlName: string) {
    const document = editor.document;
    const namespaces = urlName.split(':');
    let isAppName = false;

    for (let i = 0; i < namespaces.length; i++) {
        for (let line = 0; line < document.lineCount; line++) {
            const textLine = document.lineAt(line);

            if (isAppName || textLine.text.includes(namespaces[i])) {
                isAppName = true;

                if (textLine.text.includes(`name='${namespaces[i]}'`) || textLine.text.includes(namespaces[i])) {
                    editor.selection = new vscode.Selection(line, 0, line, textLine.text.length);
                    editor.revealRange(new vscode.Range(line, 0, line, 0));
                    break;
                }
            }
        }
    }
}

/**
 * Activates the extension and registers commands and providers.
 *
 * @param context - The extension context provided by VS Code
 */
export function activate(context: vscode.ExtensionContext) {
    // Command available in the Command Palette: "Django Navigator: Go to URL"
    const disposable = vscode.commands.registerCommand('django-navigator.goToUrl', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const document = editor.document;
        const cursorPosition = editor.selection.active;
        const currentLineText = document.lineAt(cursorPosition.line).text.trim();

        // Regex to match Django URL tag: {% url 'namespace:name' param %}
        const urlTagRegex = /{% url '([^']+)'(?:\s+([^%]+))? %}/;
        const match = urlTagRegex.exec(currentLineText);

        if (!match) {
            vscode.window.showErrorMessage("Please select a valid Django URL tag. Example: {% url 'app:name' %}");
            return;
        }

        const urlName = match[1];
        const namespaces = urlName.split(':');

        searchInFiles(namespaces);
    });

    context.subscriptions.push(disposable);

    // Enables navigation to URL definitions via Ctrl+Click in HTML or Django templates
    const provider = vscode.languages.registerDefinitionProvider(
        [
            { scheme: 'file', language: 'html' },
            { scheme: 'file', language: 'django-html' }
        ],
        {
            async provideDefinition(document, position, token) {
                const editor = vscode.window.activeTextEditor;

                if (!editor || editor.document.uri.toString() !== document.uri.toString()) {
                    return null;
                }

                const lineText = document.lineAt(position.line).text.trim();
                const urlTagRegex = /{% url '([^']+)'(?:\s+([^%]+))? %}/;
                const match = urlTagRegex.exec(lineText);

                if (!match) {
                    return;
                }

                const urlName = match[1];
                const namespaces = urlName.split(':');

                return await searchInFiles(namespaces);
            }
        }
    );

    context.subscriptions.push(provider);
}
