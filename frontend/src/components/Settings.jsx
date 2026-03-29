import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, DollarSign, Info, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../api';

export default function Settings() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/admin/settings/');
      setAmount(response.data.default_dues_amount);
    } catch (err) {
      console.error('Ayarlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };


  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/admin/settings/', 
        { default_dues_amount: amount }
      );
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Ayarlar güncellenirken hata oluştu.');
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-gray-400">Ayarlar yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Apartman Ayarları</h1>
        <p className="text-gray-400 font-medium">Bina genelindeki temel parametreleri buradan güncelleyebilirsiniz.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
            <form onSubmit={handleUpdate} className="card bg-dark-card border-dark-border space-y-8 shadow-2xl">
                <div className="flex items-center gap-4 border-b border-dark-border pb-6">
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center shadow-inner">
                        <SettingsIcon size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Genel Tahakkuk Ayarları</h2>
                        <p className="text-xs text-gray-500">Bu ayarlar tüm otomatik borçlandırma işlemlerini etkiler.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Varsayılan Aidat Tutarı (TL)</label>
                        <div className="relative group">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                            <input 
                                type="number" 
                                required
                                className="w-full bg-dark/50 border border-dark-border rounded-2xl py-5 pl-12 pr-4 text-2xl font-black text-white focus:outline-none focus:border-emerald-500 transition-all shadow-xl"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                        <p className="text-[11px] text-gray-500 flex items-center gap-2 mt-2 px-1">
                            <Info size={14} className="text-emerald-500" />
                            Yeni aydan itibaren otomatik olarak oluşturulacak aidat miktarıdır.
                        </p>
                    </div>
                </div>

                <div className="pt-6 border-t border-dark-border flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-500 transition-all duration-500 opacity-100">
                        {success && (
                            <>
                                <CheckCircle2 size={18} />
                                <span className="text-sm font-bold">Ayarlar başarıyla kaydedildi.</span>
                            </>
                        )}
                    </div>
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-600/20 uppercase tracking-widest text-xs flex items-center gap-3 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Değişiklikleri Uygula
                    </button>
                </div>
            </form>
        </div>

        <div className="space-y-6">
            <div className="card bg-emerald-500/5 border-emerald-500/10">
                <h3 className="text-sm font-bold text-emerald-500 mb-2">Yönetici Notu</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Aidat tutarını değiştirdiğinizde, halihazırda bu ay için oluşturulmuş aidatlar **etkilenmez.** 
                    Değişiklik, takip eden ayın ilk günü yapılacak otomatik tahakkuklarda geçerli olacaktır.
                </p>
            </div>
            
            <div className="card bg-blue-500/5 border-blue-500/10">
                <h3 className="text-sm font-bold text-blue-500 mb-2">Sistem Bilgisi</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Sistem her ayın 1'inde otomatik olarak tüm faal dairelere burada belirlediğiniz tutar üzerinden "Düzenli Aidat" borcu atar.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
