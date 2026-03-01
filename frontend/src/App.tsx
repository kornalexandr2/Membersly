import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { LoginPage } from './pages/Login';
import { ClientZone } from './pages/ClientZone';
import { AdminDashboard } from './pages/AdminDashboard';

export const API_URL = window.location.origin.includes('localhost') && window.location.port !== '6116' ? 'http://localhost:8000' : '/api';

function App() {
    const { t, i18n } = useTranslation();
    const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
    const isTg = !!(window as any).Telegram?.WebApp?.initData;

    return (
        <Router>
            <div className="min-h-screen bg-black text-neutral-100 font-sans selection:bg-blue-500/30">
                {!isTg && (
                    <nav className="p-6 md:p-10 border-b border-white/10 flex flex-col md:flex-row justify-between items-center px-6 md:px-16 bg-neutral-900/80 backdrop-blur-xl sticky top-0 z-50 shadow-2xl gap-6 md:gap-0">
                        <div className="flex gap-8 md:gap-16 text-xs md:text-sm font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-neutral-300">
                            <Link to="/" className="hover:text-blue-400 transition-all duration-300 hover:scale-105 active:scale-95">{t('nav_terminal')}</Link>
                            <Link to="/admin" className="hover:text-blue-400 transition-all duration-300 hover:scale-105 active:scale-95">{t('nav_control')}</Link>
                        </div>
                        <div className="flex items-center gap-6 md:gap-10">
                            <div className="flex gap-4 md:gap-6 text-xs md:text-sm font-black uppercase tracking-widest">
                                <button onClick={() => i18n.changeLanguage('ru')} className={`transition-all duration-300 px-3 py-1.5 rounded-lg border ${i18n.language === 'ru' ? 'text-blue-500 bg-blue-500/10 border-blue-500/20 scale-110' : 'text-neutral-400 border-transparent hover:text-white hover:border-white/10'}`}>RU</button>
                                <button onClick={() => i18n.changeLanguage('en')} className={`transition-all duration-300 px-3 py-1.5 rounded-lg border ${i18n.language === 'en' ? 'text-blue-500 bg-blue-500/10 border-blue-500/20 scale-110' : 'text-neutral-400 border-transparent hover:text-white hover:border-white/10'}`}>EN</button>
                            </div>
                            {token && <button onClick={() => { setToken(''); localStorage.removeItem('admin_token'); }} className="text-[10px] md:text-xs font-black uppercase text-red-500 hover:text-white hover:bg-red-600 transition-all duration-300 border-2 border-red-500/30 px-6 md:px-8 py-2 md:py-2.5 rounded-full bg-red-500/5 active:scale-90">{t('nav_exit')}</button>}
                        </div>
                    </nav>
                )}
                <div className={isTg ? "" : "py-8"}>
                    <Routes>
                        <Route path="/" element={<ClientZone apiUrl={API_URL} />} />
                        <Route path="/login" element={<LoginPage setToken={setToken} apiUrl={API_URL} />} />
                        <Route path="/admin" element={<AdminDashboard token={token} apiUrl={API_URL} />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
