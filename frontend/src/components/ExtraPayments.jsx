import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle2, AlertCircle, Clock, Loader2, Search, Filter } from 'lucide-react';
import api from '../api';

export default function ExtraPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/api/admin/extra-payments/');
      setPayments(response.data);
      setError('');
    } catch (err) {
      setError('Ödemeler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };


  const handleMarkPaid = async (id, currentStatus) => {
    try {
      await api.patch(`/api/admin/extra-payments/${id}/mark-paid/`, 
        { is_paid: !currentStatus }
      );
      fetchPayments();
    } catch (err) {
      alert('Güncelleme sırasında hata oluştu.');
    }
  };


  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.apartment_number.toString().includes(searchTerm) || 
                         p.linked_expense_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'paid' && p.is_paid) || 
                         (filterStatus === 'unpaid' && !p.is_paid);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-gray-400">Ekstra Ödemeler Listeleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ekstra Ödemeler Takibi</h1>
          <p className="text-gray-400">Bölüştürülen giderlerden kaynaklanan özel borçların tahsilat durumu.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-dark-card border border-dark-border px-4 py-2 rounded-xl flex items-center gap-3">
            <Wallet className="text-emerald-500" size={20} />
            <span className="text-white font-bold">{payments.filter(p => !p.is_paid).length} Bekleyen Tahsilat</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Daire no veya Gider adı ile ara..."
            className="w-full bg-dark/50 border border-dark-border rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <select 
            className="bg-dark/50 border border-dark-border rounded-lg py-2 px-4 text-white focus:outline-none focus:border-emerald-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tüm Durumlar</option>
            <option value="paid">Sadece Ödenenler</option>
            <option value="unpaid">Sadece Bekleyenler</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredPayments.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            Kayıt bulunamadı.
          </div>
        ) : (
          filteredPayments.map(p => (
            <div key={p.id} className="card hover:border-emerald-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl flex flex-col items-center justify-center min-w-[70px] ${p.is_paid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  <span className="text-xs font-bold uppercase">Daire</span>
                  <span className="text-2xl font-black">{p.apartment_number}</span>
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">{p.linked_expense_title}</h4>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <p className="text-sm text-gray-400 flex items-center gap-1">
                      <Clock size={14} /> {p.due_date}
                    </p>
                    {p.is_paid && (
                      <p className="text-sm text-emerald-500 flex items-center gap-1 font-medium">
                        <CheckCircle2 size={14} /> Ödendi: {p.paid_date}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-dark-border">
                <div className="text-right">
                  <p className="text-sm text-gray-500 uppercase font-bold">Borç Tutarı</p>
                  <p className="text-xl font-black text-white">₺{p.amount.toLocaleString('tr-TR')}</p>
                </div>
                <button
                  onClick={() => handleMarkPaid(p.id, p.is_paid)}
                  className={`px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg ${
                    p.is_paid 
                    ? 'bg-dark-border text-gray-400 hover:bg-red-500/10 hover:text-red-500' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20'
                  }`}
                >
                  {p.is_paid ? 'Ödemeyi İptal Et' : 'Ödendi İşaretle'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
