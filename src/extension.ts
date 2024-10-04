import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Função chamada quando a extensão é ativada.
 * Registra o comando 'django-navigator.goToUrl'.
 * O comando busca arquivos urls.py no projeto e destaca a URL correspondente no editor.
 * 
 * @param context - O contexto da extensão fornecido pelo VSCode.
 */

export function activate(context: vscode.ExtensionContext) {
    // Registra o comando

    let disposable = vscode.commands.registerCommand('django-navigator.goToUrl', () => {
        // Obtém o editor de texto ativo
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            const document = editor.document; // Obtém o documento atual
            const cursorPosition = editor.selection.active; // Obtém a posição do cursor
            const currentLineText = document.lineAt(cursorPosition.line).text.trim(); // Obtém o texto da linha onde o cursor está

            // Verifica se a seleção é uma tag {% url %}
            const urlTagRegex = /{% url '([^']+)'(?:\s+([^%]+))? %}/; // Regex para capturar a tag URL
            const match = urlTagRegex.exec(currentLineText); // Executa a regex no texto selecionado

            if (match) {
                const urlName = match[1]; // Extrai o nome da URL da correspondência
                let names = urlName.split(':'); // Divide o nome da URL em partes (namespace e nome)

                // Procura todos os arquivos urls.py no projeto
                vscode.workspace.findFiles('**/urls.py').then(files => {
                    if (files.length > 0) {
                        let foundUrlFile: vscode.Uri | null = null; // Inicializa variável para armazenar o arquivo encontrado

                        // Itera sobre cada arquivo urls.py
                        const filePromises = files.map(file => {
                            return new Promise<void>((resolve) => {
                                fs.readFile(file.fsPath, 'utf8', (err, data) => {
                                    if (err) {
                                        vscode.window.showErrorMessage(`Erro ao ler o arquivo: ${file.fsPath}`); // Mensagem de erro ao ler o arquivo
                                        resolve(); // Resolve a promessa em caso de erro
                                        return;
                                    }

                                    // Verifica se o arquivo contém a URL
                                    if (data.includes(names[0].replaceAll(`'`, '')) && data.includes(names[1].replaceAll(`'`, ''))) {
                                        foundUrlFile = file; // Armazena o arquivo que contém a URL
                                    }
                                    resolve(); // Resolve a promessa após a leitura
                                });
                            });
                        });

                        // Espera até que todos os arquivos sejam verificados
                        Promise.all(filePromises).then(() => {
                            if (foundUrlFile) {
                                // Se um arquivo correspondente for encontrado
                                vscode.workspace.openTextDocument(foundUrlFile).then(doc => {
                                    vscode.window.showTextDocument(doc).then(editor => {
                                        highlightUrlInFile(editor, urlName); // Destaca a URL no arquivo encontrado
                                    });
                                });
                            } else {
                                vscode.window.showErrorMessage(`Nenhuma URL correspondente encontrada para '${urlName}'.`); // Mensagem de erro se nenhuma URL for encontrada
                            }
                        });
                    } else {
                        vscode.window.showErrorMessage('Arquivo urls.py não encontrado em nenhuma pasta.'); // Mensagem se nenhum arquivo urls.py for encontrado
                    }
                });
            } else {
                vscode.window.showErrorMessage('Selecione uma tag URL válida.'); // Mensagem se a seleção não for uma tag URL válida
            }
        }
    });

    context.subscriptions.push(disposable); // Adiciona o comando ao contexto da extensão
}

/**
 * Função chamada quando a extensão é desativada.
 */
export function deactivate() {}

/**
 * Função para destacar a linha que contém a URL no editor.
 * 
 * @param editor - O editor de texto onde a URL deve ser destacada.
 * @param urlName - O nome da URL a ser destacada.
 */
function highlightUrlInFile(editor: vscode.TextEditor, urlName: string) {
    const document = editor.document; // Obtém o documento do editor

    let isAppName = false; // Flag para verificar se o nome do aplicativo foi encontrado
    let names = urlName.split(':'); // Divide o nome da URL em partes

    for (let i = 0; i < names.length; i++) {
        for (let line = 0; line < document.lineCount; line++) {
            const textLine = document.lineAt(line); // Obtém a linha do documento

            // Verifica se a linha contém o nome da URL
            if (isAppName || textLine.text.includes(names[i].replaceAll(`'`, ''))) {
                isAppName = true; // Define a flag como verdadeira se o nome do aplicativo foi encontrado

                if (textLine.text.includes(names[i].replaceAll(`'`, ''))) {
                    // Destaca a linha que contém a URL
                    editor.selection = new vscode.Selection(line, 0, line, textLine.text.length); // Seleciona a linha
                    editor.revealRange(new vscode.Range(line, 0, line, 0)); // Revela a linha no editor
                    break; // Sai do loop após encontrar a primeira correspondência
                }
            }
        }
    }
}
