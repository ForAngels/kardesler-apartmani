import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, PieChart, Calendar, AlertTriangle, CheckCircle2, Loader2, X, DollarSign, Tag } from 'lucide-react';
import api from '../api';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    expense_type: 'DIGER',
    amount: '',
    should_distribute: false
  });

  const categories = [
    { value: 'ASANSOR', label: 'Asansör' },
    { value: 'TEMIZLIK', label: 'Temizlik' },
    { value: 'ELEKTRIK', label: 'Elektrik' },
    { value: 'DIGER', label: 'Diğer' }
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/api/admin/expenses/');
      setExpenses(response.data);
    } catch (err) {
      console.error('Giderler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };


  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/expenses/', formData);
      setShowAddModal(false);
      setFormData({ title: '', expense_type: 'DIGER', amount: '', should_distribute: false });
      fetchExpenses();
      alert('Gider başarıyla kaydedildi' + (formData.should_distribute ? ' ve dairelere borç olarak dağıtıldı.' : '.'));
    } catch (err) {
      alert('Gider kaydedilirken hata oluştu.');
    }
  };


  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Bu gideri silmek istediğinize emin misiniz? Eğer dairelere dağıtıldıysa, o borçlar da silinecektir.')) return;
    try {
      await api.delete(`/api/admin/expenses/${id}/delete/`);
      fetchExpenses();
    } catch (err) {
      alert('Silme işlemi başarısız.');
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-gray-400">Gider kayıtları yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Giderler & Borçlandırma</h1>
          <p className="text-gray-400">Bina harcamalarını takip edin ve dairelere borç olarak yansıtın.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
        >
          <Plus size={20} /> Yeni Gider Gir
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-dark-card/50 border-dark-border">
          <p className="text-gray-500 text-xs font-bold uppercase mb-1">Toplam Gider</p>
          <p className="text-3xl font-black text-white">₺{expenses.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('tr-TR')}</p>
        </div>
        <div className="card bg-emerald-500/5 border-emerald-500/10">
          <p className="text-emerald-500/60 text-xs font-bold uppercase mb-1">Dağıtılan Giderler</p>
          <p className="text-3xl font-black text-emerald-500">{expenses.filter(e => e.is_distributed).length}</p>
        </div>
        <div className="card bg-blue-500/5 border-blue-500/10">
          <p className="text-blue-500/60 text-xs font-bold uppercase mb-1">Cari Ay Gideri</p>
          <p className="text-3xl font-black text-blue-500">
            ₺{expenses.filter(e => e.date.startsWith(new Date().toISOString().slice(0, 7))).reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('tr-TR')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {expenses.length === 0 ? (
          <div className="col-span-full py-20 text-center card border-dashed border-2 border-dark-border text-gray-500">
            Henüz kayıtlı bir gider bulunmuyor.
          </div>
        ) : (
          expenses.map(expense => (
            <div key={expense.id} className="card bg-dark-card border-dark-border hover:border-emerald-500/30 transition-all flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-dark rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner">
                  <Wallet size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{expense.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] bg-dark-border text-gray-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                      {expense.expense_type_display}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={12} /> {expense.date}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xl font-black text-white">₺{expense.amount.toLocaleString('tr-TR')}</p>
                  {expense.is_distributed && (
                    <span className="text-[10px] text-emerald-500 font-bold flex items-center justify-end gap-1">
                      <CheckCircle2 size={10} /> Dairelere Bölüştürüldü
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => handleDeleteExpense(expense.id)}
                  className="p-3 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <form onSubmit={handleAddExpense} className="bg-dark-card border border-dark-border w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-dark-border flex justify-between items-center bg-dark/40">
              <h3 className="text-2xl font-black text-white">Yeni Gider Kaydı</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white transition-colors"><X size={28} /></button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Gider Başlığı</label>
                <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="text" 
                      required
                      placeholder="Örn: Asansör Periyodik Bakımı"
                      className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all font-medium"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Kategori</label>
                  <select 
                    className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-emerald-500 transition-all font-medium appearance-none"
                    value={formData.expense_type}
                    onChange={(e) => setFormData({...formData, expense_type: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Tutar (TL)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="number" 
                      required
                      placeholder="0.00"
                      className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all font-medium"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-4 p-4 bg-dark/30 rounded-2xl border border-dark-border hover:border-emerald-500/40 cursor-pointer transition-all">
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">Dairelere Bölüştür</p>
                  <p className="text-[10px] text-gray-500 font-medium">Bu tutar tüm dairelere eşit olarak borçlandırılır.</p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formData.should_distribute}
                    onChange={(e) => setFormData({...formData, should_distribute: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </div>
              </label>
            </div>

            <div className="p-8 bg-dark/40 border-t border-dark-border flex gap-4">
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-4 bg-dark-border text-white font-black rounded-2xl hover:bg-gray-700 transition-all uppercase tracking-widest text-xs"
              >
                İptal
              </button>
              <button 
                type="submit" 
                className="flex-2 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-600/20 uppercase tracking-widest text-xs"
              >
                Gideri Kaydet
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
