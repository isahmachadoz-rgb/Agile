
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { inventoryService } from './services/inventoryService';
import { Category, Product } from './types';

type TerminalState = 'MENU' | 'ADD_NAME' | 'ADD_CAT' | 'ADD_QTY' | 'ADD_PRICE' | 'SEARCH' | 'DELETE' | 'UPDATE_ID' | 'UPDATE_FIELD';

const TerminalEmulator = () => {
  const [viewMode, setViewMode] = useState<'cli' | 'gui'>('cli');
  const [history, setHistory] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [state, setState] = useState<TerminalState>('MENU');
  const [tempProduct, setTempProduct] = useState<Partial<Product>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewMode === 'cli') {
      showMenu();
    }
  }, [viewMode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const print = (msg: string) => setHistory(prev => [...prev, msg]);

  const showMenu = () => {
    setHistory([
      '==============================================',
      '       AGILSTORE - GESTÃO DE INVENTÁRIO       ',
      '==============================================',
      '1. Adicionar Novo Produto',
      '2. Listar Todos os Produtos',
      '3. Atualizar Informações de Produto',
      '4. Excluir Produto do Estoque',
      '5. Buscar Produto (Nome ou ID)',
      '0. Sair do Sistema',
      '----------------------------------------------',
      'Escolha uma opção: '
    ]);
    setState('MENU');
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd && state === 'MENU') return;
    
    setHistory(prev => [...prev, `> ${cmd}`]);
    setInput('');

    switch (state) {
      case 'MENU':
        handleMenu(cmd);
        break;
      case 'ADD_NAME':
        setTempProduct({ name: cmd });
        print('Categoria: ');
        setState('ADD_CAT');
        break;
      case 'ADD_CAT':
        setTempProduct(prev => ({ ...prev, category: cmd as Category }));
        print('Quantidade em Estoque: ');
        setState('ADD_QTY');
        break;
      case 'ADD_QTY':
        setTempProduct(prev => ({ ...prev, quantity: parseInt(cmd) || 0 }));
        print('Preço Unitário: ');
        setState('ADD_PRICE');
        break;
      case 'ADD_PRICE':
        const finalProd = { 
          ...tempProduct, 
          price: parseFloat(cmd.replace(',', '.')) || 0,
          id: inventoryService.generateId(),
          lastUpdated: Date.now()
        } as Product;
        const current = inventoryService.loadProducts();
        inventoryService.saveProducts([finalProd, ...current]);
        print(`\n[SUCESSO] Produto cadastrado com ID: ${finalProd.id}`);
        print('\nPressione ENTER para voltar ao menu...');
        setState('MENU');
        break;
      case 'SEARCH':
        const results = inventoryService.loadProducts().filter(p => 
          p.name.toLowerCase().includes(cmd.toLowerCase()) || p.id.includes(cmd.toUpperCase())
        );
        if (results.length === 0) print('Nenhum produto encontrado.');
        else {
          print('\n--- RESULTADOS ---');
          results.forEach(p => print(`[${p.id}] ${p.name} - R$ ${p.price.toFixed(2)} (${p.quantity} un)`));
        }
        print('\nPressione ENTER para voltar...');
        setState('MENU');
        break;
      case 'DELETE':
        const prods = inventoryService.loadProducts();
        const filtered = prods.filter(p => p.id !== cmd.toUpperCase());
        if (prods.length === filtered.length) print('[ERRO] ID não encontrado.');
        else {
          inventoryService.saveProducts(filtered);
          print('[SUCESSO] Produto removido.');
        }
        print('\nPressione ENTER para voltar...');
        setState('MENU');
        break;
    }
  };

  const handleMenu = (cmd: string) => {
    switch (cmd) {
      case '1':
        print('\n--- CADASTRO DE PRODUTO ---');
        print('Nome do Produto: ');
        setState('ADD_NAME');
        break;
      case '2':
        const products = inventoryService.loadProducts();
        print('\n--- LISTA DE INVENTÁRIO ---');
        if (products.length === 0) print('Estoque vazio.');
        else products.forEach(p => print(`ID: ${p.id} | ${p.name.padEnd(15)} | Qtd: ${p.quantity.toString().padStart(3)} | R$ ${p.price.toFixed(2)}`));
        print('\nPressione ENTER para voltar...');
        break;
      case '4':
        print('\nDigite o ID para exclusão: ');
        setState('DELETE');
        break;
      case '5':
        print('\nBuscar (Nome ou ID): ');
        setState('SEARCH');
        break;
      case '0':
        print('\nSessão encerrada. Recarregue a página para reiniciar.');
        break;
      default:
        showMenu();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Barra de Navegação de Visualização */}
      <div className="bg-slate-900 border-b border-slate-800 p-2 flex justify-between items-center px-6">
        <div className="flex items-center gap-4">
          <span className="text-white font-bold tracking-tighter text-xl">AGIL<span className="text-indigo-500">STORE</span></span>
          <div className="h-4 w-[1px] bg-slate-700"></div>
          <span className="text-slate-500 text-xs font-mono">v1.0.4-stable</span>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button 
            onClick={() => setViewMode('cli')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'cli' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            CLI (NODE.JS)
          </button>
          <button 
            onClick={() => setViewMode('gui')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'gui' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            DASHBOARD (WEB)
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {viewMode === 'cli' ? (
          <div className="absolute inset-0 p-6 font-mono text-sm overflow-y-auto bg-black text-emerald-500 selection:bg-emerald-900 selection:text-white">
            <div className="max-w-3xl mx-auto">
              <div className="mb-4 opacity-50 text-[10px]">
                [SYSTEM] Node.js v20.10.0 runtime initialized...<br/>
                [SYSTEM] Importing @agilstore/inventory-service...<br/>
                [SYSTEM] Connected to local storage buffer (emulating produtos.json)
              </div>
              
              {history.map((line, i) => (
                <div key={i} className={`whitespace-pre-wrap mb-1 ${line.startsWith('>') ? 'text-white font-bold' : line.includes('[SUCESSO]') ? 'text-indigo-400' : line.includes('[ERRO]') ? 'text-red-400' : ''}`}>
                  {line}
                </div>
              ))}
              
              <form onSubmit={handleCommand} className="flex mt-2 items-center">
                <span className="text-white mr-2">➜</span>
                <input
                  autoFocus
                  className="bg-transparent border-none outline-none flex-1 text-white caret-indigo-500"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </form>
              <div ref={bottomRef} className="h-20" />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 overflow-y-auto bg-slate-50">
            <App />
          </div>
        )}
      </div>

      {/* Dica Flutuante */}
      <div className="fixed bottom-20 right-6 max-w-xs bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-2xl text-[11px] text-slate-400 animate-bounce pointer-events-none">
        <span className="text-indigo-400 font-bold block mb-1">DICA DE DEV:</span>
        No terminal, os dados salvos ficam no seu navegador. Quando você copiar os arquivos para o VS Code, eles serão salvos no arquivo <code className="text-white">data/produtos.json</code>.
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<TerminalEmulator />);
}
