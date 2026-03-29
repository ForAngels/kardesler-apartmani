import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, XCircle, Search, Calendar, Loader2 } from 'lucide-react';
import api from '../api';

export default function DuesManagement() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDues();
  }, [month, year]);

  const fetchDues = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/admin/dues/management/?year=${year}&month=${month}`);
      setPayments(response.data);
      setError('');
    } catch (err) {
      setError('Aidat verileri yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };


  const togglePaymentStatus = async (id) => {
    try {
      const response = await api.patch(`/api/admin/extra-payments/${id}/mark-paid/`, {});
      
      // Update local state
      setPayments(prev => prev.map(p => 
        p.id === id ? { ...p, is_paid: response.data.is_paid, paid_date: response.data.is_paid ? new Date().toISOString().split('T')[0] : null } : p
      ));
    } catch (err) {
      alert('Durum güncellenirken hata oluştu.');
    }
  };


  const filteredPayments = payments.filter(p => 
    p.apartment_number.toString().includes(searchTerm) || 
    p.resident.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Aidat Tahsilat Yönetimi</h1>
          <p className="text-gray-400">Aylık aidat ödemelerini onaylayın veya iptal edin.</p>
        </div>
        <div className="flex items-center gap-3 bg-dark-card border border-dark-border p-2 rounded-2xl">
          <div className="flex items-center gap-2 px-3 border-r border-dark-border">
            <Calendar className="text-emerald-500" size={18} />
            <select 
              className="bg-transparent text-white font-bold focus:outline-none"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
            >
              {[...Array(12)].map((_, i) => (
                <option key={i+1} value={i+1} className="bg-dark text-white">
                  {new Intl.DateTimeFormat('tr-TR', { month: 'long' }).format(new Date(2000, i, 1))}
                </option>
              ))}
            </select>
          </div>
          <select 
            className="bg-transparent text-white font-bold focus:outline-none px-3"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          >
            {[2025, 2026].map(y => (
              <option key={y} value={y} className="bg-dark text-white">{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-emerald-500/10 border-emerald-500/20">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Toplam Daire</p>
          <p className="text-3xl font-black text-white">{payments.length}</p>
        </div>
        <div className="card bg-blue-500/10 border-blue-500/20">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Ödeyen</p>
          <p className="text-3xl font-black text-white">{payments.filter(p => p.is_paid).length}</p>
        </div>
        <div className="card bg-red-500/10 border-red-500/20">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Bekliyen</p>
          <p className="text-3xl font-black text-white">{payments.filter(p => !p.is_paid).length}</p>
        </div>
      </div>

      {/* Search & List */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Daire no veya isim ile ara..."
            className="w-full bg-dark-card border border-dark-border rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 shadow-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-emerald-500" size={40} />
            <p className="text-gray-500">Aidatlar listeleniyor...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPayments.length === 0 ? (
              <div className="col-span-full card text-center py-12 text-gray-500 italic">
                Bu ay için henüz aidat kaydı oluşturulmamış veya sonuç bulunamadı.
              </div>
            ) : (
              filteredPayments.map(p => (
                <div key={p.id} className={`card border-l-4 transition-all hover:translate-x-1 ${p.is_paid ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${p.is_paid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {p.apartment_number}
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{p.resident}</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-tighter">
                          Tutar: <span className="text-gray-300">₺{p.amount.toLocaleString('tr-TR')}</span>
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => togglePaymentStatus(p.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg ${
                        p.is_paid 
                        ? 'bg-emerald-600/10 text-emerald-500 hover:bg-red-500/10 hover:text-red-500' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20'
                      }`}
                    >
                      {p.is_paid ? (
                        <>İptal Et</>
                      ) : (
                        <>Ödendi İşaretle</>
                      )}
                    </button>
                  </div>
                  {p.is_paid && (
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-500 bg-dark/30 p-2 rounded-lg">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      Tahsilat Tarihi: <span className="text-gray-300 font-medium">{p.paid_date}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
