import React, { useState, useEffect } from 'react';
import { MessageSquare, Play, RefreshCw, Clock, CheckCircle2, AlertCircle, Phone, Info, Terminal } from 'lucide-react';
import api from '../api';

export default function Automation() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/api/admin/notifications/');
      setLogs(response.data);
    } catch (err) {
      console.error('Bildirimler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };


  const handleCheckNow = async () => {
    setChecking(true);
    try {
      await api.post('/api/admin/notifications/', {});
      fetchLogs();
    } catch (err) {
      alert('Kontrol sırasında hata oluştu');
    } finally {
      setChecking(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="text-emerald-500" /> WhatsApp Bildirim Robotu
          </h1>
          <p className="text-gray-400">Sakinlere gidecek otomatik aidat ve vade hatırlatmalarını buradan yönetin.</p>
        </div>
        <button 
          onClick={handleCheckNow}
          disabled={checking}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold rounded-xl transition-all shadow-lg flex items-center gap-2"
        >
          {checking ? <RefreshCw className="animate-spin" size={20} /> : <Play size={20} />}
          Sistemi Kontrol Et & Kuyruğa Ekle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="p-6 border-b border-dark-border flex justify-between items-center bg-dark/20">
              <h3 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                <Clock size={18} className="text-emerald-500" /> Son Bildirimler / Kuyruk
              </h3>
              <button onClick={fetchLogs} className="text-gray-500 hover:text-white transition-all">
                <RefreshCw size={16} />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-dark/40 text-gray-500 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="px-6 py-4">Daire</th>
                    <th className="px-6 py-4">Tür</th>
                    <th className="px-6 py-4">Telefon</th>
                    <th className="px-6 py-4">Tutar</th>
                    <th className="px-6 py-4">Zaman</th>
                    <th className="px-6 py-4">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {loading ? (
                    <tr><td colSpan="6" className="p-12 text-center text-gray-500">Yükleniyor...</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan="6" className="p-12 text-center text-gray-500">Henüz bir bildirim kaydı yok.</td></tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id} className="hover:bg-dark/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-white">Daire {log.apartment}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs px-2 py-1 bg-dark-border rounded text-gray-400">{log.type}</span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                           <div className="flex items-center gap-1 text-emerald-500 font-medium">
                             <Phone size={12} /> {log.phone || 'Yok'}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-white">₺{log.amount}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">{log.sent_at || 'Bekliyor'}</td>
                        <td className="px-6 py-4">
                          {log.status === 'SENT' ? (
                            <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold uppercase">
                              <CheckCircle2 size={14} /> Gönderildi
                            </span>
                          ) : log.status === 'FAILED' ? (
                            <span className="flex items-center gap-1 text-red-500 text-xs font-bold uppercase">
                              <AlertCircle size={14} /> Hata
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-500 text-xs font-bold uppercase animate-pulse">
                              <Clock size={14} /> Kuyrukta
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 bg-emerald-600/10 border-emerald-500/20">
            <h3 className="text-lg font-bold text-emerald-500 mb-4 flex items-center gap-2">
              <Info size={20} /> Robot Nasıl Çalışır?
            </h3>
            <div className="space-y-4 text-sm text-gray-300">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-600 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">1</div>
                <p>Üstteki butona basarak **Ayın 1'inde** veya **Vadeye 2 gün kala** olanları kuyruğa atın.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-600 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">2</div>
                <p>Bilgisayarınızda (Backend klasöründe) robot scriptini başlatın.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-600 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">3</div>
                <p>Robot ilk açıldığında WhatsApp Web QR kodunu taratın.</p>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-dark/50">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
              <Terminal size={18} className="text-gray-500" /> Robotu Başlat
            </h3>
            <div className="bg-black p-4 rounded-xl border border-dark-border mb-4 overflow-x-auto">
              <code className="text-emerald-400 text-xs whitespace-nowrap">
                python scripts/wa_robot.py
              </code>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Bu komutu bilgisayarınızdaki backend klasöründe bir kez çalıştırmanız yeterlidir. Robot açık kalacak ve kuyruğa her mesaj düştüğünde otomatik gönderecektir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
