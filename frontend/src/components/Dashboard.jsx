import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Wrench, Loader2 } from 'lucide-react';
import api from '../api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // API'den verileri çekiyoruz
    api.get('/api/dashboard/')
      .then(response => {
        setData(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Dashboard veri hatası:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-gray-400">Veriler Yükleniyor...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 bg-red-500/10 p-4 rounded-lg">Veriler yüklenirken bir sorun oluştu. Sunucunun çalıştığından emin olun.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card flex items-center gap-4">
          <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400">Kasa Durumu</p>
            <h3 className="text-2xl font-bold text-white">₺{data.balance.toLocaleString('tr-TR')}</h3>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-4 bg-red-500/10 text-red-500 rounded-lg">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400">Toplam Borç</p>
            <h3 className="text-2xl font-bold text-white">₺{data.total_debt.toLocaleString('tr-TR')}</h3>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-4 bg-blue-500/10 text-blue-500 rounded-lg">
            <Wrench size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400">Yaklaşan Bakım</p>
            <h3 className="text-xl font-bold text-white">
              {data.maintenance_data 
                ? `${data.maintenance_data.title} (${data.maintenance_data.days_left} Gün)`
                : 'Planlanan Bakım Yok'}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Son İşlemler</h3>
          <div className="space-y-4">
            {data.recent_transactions.length === 0 ? (
              <p className="text-gray-500 italic pb-2">Henüz hiçbir işlem bulunmuyor.</p>
            ) : (
              data.recent_transactions.map(tx => (
                <div key={tx.id} className="flex justify-between items-center pb-2 border-b border-dark-border">
                  <div>
                    <p className="text-white">{tx.title}</p>
                    <p className="text-sm text-gray-400">{tx.date}</p>
                  </div>
                  <span className={`font-medium ${tx.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {tx.positive ? '+' : '-'}₺{tx.amount.toLocaleString('tr-TR')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Daire Borç Durumu</h3>
          <div className="space-y-4">
            {data.apartment_statuses.length === 0 ? (
               <p className="text-gray-500 italic p-3">Sistemde kayıtlı daire bulunmuyor.</p>
            ) : (
              data.apartment_statuses.map(apt => (
                <div key={apt.id} className="flex justify-between items-center p-3 rounded-lg bg-dark-border/50">
                  <div className="flex flex-col">
                    <span className="text-white">Daire {apt.number}</span>
                    <span className="text-gray-400 text-xs">{apt.owner}</span>
                  </div>
                  {apt.debt > 0 ? (
                    <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-500 text-sm">Borçlu: ₺{apt.debt.toLocaleString('tr-TR')}</span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-sm">Ödendi</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
