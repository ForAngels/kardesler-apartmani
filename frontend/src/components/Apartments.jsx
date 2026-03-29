import React, { useState, useEffect, useRef } from 'react';
import { Building, User, Wallet, Clock, AlertCircle, CheckCircle2, ChevronRight, X, Loader2, Info, Plus, Settings, Trash2, Search, Save, Phone, MessageSquare as MessageCircle } from 'lucide-react';
import api from '../api';

export default function Apartments() {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Selected State
  const [selectedApt, setSelectedApt] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ number: '', type: 'KONUT', owner_id: '', tenant_id: '', phone_number: '' });
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [activeUserSearch, setActiveUserSearch] = useState(null); // 'owner' or 'tenant'

  useEffect(() => {
    fetchApartments();
  }, []);

  const fetchApartments = async () => {
    try {
      const response = await api.get('/api/admin/apartments/');
      setApartments(response.data);
      setError('');
    } catch (err) {
      setError('Daireler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };


  const handleAddApartment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/apartments/create/', formData);
      setShowAddModal(false);
      setFormData({ number: '', type: 'KONUT', owner_id: '', tenant_id: '', phone_number: '' });
      fetchApartments();
    } catch (err) {
      alert(err.response?.data?.error || 'Daire eklenemedi.');
    }
  };


  const handleUpdateApartment = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/api/admin/apartments/${selectedApt.id}/update/`, formData);
      setShowEditModal(false);
      fetchApartments();
    } catch (err) {
      alert('Güncelleme hatası.');
    }
  };


  const handleDeleteApartment = async (id) => {
    if (!window.confirm('Bu daireyi silmek istediğinize emin misiniz? Tüm ödeme geçmişi de silinecektir.')) return;
    try {
      await api.delete(`/api/admin/apartments/${id}/delete/`);
      fetchApartments();
    } catch (err) {
      alert('Silme hatası.');
    }
  };


  const fetchHistory = async (id) => {
    setHistoryLoading(true);
    setShowHistoryModal(true);
    try {
      const response = await api.get(`/api/admin/apartments/${id}/history/`);
      setHistory(response.data.history);
      setSelectedApt(apartments.find(a => a.id === id));
    } catch (err) {
      alert('Geçmiş veriler alınamadı.');
    } finally {
      setHistoryLoading(false);
    }
  };


  const handleSearchUsers = async (query) => {
    if (query.length < 2) {
      setUserSearchResults([]);
      return;
    }
    try {
      const response = await api.get(`/api/admin/users/search/?q=${query}`);
      setUserSearchResults(response.data);
    } catch (err) {
      console.error(err);
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-gray-400">Daire Listesi Hazırlanıyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Daire Yönetimi</h1>
          <p className="text-gray-400">Tüm dairelerin güncel durumunu buradan yönetebilirsiniz.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setFormData({ number: '', type: 'KONUT', owner_id: '', tenant_id: '', phone_number: '' });
              setShowAddModal(true);
            }}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg flex items-center gap-2"
          >
            <Plus size={20} /> Yeni Daire Ekle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apartments.map(apt => (
          <div 
            key={apt.id} 
            className="card hover:border-emerald-500/40 transition-all group relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-dark-border rounded-xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Building size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Daire {apt.number}</h3>
                  <p className="text-xs text-gray-500 uppercase font-semibold">{apt.type}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedApt(apt);
                    setFormData({ number: apt.number, type: apt.type === 'Konut' ? 'KONUT' : 'ISYERI', owner_id: '', tenant_id: '', phone_number: apt.phone_number || '' });
                    setShowEditModal(true);
                  }}
                  className="p-2 bg-dark-border hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-all"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <User size={16} className="text-gray-500" />
                <span className="truncate flex-1">Ev Sahibi: <span className="text-white">{apt.owner}</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <User size={16} className="text-gray-500" />
                <span className="truncate flex-1">Kiracı/Sakin: <span className="text-white">{apt.tenant}</span></span>
              </div>
              {apt.phone_number && (
                <div className="flex items-center gap-2 text-sm text-emerald-500 font-medium">
                  <Phone size={14} />
                  <span>{apt.phone_number}</span>
                  <a 
                    href={`https://wa.me/${apt.phone_number.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 p-1 bg-emerald-500/10 rounded-md hover:bg-emerald-500 hover:text-white transition-all"
                    title="WhatsApp Mesaj Gönder"
                  >
                    <MessageCircle size={12} />
                  </a>
                </div>
              )}
              
              <div onClick={() => fetchHistory(apt.id)} className="pt-4 mt-4 border-t border-dark-border flex justify-between items-center cursor-pointer hover:bg-dark/20 p-2 rounded-lg transition-colors">
                <div>
                   <p className="text-xs text-gray-500 uppercase font-bold">Ödeme Durumu</p>
                   <span className={`text-xs font-bold ${
                     apt.current_month_status === 'Ödendi' ? 'text-emerald-500' : 'text-red-500'
                   }`}>
                     {apt.current_month_status}
                   </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase font-bold">Toplam Borç</p>
                  <p className={`text-lg font-bold ${apt.total_debt > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    ₺{apt.total_debt.toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-dark-border flex justify-end">
                <button 
                  onClick={() => handleDeleteApartment(apt.id)}
                  className="text-gray-600 hover:text-red-500 flex items-center gap-1 text-xs font-bold transition-colors"
                >
                  <Trash2 size={14} /> Daireyi Kaldır
                </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Apartment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <form onSubmit={handleAddApartment} className="bg-dark-card border border-dark-border w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-dark-border flex justify-between items-center bg-dark/40">
              <h3 className="text-xl font-bold text-white">Yeni Daire Ekle</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400">Daire Numarası</label>
                <input 
                  type="number" 
                  required
                  className="w-full bg-dark/50 border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                  placeholder="Örn: 10"
                />
                <p className="text-[10px] text-gray-500">Bu numaraya ait "daire{formData.number}" kullanıcı adı ve "daire{formData.number}2026" şifresi otomatik oluşturulacaktır.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400">Daire Türü</label>
                <select 
                  className="w-full bg-dark/50 border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="KONUT">Konut</option>
                  <option value="ISYERI">İş Yeri</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400">Telefon Numarası (WP Bildirimi İçin)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                    type="text" 
                    className="w-full bg-dark/50 border border-dark-border rounded-xl py-3 pl-10 pr-3 text-white focus:outline-none focus:border-emerald-500"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    placeholder="905xxxxxxxxx"
                  />
                </div>
                <p className="text-[10px] text-gray-500 italic">Başında 90 olacak şekilde 12 hane giriniz.</p>
              </div>
            </div>
            <div className="p-6 bg-dark/40 border-t border-dark-border">
              <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all">Daireyi Kaydet</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Apartment Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <form onSubmit={handleUpdateApartment} className="bg-dark-card border border-dark-border w-full max-w-md rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-dark-border flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Daire {selectedApt.number} Düzenle</h3>
              <button type="button" onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Owner Search */}
              <div className="space-y-2 relative">
                <label className="text-sm font-bold text-gray-400">Ev Sahibi Değiştir</label>
                <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 bg-dark/50 border border-dark-border rounded-xl p-3 text-white text-sm"
                      placeholder="Kullanıcı ara..."
                      onChange={(e) => {
                        setActiveUserSearch('owner');
                        handleSearchUsers(e.target.value);
                      }}
                    />
                    <div className="bg-dark-border px-3 py-3 rounded-xl text-gray-400 text-xs flex items-center">
                        Mevcut: {selectedApt.owner}
                    </div>
                </div>
                {activeUserSearch === 'owner' && userSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-dark-card border border-dark-border rounded-xl mt-2 overflow-hidden shadow-2xl">
                    {userSearchResults.map(user => (
                      <div key={user.id} onClick={() => {
                        setFormData({...formData, owner_id: user.id});
                        setUserSearchResults([]);
                        setActiveUserSearch(null);
                      }} className="p-3 hover:bg-emerald-600 cursor-pointer text-sm text-white">
                        {user.full_name} (@{user.username})
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tenant Search */}
              <div className="space-y-2 relative">
                <label className="text-sm font-bold text-gray-400">Kiracı/Sakin Değiştir</label>
                <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 bg-dark/50 border border-dark-border rounded-xl p-3 text-white text-sm"
                      placeholder="Kullanıcı ara..."
                      onChange={(e) => {
                        setActiveUserSearch('tenant');
                        handleSearchUsers(e.target.value);
                      }}
                    />
                    <div className="bg-dark-border px-3 py-3 rounded-xl text-gray-400 text-xs flex items-center">
                        Mevcut: {selectedApt.tenant}
                    </div>
                </div>
                {activeUserSearch === 'tenant' && userSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-dark-card border border-dark-border rounded-xl mt-2 overflow-hidden shadow-2xl">
                    {userSearchResults.map(user => (
                      <div key={user.id} onClick={() => {
                        setFormData({...formData, tenant_id: user.id});
                        setUserSearchResults([]);
                        setActiveUserSearch(null);
                      }} className="p-3 hover:bg-emerald-600 cursor-pointer text-sm text-white">
                        {user.full_name} (@{user.username})
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400">Telefon Numarası Güncelle</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                    type="text" 
                    className="w-full bg-dark/50 border border-dark-border rounded-xl py-3 pl-10 pr-3 text-white focus:outline-none focus:border-emerald-500"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    placeholder="905xxxxxxxxx"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-dark-border flex gap-3">
              <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-dark-border text-white font-bold rounded-xl outline-none">İptal</button>
              <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"><Save size={18} /> Güncelle</button>
            </div>
          </form>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedApt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-dark-card border border-dark-border w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-dark-border flex justify-between items-center bg-dark/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                  {selectedApt.number}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Daire {selectedApt.number} - Ödeme Geçmişi</h3>
                  <p className="text-sm text-gray-400">{selectedApt.owner}</p>
                </div>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {historyLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-500" /></div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Bu daireye ait henüz bir ödeme kaydı bulunmuyor.</div>
              ) : (
                <div className="space-y-3">
                  {history.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-dark/30 rounded-xl border border-dark-border/50">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${item.is_paid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {item.is_paid ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        </div>
                        <div>
                          <p className="text-white font-semibold">{item.description || 'Aidat Ödemesi'}</p>
                          <p className="text-xs text-gray-500">Son Ödeme: {item.due_date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">₺{item.amount.toLocaleString('tr-TR')}</p>
                        {item.is_paid ? (
                          <p className="text-xs text-emerald-500 font-medium">Ödendi: {item.paid_date}</p>
                        ) : (
                          <p className="text-xs text-red-500 font-medium uppercase tracking-wider">Bekliyor</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-dark-border flex justify-end">
              <button onClick={() => setShowHistoryModal(false)} className="px-8 py-2 bg-dark-border text-white font-bold rounded-xl">Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
