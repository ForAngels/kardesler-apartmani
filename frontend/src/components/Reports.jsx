import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, Calendar, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import api from '../api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('monthly'); // 'monthly' or 'extra'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Monthly Dues State
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState([]);

  // Extra Payments State
  const [expenses, setExpenses] = useState([]);
  const [selectedExpenseId, setSelectedExpenseId] = useState('');
  const [extraData, setExtraData] = useState([]);

  useEffect(() => {
    if (activeTab === 'monthly') {
      fetchMonthlyReport();
    } else {
      fetchExpensesForFilter();
    }
  }, [activeTab]);

  const fetchMonthlyReport = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/admin/reports/monthly-aidat/?year=${year}&month=${month}`);
      setMonthlyData(response.data);
    } catch (err) {
      setError('Rapor verileri alınamadı.');
    } finally {
      setLoading(false);
    }
  };


  const fetchExpensesForFilter = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/reports/expenses/');
      setExpenses(response.data);
      if (response.data.length > 0 && !selectedExpenseId) {
        setSelectedExpenseId(response.data[0].id);
      }
    } catch (err) {
      setError('Gider listesi alınamadı.');
    } finally {
      setLoading(false);
    }
  };


  const fetchExtraReport = async (expenseId) => {
    if (!expenseId) return;
    setLoading(true);
    try {
      const response = await api.get(`/api/admin/reports/extra-payments/?expense_id=${expenseId}`);
      setExtraData(response.data);
    } catch (err) {
      setError('Ekstra ödeme verileri alınamadı.');
    } finally {
      setLoading(false);
    }
  };


  const exportToPDF = (type) => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('tr-TR');
    
    // Header
    doc.setFontSize(20);
    doc.text("Kardesler Apartmani Yonetimi", 14, 22);
    doc.setFontSize(14);
    
    let title = "";
    let tableData = [];
    let columns = [];

    if (type === 'monthly') {
      const monthNames = ["Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran", "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik"];
      const currentMonthName = monthNames[month - 1];
      title = `${currentMonthName} ${year} Aidat Tahsilat Raporu`;
      columns = ["Daire", "Sakin", "Tutar (TL)", "Durum", "Odeme Tarihi"];
      tableData = monthlyData.map(item => [
        item.apartment_number,
        item.resident,
        item.amount.toLocaleString('tr-TR'),
        item.status,
        item.paid_date
      ]);
    } else {
      const exp = expenses.find(e => e.id.toString() === selectedExpenseId.toString());
      title = `${exp?.title || 'Ekstra Gider'} Tahsilat Raporu`;
      columns = ["Daire", "Sakin", "Tutar (TL)", "Durum", "Odeme Tarihi"];
      tableData = extraData.map(item => [
        item.apartment_number,
        item.resident,
        item.amount.toLocaleString('tr-TR'),
        item.status,
        item.paid_date
      ]);
    }

    doc.text(title, 14, 32);
    doc.setFontSize(10);
    doc.text(`Rapor Tarihi: ${today}`, 14, 40);

    autoTable(doc, {
      startY: 45,
      head: [columns],
      body: tableData,
      theme: 'grid',
      headStyles: { fillStyle: '#10b981', textColor: 255 },
      styles: { fontSize: 9 }
    });

    const totalCollected = (type === 'monthly' ? monthlyData : extraData)
      .filter(item => item.is_paid)
      .reduce((sum, item) => sum + item.amount, 0);
    
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Toplam Tahsilat:  ${totalCollected.toLocaleString('tr-TR')} TL`, 14, finalY);

    doc.save(`${type === 'monthly' ? 'aidat_raporu' : 'ekstra_odeme_raporu'}_${today}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Yönetim Raporları</h1>
          <p className="text-gray-400">Tahsilat takibi ve yasal kanıt için detaylı PDF dökümleri.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-dark-card border border-dark-border p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'monthly' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
        >
          <Calendar className="inline-block mr-2" size={16} /> Aylık Aidat
        </button>
        <button
          onClick={() => setActiveTab('extra')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'extra' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
        >
          <CreditCard className="inline-block mr-2" size={16} /> Ekstra Ödemeler
        </button>
      </div>

      {/* Filters Area */}
      <div className="card flex flex-col md:flex-row items-end gap-4">
        {activeTab === 'monthly' ? (
          <>
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Yıl</label>
              <select 
                className="w-full bg-dark/50 border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Ay</label>
              <select 
                className="w-full bg-dark/50 border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                <option value={1}>Ocak</option>
                <option value={2}>Şubat</option>
                <option value={3}>Mart</option>
                <option value={4}>Nisan</option>
                <option value={5}>Mayıs</option>
                <option value={6}>Haziran</option>
                <option value={7}>Temmuz</option>
                <option value={8}>Ağustos</option>
                <option value={9}>Eylül</option>
                <option value={10}>Ekim</option>
                <option value={11}>Kasım</option>
                <option value={12}>Aralık</option>
              </select>
            </div>
            <button 
              onClick={fetchMonthlyReport}
              className="px-8 py-3 bg-dark-border hover:bg-gray-700 text-white font-bold rounded-xl transition-all"
            >
              Uygula
            </button>
          </>
        ) : (
          <>
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Filtrelenecek Gider</label>
              <select 
                className="w-full bg-dark/50 border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                value={selectedExpenseId}
                onChange={(e) => {
                  setSelectedExpenseId(e.target.value);
                  fetchExtraReport(e.target.value);
                }}
              >
                <option value="">Gider Seçin...</option>
                {expenses.map(e => (
                  <option key={e.id} value={e.id}>{e.title} ({e.date})</option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => fetchExtraReport(selectedExpenseId)}
              className="px-8 py-3 bg-dark-border hover:bg-gray-700 text-white font-bold rounded-xl transition-all"
            >
              Uygula
            </button>
          </>
        )}
        
        <button 
          onClick={() => exportToPDF(activeTab)}
          disabled={loading || (activeTab === 'monthly' ? monthlyData.length === 0 : extraData.length === 0)}
          className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <Download size={20} /> PDF Olarak İndir
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dark-border border-dashed rounded-3xl">
          <Loader2 className="animate-spin text-emerald-500 mb-2" />
          <p className="text-gray-500 text-sm">Rapor hazırlanıyor...</p>
        </div>
      ) : (
        <div className="card overflow-hidden !p-0 border border-dark-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-dark/50 border-b border-dark-border">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Daire</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Sakin</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Borç Tutarı</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Durum</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Ödeme Tarihi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {activeTab === 'monthly' ? (
                  monthlyData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-dark/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">Daire {item.apartment_number}</td>
                      <td className="px-6 py-4 text-gray-300">{item.resident}</td>
                      <td className="px-6 py-4 text-white">₺{item.amount.toLocaleString('tr-TR')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${item.is_paid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-right">{item.paid_date}</td>
                    </tr>
                  ))
                ) : (
                  extraData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-dark/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">Daire {item.apartment_number}</td>
                      <td className="px-6 py-4 text-gray-300">{item.resident}</td>
                      <td className="px-6 py-4 text-white">₺{item.amount.toLocaleString('tr-TR')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${item.is_paid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-right">{item.paid_date}</td>
                    </tr>
                  ))
                )}
                {(activeTab === 'monthly' ? monthlyData : extraData).length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 italic">Veri bulunamadı.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 bg-dark/40 border-t border-dark-border flex justify-between items-center">
            <div className="text-gray-400 text-sm">
              Toplam Kayıt: <span className="text-white font-bold">{(activeTab === 'monthly' ? monthlyData : extraData).length}</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-500 font-bold uppercase mb-1">Toplam Tahsilat</p>
              <p className="text-2xl font-black text-white">
                ₺{(activeTab === 'monthly' ? monthlyData : extraData)
                  .filter(item => item.is_paid)
                  .reduce((sum, item) => sum + item.amount, 0)
                  .toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
