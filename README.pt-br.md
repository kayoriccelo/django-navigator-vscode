# Extensão Django Navigator para VSCode

[![en](https://img.shields.io/badge/language-en-blue)](README.md) 
[![ptBr](https://img.shields.io/badge/language-pt--BR-green)](README.pt-br.md)

## Descrição

A extensão **Django Navigator** para o Visual Studio Code é uma ferramenta útil que permite aos desenvolvedores Django navegar rapidamente entre as URLs definidas em arquivos `urls.py` dentro de seu projeto. Ao usar esta extensão, você pode facilmente encontrar e destacar a definição de uma URL correspondente a uma tag `{% url %}` em seu código, melhorando sua eficiência ao trabalhar em projetos Django.

### Funcionalidades

- **Navegação Rápida**: Encontre e navegue rapidamente até as URLs definidas em seus arquivos `urls.py`.
- **Realce de URL**: Destaque a linha que contém a definição da URL correspondente à tag `{% url %}`.

## Instalação

Para instalar a extensão, siga estas etapas:

1. Abra o Visual Studio Code.
2. Vá até a aba de extensões (ou pressione `Ctrl+Shift+X`).
3. Pesquise por "Django Navigator".
4. Clique em "Instalar".

## Uso

1. Abra um arquivo de template Django onde você tenha a tag `{% url %}`.
2. Selecione a tag que você deseja navegar.
3. Pressione `Ctrl+Shift+P` para abrir a paleta de comandos.
4. Digite `Django Navigator: Go To URL` e pressione `Enter`.

A extensão abrirá o arquivo `urls.py` correspondente e destacará a definição da URL.

### Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir um *issue* ou enviar um *pull request*.

### Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.
