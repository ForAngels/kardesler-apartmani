import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Building, Wallet, Wrench, Home, LogOut, Menu, X, User as UserIcon, MessageSquare, FileText, CreditCard, Loader2, Settings as SettingsIcon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import TenantDashboard from './components/TenantDashboard';
import Login from './components/Login';
import AdminFeedbacks from './components/AdminFeedbacks';
import Apartments from './components/Apartments';
import ExtraPayments from './components/ExtraPayments';
import Reports from './components/Reports';
import DuesManagement from './components/DuesManagement';
import Expenses from './components/Expenses';
import Maintenance from './components/Maintenance';
import Settings from './components/Settings';
import Automation from './components/Automation';

import api from './api';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(!!localStorage.getItem('token'));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/api/dashboard/');
          setIsAdmin(res.data.is_admin);
          setIsAuthenticated(true);
        } catch (err) {
          handleLogout();
        } finally {
          setAuthLoading(false);
        }
      } else {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [isAuthenticated]);


  const handleLoginSuccess = (adminStatus) => {
    setIsAdmin(adminStatus);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
        <p className="text-gray-400 font-medium">Oturum kontrol ediliyor...</p>
      </div>
    );
  }

  // Menü tıklandığında mobilde kapat
  const closeMenu = () => setIsMobileMenuOpen(false);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const navLinks = isAdmin ? [
    { to: "/", icon: <Home size={20} />, label: "Dashboard" },
    { to: "/apartments", icon: <Building size={20} />, label: "Daireler" },
    { to: "/dues", icon: <CreditCard size={20} />, label: "Aidat Tahsilat" },
    { to: "/extra-payments", icon: <Wallet size={20} />, label: "Ekstra Ödemeler" },
    { to: "/reports", icon: <FileText size={20} />, label: "Raporlar" },
    { to: "/expenses", icon: <Wallet size={20} />, label: "Giderler & Borçlar" },
    { to: "/maintenance", icon: <Wrench size={20} />, label: "Bakım Takvimi" },
    { to: "/feedbacks", icon: <MessageSquare size={20} />, label: "Şikayet & Talepler" },
    { to: "/automation", icon: <MessageSquare size={20} />, label: "WP Robotu" },
    { to: "/settings", icon: <SettingsIcon size={20} />, label: "Ayarlar" },
  ] : [
    { to: "/", icon: <Home size={20} />, label: "Panelim" },
  ];

  return (
    <div className="flex h-screen bg-dark text-gray-200">
      {/* Sidebar (Desktop) / Drawer (Mobile) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-dark-card border-r border-dark-border transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-dark-border flex justify-between items-center">
          <h1 className="text-xl font-bold text-emerald-500 flex items-center gap-2">
            <Building size={24} /> Kardeşler Apt.
          </h1>
          <button onClick={closeMenu} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navLinks.map(link => (
            <Link 
              key={link.to} 
              to={link.to} 
              onClick={closeMenu}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                location.pathname === link.to 
                ? 'bg-emerald-600/10 text-emerald-500 border border-emerald-500/20' 
                : 'text-gray-400 hover:bg-dark-border hover:text-white'
              }`}
            >
              {link.icon} {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-dark-border">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar (Mobile only) */}
        <header className="lg:hidden p-4 bg-dark-card border-b border-dark-border flex justify-between items-center shrink-0">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-400 hover:text-white">
            <Menu size={24} />
          </button>
          <span className="font-bold text-emerald-500 italic">Kardeşler Apt.</span>
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
            {isAdmin ? 'A' : 'S'}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <header className="hidden lg:flex mb-8 justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                {isAdmin ? 'Yönetici Paneli' : 'Sakin Paneli'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">Sistem Durumu: Çevrimiçi</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col text-right">
                <span className="text-sm font-medium text-white">{isAdmin ? 'Apartman Yöneticisi' : 'Daire Sakini'}</span>
                <span className="text-xs text-gray-500">Çevrimiçi</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-500/20 flex items-center justify-center text-white text-xl font-bold">
                {isAdmin ? 'A' : <UserIcon size={24} />}
              </div>
            </div>
          </header>
          
          <Routes>
            <Route path="/" element={isAdmin ? <Dashboard /> : <TenantDashboard />} />
            {isAdmin && (
              <>
                <Route path="/apartments" element={<Apartments />} />
                <Route path="/dues" element={<DuesManagement />} />
                <Route path="/extra-payments" element={<ExtraPayments />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/feedbacks" element={<AdminFeedbacks />} />
                <Route path="/automation" element={<Automation />} />
                <Route path="/settings" element={<Settings />} />
              </>
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Overlay for mobile drawer */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMenu}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
