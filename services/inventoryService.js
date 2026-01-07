
import { fileHandler } from '../utils/fileHandler.js';
import { validations } from '../utils/validations.js';

export const inventoryService = {
  // Retorna todos os produtos
  getAll: () => fileHandler.read(),

  // Busca um produto específico pelo ID
  getById: (id) => {
    const products = fileHandler.read();
    return products.find(p => p.id === id);
  },

  // Busca por nome ou parte do nome
  search: (query) => {
    const products = fileHandler.read();
    const q = query.toLowerCase();
    return products.filter(p => 
      p.id.toLowerCase() === q || 
      p.nome.toLowerCase().includes(q)
    );
  },

  // Adiciona um novo produto com ID único
  add: (data) => {
    const products = fileHandler.read();
    const newProduct = {
      id: `PROD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      nome: data.nome.trim(),
      categoria: data.categoria.trim(),
      quantidade: parseInt(data.quantidade),
      preco: validations.formatPrice(data.preco),
      criadoEm: new Date().toLocaleString('pt-BR')
    };
    
    products.push(newProduct);
    fileHandler.write(products);
    return newProduct;
  },

  // Atualiza um produto existente
  update: (id, updates) => {
    const products = fileHandler.read();
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) return null;

    const updatedProduct = { 
      ...products[index], 
      ...updates,
      atualizadoEm: new Date().toLocaleString('pt-BR')
    };

    // Recalcula tipos numéricos se houver alteração
    if (updates.quantidade) updatedProduct.quantidade = parseInt(updates.quantidade);
    if (updates.preco) updatedProduct.preco = validations.formatPrice(updates.preco);

    products[index] = updatedProduct;
    fileHandler.write(products);
    return updatedProduct;
  },

  // Exclui um produto
  delete: (id) => {
    const products = fileHandler.read();
    const filtered = products.filter(p => p.id !== id);
    if (products.length === filtered.length) return false;
    
    fileHandler.write(filtered);
    return true;
  }
};
