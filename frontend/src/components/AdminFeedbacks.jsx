import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle2, Clock, User, AlertCircle, Loader2, Save, X } from 'lucide-react';
import api from '../api';

export default function AdminFeedbacks() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const response = await api.get('/api/admin/feedbacks/');
      setFeedbacks(response.data);
      setError('');
    } catch (err) {
      setError('Şikayetler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };


  const handleUpdateStatus = async (id, newStatus) => {
    setUpdating(true);
    try {
      await api.patch(`/api/admin/feedbacks/${id}/update/`, 
        { status: newStatus, admin_note: adminNote }
      );
      setSelectedFeedback(null);
      setAdminNote('');
      fetchFeedbacks();
    } catch (err) {
      alert('Güncelleme sırasında hata oluştu.');
    } finally {
      setUpdating(false);
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-gray-400">Talepler Listeleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Şikayet & Geri Bildirim Yönetimi</h1>
          <p className="text-gray-400">Sakinlerden gelen tüm talepleri buradan yönetebilirsiniz.</p>
        </div>
        <div className="bg-dark-card border border-dark-border px-4 py-2 rounded-xl flex items-center gap-3">
          <MessageSquare className="text-emerald-500" size={20} />
          <span className="text-white font-bold">{feedbacks.length} Toplam Talep</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {feedbacks.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            Henüz hiç geri bildirim alınmadı.
          </div>
        ) : (
          feedbacks.map(fb => (
            <div key={fb.id} className="card hover:border-emerald-500/30 transition-all group">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-dark-border flex items-center justify-center text-gray-300">
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{fb.user_full_name}</h4>
                      <p className="text-xs text-gray-500">{fb.date}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full border ${
                      fb.status_code === 'ACIK' ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5' : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
                    }`}>
                      {fb.status}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-emerald-500 font-semibold text-lg">{fb.subject}</h3>
                    <p className="text-gray-300 mt-2 leading-relaxed">{fb.message}</p>
                  </div>

                  {fb.admin_note && (
                    <div className="p-3 bg-emerald-950/20 border-l-2 border-emerald-500 rounded-r-lg">
                      <p className="text-[10px] text-emerald-500 font-bold uppercase mb-1">Cevabınız:</p>
                      <p className="text-gray-400 text-sm italic">{fb.admin_note}</p>
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <button 
                    onClick={() => {
                        setSelectedFeedback(fb);
                        setAdminNote(fb.admin_note || '');
                    }}
                    className="px-4 py-2 bg-dark-border hover:bg-emerald-600 hover:text-white transition-all rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    {fb.status_code === 'ACIK' ? 'Cevapla & Kapat' : 'Notu Güncelle'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-dark-card border border-dark-border w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Talebi Yanıtla</h3>
              <button onClick={() => setSelectedFeedback(null)} className="text-gray-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-dark/50 rounded-xl border border-dark-border">
                <p className="text-xs text-emerald-500 font-bold mb-1">{selectedFeedback.user_full_name} diyor ki:</p>
                <p className="text-gray-300 text-sm italic">"{selectedFeedback.message}"</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Yönetici Yanıtı / Çözüm Notu</label>
                <textarea
                  rows="4"
                  className="w-full bg-dark/50 border border-dark-border rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  placeholder="Sakin ile paylaşılacak bilgilendirme notu..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <button
                  onClick={() => handleUpdateStatus(selectedFeedback.id, 'ACIK')}
                  disabled={updating}
                  className="py-3 bg-dark-border hover:bg-gray-700 text-white font-semibold rounded-xl transition-all"
                >
                  Sadece Notu Kaydet
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedFeedback.id, 'COZULDU')}
                  disabled={updating}
                  className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  {updating ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> Çözüldü Olarak İşaretle</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
