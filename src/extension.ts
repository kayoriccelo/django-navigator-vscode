
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Função chamada quando a extensão é ativada.
 */
export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('django-navigator.goToUrl', () => {
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            const document = editor.document;
            const cursorPosition = editor.selection.active;
            const currentLineText = document.lineAt(cursorPosition.line).text.trim();

            // Regex para capturar a tag URL
            const urlTagRegex = /{% url '([^']+)'(?:\s+([^%]+))? %}/;
            const match = urlTagRegex.exec(currentLineText);

            if (match) {
                const urlName = match[1];
                const namespaces = urlName.split(':');

                // Procura todos os arquivos urls.py no projeto
                vscode.workspace.findFiles('**/urls.py').then(files => {
                    if (files.length > 0) {
                        let foundUrlFile: vscode.Uri | null = null;

                        // Itera sobre cada arquivo urls.py
                        const filePromises = files.map(file => {
                            return new Promise<void>((resolve) => {
                                fs.readFile(file.fsPath, 'utf8', (err, data) => {
                                    if (err) {
                                        vscode.window.showErrorMessage(`Erro ao ler o arquivo: ${file.fsPath}`);
                                        resolve();
                                        return;
                                    }

                                    const dirPath = path.dirname(file.fsPath);

                                    // Verifica se o arquivo contém o namespace correspondente ou a URL
                                    let foundNamespace = namespaces.every((namespace, index) => {
                                        const isLastNamespace = index === namespaces.length - 1;
                                        return (
                                            (isLastNamespace && data.includes(`name='${namespace}'`)) ||
                                            (data.includes(`app_name = '${namespace}'`) || dirPath.includes(namespace.replace(/_/g, '-')))
                                        );
                                    });

                                    if (foundNamespace) {
                                        foundUrlFile = file;
                                    }

                                    resolve();
                                });
                            });
                        });

                        // Espera até que todos os arquivos sejam verificados
                        Promise.all(filePromises).then(() => {
                            if (foundUrlFile) {
                                vscode.workspace.openTextDocument(foundUrlFile).then(doc => {
                                    vscode.window.showTextDocument(doc).then(editor => {
                                        highlightUrlInFile(editor, urlName);
                                    });
                                });
                            } else {
                                vscode.window.showErrorMessage(`Nenhuma URL correspondente encontrada para '${urlName}'.`);
                            }
                        });
                    } else {
                        vscode.window.showErrorMessage('Arquivo urls.py não encontrado em nenhuma pasta.');
                    }
                });
            } else {
                vscode.window.showErrorMessage('Selecione uma tag URL válida.');
            }
        }
    });

    context.subscriptions.push(disposable);
}

/**
 * Função para destacar a linha que contém a URL no editor.
 */
function highlightUrlInFile(editor: vscode.TextEditor, urlName: string) {
    const document = editor.document;
    const namespaces = urlName.split(':');
    let isAppName = false;

    for (let i = 0; i < namespaces.length; i++) {
        for (let line = 0; line < document.lineCount; line++) {
            const textLine = document.lineAt(line);

            // Verifica se a linha contém o nome do namespace ou o nome da URL
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
