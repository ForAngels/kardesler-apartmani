import React, { useState, useEffect } from 'react';
import { Wallet, MessageSquare, Clock, CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';
import api from '../api';

export default function TenantDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Şikayet formu durumu
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/api/my-dashboard/');
      setData(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };


  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/submit-feedback/', {
        subject,
        message
      });
      setSuccess('Mesajınız başarıyla iletildi.');
      setSubject('');
      setMessage('');
      fetchData(); // Şikayet listesini güncelle
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert('Mesaj gönderilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-gray-400">Paneliniz Hazırlanıyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <p className="text-red-500 font-medium">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-emerald-500 hover:underline">Tekrar Dene</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Hoşgeldiniz, {data.user_full_name}</h1>
          <p className="text-gray-400">Daire {data.apartment_number} Sakini Paneli</p>
        </div>
        <div className="flex gap-4">
          {data.upcoming_maintenance && (
            <div className="hidden sm:flex bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-2xl items-center gap-3">
              <Wrench size={20} className="text-blue-500" />
              <div>
                <p className="text-[10px] text-blue-500 uppercase font-bold">Yaklaşan Bakım</p>
                <p className="text-sm font-bold text-blue-400 truncate max-w-[120px]">{data.upcoming_maintenance.title}</p>
              </div>
            </div>
          )}
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl flex items-center gap-3">
            <Wallet size={24} className="text-emerald-500" />
            <div>
              <p className="text-[10px] text-emerald-500 uppercase font-bold">Aylık Aidat: ₺{data.dues_amount}</p>
              <p className="text-xs text-gray-400 uppercase font-semibold">Güncel Borç</p>
              <p className="text-xl font-bold text-emerald-400">₺{data.total_debt.toLocaleString('tr-TR')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ödeme Geçmişi */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Clock size={20} className="text-blue-500" /> Ödeme Geçmişi
            </h3>
            <div className="space-y-4">
              {data.payment_history.length === 0 ? (
                <p className="text-gray-500 italic">Henüz bir ödeme kaydı bulunamadı.</p>
              ) : (
                data.payment_history.map(payment => (
                  <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-dark-border/30 rounded-xl gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${payment.is_paid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {payment.is_paid ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                      </div>
                      <div>
                        <p className="text-white font-medium">{payment.description || 'Aidat Ödemesi'}</p>
                        <p className="text-xs text-gray-400">Son Tarih: {payment.due_date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">₺{payment.amount.toLocaleString('tr-TR')}</p>
                      <p className={`text-xs ${payment.is_paid ? 'text-emerald-400' : 'text-red-400'}`}>
                        {payment.is_paid ? `Ödendi (${payment.paid_date})` : 'Bekliyor'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <MessageSquare size={20} className="text-purple-500" /> Son Mesajlarım
            </h3>
            <div className="space-y-4">
              {data.feedbacks.map(fb => (
                <div key={fb.id} className="p-4 border border-dark-border rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-medium">{fb.subject}</h4>
                    <span className={`text-[10px] px-2 py-1 rounded-full border ${fb.status_code === 'ACIK' ? 'border-yellow-500/30 text-yellow-500' : 'border-emerald-500/30 text-emerald-500'}`}>
                      {fb.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{fb.date}</p>
                  {fb.admin_note && (
                    <div className="mt-2 p-3 bg-emerald-500/5 rounded-lg border-l-2 border-emerald-500">
                      <p className="text-xs text-emerald-400 font-semibold mb-1">Yönetici Yanıtı:</p>
                      <p className="text-gray-300 text-sm italic">"{fb.admin_note}"</p>
                    </div>
                  )}
                </div>
              ))}
              {data.feedbacks.length === 0 && (
                 <p className="text-gray-500 italic">Henüz bir geri bildirim bırakmadınız.</p>
              )}
            </div>
          </div>
        </div>

        {/* Yan Menü: Şikayet Formu */}
        <div className="space-y-6">
          <div className="card bg-emerald-600/5 border-emerald-600/20">
            <h3 className="text-lg font-semibold text-white mb-4">Şikayet / Geri Bildirim</h3>
            <p className="text-gray-400 text-sm mb-6">Yönetime iletmek istediğiniz sorun veya önerileri buradan yazabilirsiniz.</p>
            
            {success && (
              <div className="mb-4 p-3 bg-emerald-500/10 text-emerald-500 text-sm rounded-lg flex items-center gap-2">
                <CheckCircle2 size={16} /> {success}
              </div>
            )}

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Konu Başlığı"
                  className="w-full bg-dark/50 border border-dark-border rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div>
                <textarea
                  required
                  rows="4"
                  placeholder="Mesajınız..."
                  className="w-full bg-dark/50 border border-dark-border rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 text-sm resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Gönder</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
