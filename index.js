
import readline from 'readline';
import { inventoryService } from './services/inventoryService.js';
import { validations } from './utils/validations.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

async function menu() {
  console.clear();
  console.log('==============================================');
  console.log('       AGILSTORE - GESTÃO DE INVENTÁRIO       ');
  console.log('==============================================');
  console.log('1. Adicionar Novo Produto');
  console.log('2. Listar Todos os Produtos');
  console.log('3. Atualizar Informações de Produto');
  console.log('4. Excluir Produto do Estoque');
  console.log('5. Buscar Produto (Nome ou ID)');
  console.log('0. Sair do Sistema');
  console.log('----------------------------------------------');

  const option = await ask('Escolha uma opção: ');

  switch (option) {
    case '1': await handleAdd(); break;
    case '2': await handleList(); break;
    case '3': await handleUpdate(); break;
    case '4': await handleDelete(); break;
    case '5': await handleSearch(); break;
    case '0':
      console.log('\nEncerrando AgilStore... Até logo!');
      rl.close();
      return;
    default:
      console.log('\nOpção inválida! Tente novamente.');
      await ask('\nPressione ENTER para continuar...');
  }
  menu();
}

async function handleAdd() {
  console.log('\n--- CADASTRO DE PRODUTO ---');
  const nome = await ask('Nome do Produto: ');
  const categoria = await ask('Categoria: ');
  const quantidade = await ask('Quantidade em Estoque: ');
  const preco = await ask('Preço Unitário: ');

  if (!validations.isValidString(nome) || !validations.isValidQuantity(quantidade) || !validations.isValidPrice(preco)) {
    console.log('\n[ERRO] Dados inválidos. Verifique se os campos foram preenchidos corretamente.');
  } else {
    const p = inventoryService.add({ nome, categoria, quantidade, preco });
    console.log(`\n[SUCESSO] Produto cadastrado com ID: ${p.id}`);
  }
  await ask('\nPressione ENTER para voltar...');
}

async function handleList() {
  const products = inventoryService.getAll();
  console.log('\n--- LISTA DE INVENTÁRIO ---');
  if (products.length === 0) {
    console.log('O estoque está vazio no momento.');
  } else {
    console.table(products.map(p => ({
      ID: p.id,
      Nome: p.nome,
      Categoria: p.categoria,
      Qtd: p.quantidade,
      Preço: `R$ ${p.preco.toFixed(2)}`
    })));
  }
  await ask('\nPressione ENTER para voltar...');
}

async function handleUpdate() {
  const id = await ask('\nDigite o ID do produto que deseja atualizar: ');
  const product = inventoryService.getById(id);

  if (!product) {
    console.log('\n[ERRO] Produto não localizado com este ID.');
  } else {
    console.log(`\nEditando: ${product.nome} (Atual: ${product.quantidade} un - R$ ${product.preco})`);
    const nome = await ask('Novo Nome (vazio p/ manter): ');
    const categoria = await ask('Nova Categoria (vazio p/ manter): ');
    const quantidade = await ask('Nova Quantidade (vazio p/ manter): ');
    const preco = await ask('Novo Preço (vazio p/ manter): ');

    const updates = {};
    if (nome) updates.nome = nome;
    if (categoria) updates.categoria = categoria;
    if (quantidade) updates.quantidade = quantidade;
    if (preco) updates.preco = preco;

    inventoryService.update(id, updates);
    console.log('\n[SUCESSO] Informações atualizadas!');
  }
  await ask('\nPressione ENTER para voltar...');
}

async function handleDelete() {
  const id = await ask('\nDigite o ID do produto para exclusão: ');
  const product = inventoryService.getById(id);

  if (!product) {
    console.log('\n[ERRO] Produto não encontrado.');
  } else {
    const confirm = await ask(`Deseja realmente excluir "${product.nome}"? (s/n): `);
    if (confirm.toLowerCase() === 's') {
      inventoryService.delete(id);
      console.log('\n[SUCESSO] Produto removido do inventário.');
    }
  }
  await ask('\nPressione ENTER para voltar...');
}

async function handleSearch() {
  const query = await ask('\nBuscar por Nome ou ID: ');
  const results = inventoryService.search(query);

  if (results.length === 0) {
    console.log('\nNenhum produto encontrado para sua busca.');
  } else {
    console.log('\n--- RESULTADOS DA BUSCA ---');
    console.table(results);
  }
  await ask('\nPressione ENTER para voltar...');
}

// Inicia o programa
menu();
