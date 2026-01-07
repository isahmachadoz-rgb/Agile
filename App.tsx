
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, Category, SortField, SortOrder } from './types';
import { inventoryService } from './services/inventoryService';
import Stats from './components/Stats';
import ProductModal from './components/ProductModal';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Todas');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedProducts = inventoryService.loadProducts();
    setProducts(savedProducts);
  }, []);

  useEffect(() => {
    if (products.length > 0 || localStorage.getItem('agilstore_inventory_data')) {
      setIsSaving(true);
      inventoryService.saveProducts(products);
      const timer = setTimeout(() => setIsSaving(false), 600);
      return () => clearTimeout(timer);
    }
  }, [products]);

  const handleSaveProduct = (formData: Partial<Product>) => {
    let newProducts: Product[];
    if (editingProduct) {
      newProducts = products.map(p => 
        p.id === editingProduct.id 
          ? { ...p, ...formData, lastUpdated: Date.now() } as Product 
          : p
      );
    } else {
      const newProduct: Product = {
        id: inventoryService.generateId(),
        name: formData.name!,
        category: formData.category!,
        quantity: formData.quantity!,
        price: formData.price!,
        lastUpdated: Date.now(),
      };
      newProducts = [newProduct, ...products];
    }
    setProducts(newProducts);
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const processParsedItems = (parsedItems: Partial<Product>[]) => {
    if (parsedItems.length === 0) {
      alert("Nenhum produto válido foi encontrado no arquivo.");
      return;
    }

    if (window.confirm(`Detectamos ${parsedItems.length} produtos. Deseja importá-los agora?`)) {
      const newItems = parsedItems.map(item => ({
        ...item,
        id: inventoryService.generateId(),
        lastUpdated: Date.now()
      } as Product));

      setProducts(prev => [...newItems, ...prev]);
      alert("Importação concluída!");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const fileName = file.name.toLowerCase();

    try {
      if (fileName.endsWith('.json')) {
        const text = await file.text();
        const items = inventoryService.parseJSON(text);
        processParsedItems(items);
      } 
      else if (fileName.endsWith('.csv')) {
        const text = await file.text();
        const items = inventoryService.parseCSV(text);
        processParsedItems(items);
      } 
      else if (fileName.endsWith('.pdf')) {
        const buffer = await file.arrayBuffer();
        const items = await inventoryService.parsePDF(buffer);
        processParsedItems(items);
      } 
      else {
        alert("Formato de arquivo não suportado. Use .CSV, .JSON ou .PDF");
      }
    } catch (err) {
      console.error(err);
      alert("Falha ao processar o arquivo.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Excluir este produto? O sistema atualizará o estoque automaticamente.')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                           p.id.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = filterCategory === 'Todas' || p.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (typeof a[sortField] === 'string') {
        comparison = (a[sortField] as string).localeCompare(b[sortField] as string);
      } else {
        comparison = (a[sortField] as number) - (b[sortField] as number);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [products, search, filterCategory, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto pb-24 text-slate-900">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">AgilStore</h1>
            <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${isSaving ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              {isSaving ? 'SALVANDO...' : 'SINCRONIZADO'}
            </span>
          </div>
          <p className="text-slate-500 font-medium uppercase text-xs tracking-widest">Controle de Inventário Inteligente</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".csv,.json,.pdf" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className={`px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isImporting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                PROCESSANDO...
              </span>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6-9l3-3m0 0l3 3m-3-3v12" /></svg>
                IMPORTAR ARQUIVO
              </>
            )}
          </button>
          <button 
            onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            ADICIONAR MANUAL
          </button>
        </div>
      </header>

      <Stats products={products} />

      <main className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/30">
          <div className="relative w-full md:w-96">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input
              type="text"
              placeholder="Buscar por ID ou nome..."
              className="pl-10 pr-4 py-2.5 w-full rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtrar:</span>
            <select
              className="px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-sm font-medium text-slate-700"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="Todas">Todas as Categorias</option>
              {Object.values(Category).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-bold text-slate-400 tracking-widest">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4 cursor-pointer hover:text-indigo-600" onClick={() => toggleSort('name')}>
                  Produto {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-indigo-600" onClick={() => toggleSort('category')}>
                  Categoria {sortField === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 text-right" onClick={() => toggleSort('quantity')}>
                  Qtd {sortField === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 text-right" onClick={() => toggleSort('price')}>
                  Preço {sortField === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAndSortedProducts.length > 0 ? (
                filteredAndSortedProducts.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{product.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{product.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold tabular-nums ${product.quantity < 5 ? 'text-red-500' : 'text-slate-600'}`}>
                        {product.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 tabular-nums">
                      R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-1">
                        <button 
                          onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-30">
                      <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                      <p className="font-bold uppercase tracking-widest text-xs">Inventário Vazio</p>
                      <p className="text-xs mt-2 text-center max-w-xs px-4">
                        Adicione produtos manualmente ou importe: 
                        <br/><strong>.CSV, .JSON ou .PDF</strong>
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <ProductModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingProduct(null); }}
        onSave={handleSaveProduct}
        product={editingProduct}
      />
      
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 text-center z-40">
        <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
          AgilStore Pro &bull; Sincronização em Tempo Real &bull; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default App;
