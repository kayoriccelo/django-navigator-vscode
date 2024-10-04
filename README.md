# Django Navigator Extension for VSCode

[![ptBr](https://img.shields.io/badge/language-pt--BR-green)](README.pt-br.md) 
[![en](https://img.shields.io/badge/language-en-blue)](README.md)

## Description

The **Django Navigator** extension for Visual Studio Code is a useful tool that allows Django developers to quickly navigate between URLs defined in `urls.py` files within their project. By using this extension, you can easily find and highlight the definition of a URL corresponding to a `{% url %}` tag in your code, improving your efficiency when working on Django projects.

### Features

- **Quick Navigation**: Find and quickly navigate to the URLs defined in your `urls.py` files.
- **URL Highlighting**: Highlight the line that contains the URL definition corresponding to the `{% url %}` tag.

## Installation

To install the extension, follow these steps:

1. Open Visual Studio Code.
2. Go to the extensions tab (or press `Ctrl+Shift+X`).
3. Search for "Django Navigator".
4. Click on "Install".

### Prerequisites

- Python 3.8 or higher.
- Django 4.2 or higher.

## Usage

1. Open a Django template file where you have the `{% url %}` tag.
2. Select the tag you want to navigate.
3. Press `Ctrl+Shift+P` to open the command palette.
4. Type `Django Navigator: Go To URL` and press `Enter`.

The extension will open the corresponding `urls.py` file and highlight the URL definition.

### Contributions

Contributions are welcome! Feel free to open an issue or submit a pull request.

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
