import React, { useState } from 'react';
import { Building, Lock, User, Loader2 } from 'lucide-react';
import api from '../api';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/token/', {
        username,
        password,
      });

      const { access, refresh } = response.data;
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      
      // Kullanıcının admin olup olmadığını kontrol etmek için stats çekiyoruz
      const statsRes = await api.get('/api/dashboard/');

      onLoginSuccess(statsRes.data.is_admin);

    } catch (err) {
      console.error("Giriş hatası:", err);
      if (err.response) {
        // Sunucudan hata cevabı geldi (401, 400 vb)
        setError('Geçersiz kullanıcı adı veya şifre.');
      } else if (err.request) {
        // İstek yapıldı ama cevap gelmedi (Sunucu kapalı olabilir)
        setError('Sunucuya bağlanılamadı. Lütfen backend sisteminin çalıştığından emin olun.');
      } else {
        setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-6">
      <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
            <Building size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Kardeşler Apartmanı</h1>
          <p className="text-gray-400 text-sm mt-2">Yönetim Sistemine Giriş Yapın</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Kullanıcı Adı</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                required
                className="w-full bg-dark-border/30 border border-dark-border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="admin veya konut_no"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Şifre</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="password"
                required
                className="w-full bg-dark-border/30 border border-dark-border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
