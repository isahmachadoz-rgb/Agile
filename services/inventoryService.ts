
import { Product, Category } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

// Configuração do worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs';

const STORAGE_KEY = 'agilstore_inventory_data';

export const inventoryService = {
  loadProducts: (): Product[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Falha ao carregar produtos:', error);
      return [];
    }
  },

  saveProducts: (products: Product[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('Falha ao salvar produtos:', error);
    }
  },

  generateId: (): string => {
    return `ID-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  },

  parseJSON: (text: string): Partial<Product>[] => {
    try {
      const data = JSON.parse(text);
      const items = Array.isArray(data) ? data : [data];
      return items.map((item: any) => ({
        name: item.name || item.nome,
        category: Object.values(Category).includes(item.category || item.categoria) ? (item.category || item.categoria) : Category.OUTROS,
        quantity: Math.max(0, parseInt(item.quantity || item.quantidade) || 0),
        price: Math.max(0, parseFloat(item.price || item.preco || item.valor) || 0)
      })).filter(i => i.name);
    } catch {
      return [];
    }
  },

  parsePDF: async (arrayBuffer: ArrayBuffer): Promise<Partial<Product>[]> => {
    try {
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const products: Partial<Product>[] = [];
      const categories = Object.values(Category);

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Agrupa itens por Y (linha) com uma tolerância de 5 unidades para desalinhamentos
        const rows: { [key: number]: any[] } = {};
        const Y_TOLERANCE = 5;

        textContent.items.forEach((item: any) => {
          const y = item.transform[5];
          let foundRowY = Object.keys(rows).find(rowY => Math.abs(parseFloat(rowY) - y) < Y_TOLERANCE);
          
          if (!foundRowY) {
            rows[y] = [item];
          } else {
            rows[parseFloat(foundRowY)].push(item);
          }
        });

        // Ordena linhas de cima para baixo
        const sortedYs = Object.keys(rows).map(Number).sort((a, b) => b - a);

        sortedYs.forEach(y => {
          // Ordena itens dentro da linha por X (da esquerda para a direita)
          const rowItems = rows[y].sort((a, b) => a.transform[4] - b.transform[4]);
          const rowText = rowItems.map(item => item.str).join(' ').trim();
          
          if (rowText.length < 5) return;

          // Busca categoria na linha
          const foundCategory = categories.find(cat => 
            rowText.toLowerCase().includes(cat.toLowerCase())
          );

          // Busca números (Quantidade e Preço)
          // Tenta capturar o padrão: [Nome] [Categoria] [Quantidade] [Preço]
          // O preço costuma ser o último valor numérico formatado
          const words = rowText.split(/\s+/);
          const numericValues = words.filter(w => /^[R$\s]*\d+[,.]?\d*[,.]?\d*$/.test(w));

          if (numericValues.length >= 2) {
            const priceStr = numericValues[numericValues.length - 1];
            const qtyStr = numericValues[numericValues.length - 2];
            
            const quantity = Math.floor(inventoryService.cleanNumericValue(qtyStr));
            const price = inventoryService.cleanNumericValue(priceStr);

            // Tenta extrair o nome removendo a categoria e os números do final
            let name = rowText;
            if (foundCategory) name = name.replace(new RegExp(foundCategory, 'gi'), '');
            name = name.replace(qtyStr, '').replace(priceStr, '').trim();

            if (name.length > 1) {
              products.push({
                name,
                category: foundCategory || Category.OUTROS,
                quantity: Math.max(0, quantity),
                price: Math.max(0, price)
              });
            }
          }
        });
      }

      return products;
    } catch (error) {
      console.error('Erro detalhado ao processar PDF:', error);
      return [];
    }
  },

  cleanNumericValue: (val: string): number => {
    if (!val) return 0;
    let v = val.replace(/[R$\s]/g, '');
    if (v.includes('.') && v.includes(',')) {
      v = v.replace(/\./g, '').replace(',', '.');
    } else if (v.includes(',')) {
      v = v.replace(',', '.');
    }
    return parseFloat(v) || 0;
  },

  parseCSV: (text: string): Partial<Product>[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    const firstLine = lines[0];
    const separator = firstLine.split(';').length > firstLine.split(',').length ? ';' : ',';

    const splitLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === separator && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = splitLine(lines[0]).map(h => h.toLowerCase());
    const colMap = {
      name: headers.findIndex(h => h.includes('nome') || h.includes('prod') || h.includes('item')),
      category: headers.findIndex(h => h.includes('cat')),
      quantity: headers.findIndex(h => h.includes('qtd') || h.includes('quant') || h.includes('estoque')),
      price: headers.findIndex(h => h.includes('preço') || h.includes('preco') || h.includes('valor') || h.includes('r$'))
    };

    if (colMap.name === -1) colMap.name = 0;
    if (colMap.category === -1) colMap.category = 1;
    if (colMap.quantity === -1) colMap.quantity = 2;
    if (colMap.price === -1) colMap.price = 3;

    const products: Partial<Product>[] = [];
    const firstRowCols = splitLine(lines[0]);
    const isHeader = isNaN(Number(firstRowCols[colMap.quantity])) && colMap.name !== -1;
    const startIndex = isHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const cols = splitLine(lines[i]);
      if (cols.length < 2) continue;

      const name = cols[colMap.name] || '';
      const rawCat = cols[colMap.category] || '';
      const quantity = Math.floor(inventoryService.cleanNumericValue(cols[colMap.quantity] || '0'));
      const price = inventoryService.cleanNumericValue(cols[colMap.price] || '0');

      let category = Category.OUTROS;
      const found = Object.values(Category).find(c => c.toLowerCase() === rawCat.toLowerCase());
      if (found) category = found;

      if (name && name.length > 1) {
        products.push({
          name,
          category,
          quantity: Math.max(0, quantity),
          price: Math.max(0, price)
        });
      }
    }
    return products;
  }
};
