import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Trash2, Calendar, CheckCircle2, Clock, Loader2, X, DollarSign, PenTool } from 'lucide-react';
import api from '../api';

export default function Maintenance() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    cost: ''
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/api/admin/maintenance/');
      setLogs(response.data);
    } catch (err) {
      console.error('Bakım kayıtları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };


  const handleAddLog = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/maintenance/', formData);
      setShowAddModal(false);
      setFormData({ title: '', scheduled_date: new Date().toISOString().split('T')[0], cost: '' });
      fetchLogs();
    } catch (err) {
      alert('Kayıt oluşturulamadı.');
    }
  };


  const toggleComplete = async (id, currentStatus) => {
    try {
      await api.patch(`/api/admin/maintenance/${id}/update/`, 
        { is_completed: !currentStatus }
      );
      fetchLogs();
    } catch (err) {
      alert('Güncelleme hatası.');
    }
  };


  const handleDeleteLog = async (id) => {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/api/admin/maintenance/${id}/delete/`);
      fetchLogs();
    } catch (err) {
      alert('Silme hatası.');
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-gray-400">Bakım takvimi yükleniyor...</p>
      </div>
    );
  }

  const upcoming = logs.filter(l => !l.is_completed);
  const completed = logs.filter(l => l.is_completed);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white">Bakım Takvimi</h1>
          <p className="text-gray-400 font-medium">Binadaki asansör, hidrofor ve genel bakım planlarını yönetin.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center gap-2"
        >
          <Plus size={20} /> Bakım Planla
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Planned Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-white">Planlanan Bakımlar</h2>
            <span className="ml-2 bg-blue-500/10 text-blue-500 text-xs px-2 py-0.5 rounded-md">{upcoming.length} Aktif</span>
          </div>
          
          {upcoming.length === 0 ? (
            <div className="card text-center py-10 text-gray-500 italic border-dashed border-2">Yakın zamanda planlanan bakım yok.</div>
          ) : (
            upcoming.map(log => (
              <div key={log.id} className="card bg-dark-card border-dark-border hover:border-blue-500/30 transition-all p-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{log.title}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar size={12} /> {log.scheduled_date}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleComplete(log.id, log.is_completed)}
                      className="px-3 py-1.5 bg-emerald-600/10 text-emerald-500 text-xs font-bold rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                    >
                      Tamamla
                    </button>
                    <button 
                      onClick={() => handleDeleteLog(log.id)}
                      className="p-1.5 text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Completed Section */}
        <section className="space-y-4">
           <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-white">Tamamlananlar</h2>
          </div>

          {completed.length === 0 ? (
            <div className="card text-center py-10 text-gray-500 italic border-dashed border-2">Henüz tamamlanan bir kayıt yok.</div>
          ) : (
            completed.map(log => (
              <div key={log.id} className="card bg-emerald-500/5 border-emerald-500/10 p-5 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <CheckCircle2 className="text-emerald-500" size={24} />
                    <div>
                      <h3 className="font-bold text-white line-through decoration-gray-600">{log.title}</h3>
                      <p className="text-xs text-gray-500">{log.scheduled_date} tarihinde yapıldı.</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">₺{log.cost ? log.cost.toLocaleString('tr-TR') : '0'}</p>
                    <button 
                       onClick={() => toggleComplete(log.id, log.is_completed)}
                       className="text-[10px] text-gray-500 hover:text-blue-500 underline"
                    >
                       Geri Al
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <form onSubmit={handleAddLog} className="bg-dark-card border border-dark-border w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-dark-border flex justify-between items-center bg-dark/40">
              <h3 className="text-2xl font-black text-white">Yeni Bakım Planı</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white transition-colors"><X size={28} /></button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Bakım Konusu</label>
                <div className="relative">
                    <PenTool className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="text" 
                      required
                      placeholder="Örn: Asansör Motor Yağlaması"
                      className="w-full bg-dark/50 border border-dark-border rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Planlanan Tarih</label>
                  <input 
                    type="date" 
                    required
                    className="w-full bg-dark/50 border border-dark-border rounded-xl py-4 px-4 text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Tahmini Maliyet</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="number" 
                      placeholder="0.00"
                      className="w-full bg-dark/50 border border-dark-border rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
                      value={formData.cost}
                      onChange={(e) => setFormData({...formData, cost: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-dark/40 border-t border-dark-border">
              <button 
                type="submit" 
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-blue-600/20 uppercase tracking-widest text-xs"
              >
                Planı Sisteme İşle
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
