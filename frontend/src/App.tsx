import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { LoginPage } from './pages/Login';
import { ClientZone } from './pages/ClientZone'; // To be created next
import { AdminDashboard } from './pages/AdminDashboard'; // To be created next

export const API_URL = window.location.origin.includes('localhost') && window.location.port !== '6116' ? 'http://localhost:8000' : '/api';

function App() {
    const { t, i18n } = useTranslation();
    const [token, setToken] = useState(localStorage.getItem('admin_token') || '');

    return (
        <Router>
            <div className="min-h-screen bg-black text-neutral-100 font-sans selection:bg-blue-500/30">
                <nav className="p-6 border-b border-white/5 flex justify-between items-center px-10">
                    <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600">
                        <Link to="/" className="hover:text-white transition">{t('nav_terminal')}</Link>
                        <Link to="/admin" className="hover:text-white transition">{t('nav_control')}</Link>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex gap-3 text-[10px] font-black uppercase">
                            <button onClick={() => i18n.changeLanguage('ru')} className={i18n.language === 'ru' ? 'text-blue-500' : 'text-neutral-700'}>RU</button>
                            <button onClick={() => i18n.changeLanguage('en')} className={i18n.language === 'en' ? 'text-blue-500' : 'text-neutral-700'}>EN</button>
                        </div>
                        {token && <button onClick={() => { setToken(''); localStorage.removeItem('admin_token'); }} className="text-[10px] font-black uppercase text-red-600/40 hover:text-red-500 transition border border-red-500/10 px-4 py-1.5 rounded-full">{t('nav_exit')}</button>}
                    </div>
                </nav>
                <div className="py-8">
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
