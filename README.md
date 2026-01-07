
# 📦 AgilStore - Gestão de Inventário (CLI)

O **AgilStore** é um sistema de controle de estoque robusto e leve, desenvolvido em **Node.js**, projetado para rodar diretamente no terminal. Ele permite gerenciar produtos eletrônicos com persistência de dados em arquivos JSON, garantindo que suas informações não sejam perdidas ao fechar o programa.

## 🚀 Funcionalidades

- **Adicionar Produto**: Cadastro com geração automática de IDs únicos (Ex: `PROD-A1B2C3`).
- **Listar Inventário**: Visualização organizada de todos os itens em formato de tabela.
- **Atualizar**: Edição de nome, categoria, quantidade e preço de produtos existentes.
- **Excluir**: Remoção segura de itens com confirmação do usuário.
- **Buscar**: Localização rápida de produtos por parte do nome ou ID exato.
- **Persistência**: Gravação automática de dados na pasta `/data`.

## 🛠️ Tecnologias Utilizadas

- **Node.js**: Ambiente de execução.
- **JavaScript (ES6+)**: Utilizando módulos nativos (`import/export`).
- **Readline**: Para interação em tempo real via terminal.
- **File System (fs)**: Para manipulação de arquivos físicos.

## 📂 Estrutura do Projeto

```text
agilstore-inventory/
├── data/
│   └── produtos.json       # "Banco de dados" em formato JSON
├── services/
│   └── inventoryService.js # Lógica de negócio e CRUD
├── utils/
│   ├── fileHandler.js      # Manipulação física de arquivos
│   └── validations.js      # Regras de validação de dados
├── index.js                # Ponto de entrada e Menu Principal
├── package.json            # Configurações do projeto Node
└── README.md               # Documentação do projeto
```

## 💻 Como Rodar o Projeto

### Pré-requisitos
- Ter o [Node.js](https://nodejs.org/) instalado (versão 14 ou superior).

### Passo a Passo

1. **Clone ou crie a pasta do projeto**:
   ```bash
   mkdir agilstore-inventory
   cd agilstore-inventory
   ```

2. **Organize as pastas**:
   Crie as pastas `data`, `services` e `utils`.

3. **Crie os arquivos**:
   Copie o código correspondente para cada arquivo conforme a estrutura acima.

4. **Instale as dependências (opcional)**:
   Este projeto utiliza apenas módulos nativos, então basta garantir que o `package.json` esteja presente. Se quiser, execute:
   ```bash
   npm install
   ```

5. **Execute o sistema**:
   ```bash
   node index.js
   ```
   *Ou, se preferir usar o script do package.json:*
   ```bash
   npm start
   ```

## 📋 Regras de Validação

- **Preço**: Aceita formatos com ponto ou vírgula (Ex: `1500.00` ou `1.500,00`).
- **Quantidade**: Deve ser sempre um número inteiro positivo.
- **Nome**: Não pode ser deixado em branco.

---
Desenvolvido por **AgilStore Dev Team** 🚀
