
import React from 'react';
import { Product, Category } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface StatsProps {
  products: Product[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Stats: React.FC<StatsProps> = ({ products }) => {
  const totalValue = products.reduce((acc, p) => acc + p.price * p.quantity, 0);
  const lowStockCount = products.filter(p => p.quantity < 5).length;

  const categoryData = Object.values(Category).map(cat => ({
    name: cat,
    value: products.filter(p => p.category === cat).length
  })).filter(item => item.value > 0);

  const stockValueData = Object.values(Category).map(cat => ({
    name: cat,
    value: products.filter(p => p.category === cat).reduce((acc, p) => acc + (p.price * p.quantity), 0)
  })).filter(item => item.value > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <p className="text-slate-500 text-sm font-medium">Valor Total em Estoque</p>
        <p className="text-3xl font-bold mt-2 text-indigo-600">
          R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <p className="text-slate-500 text-sm font-medium">Produtos Únicos</p>
        <p className="text-3xl font-bold mt-2 text-slate-800">{products.length}</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <p className="text-slate-500 text-sm font-medium">Baixo Estoque (&lt;5)</p>
        <p className={`text-3xl font-bold mt-2 ${lowStockCount > 0 ? 'text-orange-500' : 'text-green-500'}`}>
          {lowStockCount}
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <p className="text-slate-500 text-sm font-medium">Categoria Principal</p>
        <p className="text-xl font-bold mt-2 text-slate-800">
          {categoryData.length > 0 ? categoryData.sort((a, b) => b.value - a.value)[0].name : 'N/A'}
        </p>
      </div>

      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
        <h3 className="text-slate-800 font-semibold mb-4 text-center">Distribuição por Categoria</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip labelStyle={{ fontWeight: 'bold' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
        <h3 className="text-slate-800 font-semibold mb-4 text-center">Valor por Categoria (R$)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stockValueData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
            <Tooltip cursor={{fill: '#f8fafc'}} />
            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} name="Valor (R$)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Stats;
