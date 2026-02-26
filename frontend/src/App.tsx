import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

const API_URL = window.location.origin.includes('localhost:5173') ? 'http://localhost:8000' : '/api';

const ClientZone = () => {
  const { t } = useTranslation();
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [tgUser, setTgUser] = useState<any>(null);
  const [botUsername, setBotUsername] = useState('bot');

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) { tg.ready(); setTgUser(tg.initDataUnsafe?.user); }
    fetch(`${API_URL}/tariffs`).then(res => res.json()).then(data => setTariffs(Array.isArray(data) ? data : []));
    fetch(`${API_URL}/config`).then(res => res.json()).then(data => setBotUsername(data.bot_username));
  }, []);

  const handlePay = (t_id: number) => {
    fetch(`${API_URL}/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tariff_id: t_id, user_id: tgUser?.id || 12345, use_balance: true })
    }).then(res => res.json()).then(data => { if(data.payment_url) window.location.href = data.payment_url; });
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-black mb-6 text-center uppercase tracking-tighter">{t('welcome')}</h1>
      <div className="bg-neutral-900 p-6 rounded-3xl border border-white/5 shadow-2xl">
        <h2 className="text-lg font-bold mb-4 uppercase text-blue-500 tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span> {t('tariffs')}
        </h2>
        <div className="grid gap-3">
            {tariffs.map(t_item => (
              <div key={t_item.id} className="p-4 bg-white/[0.03] rounded-2xl flex justify-between items-center border border-white/5 hover:border-white/10 transition">
                  <div>
                    <div className="font-bold text-lg">{t_item.title}</div>
                    <div className="text-[10px] text-neutral-500 uppercase font-black">{t_item.duration_days} days access</div>
                  </div>
                  <button onClick={() => handlePay(t_item.id)} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                    {t_item.price} {t_item.currency}
                  </button>
              </div>))}
        </div>
      </div>
      <div className="mt-8 p-4 bg-white/5 rounded-2xl text-center">
          <div className="text-[10px] font-bold text-neutral-500 uppercase mb-1">Your Referral Link (5% Bonus)</div>
          <div className="text-xs font-mono text-blue-400 break-all">https://t.me/{botUsername}?start=ref_{tgUser?.id || 'id'}</div>
      </div>
    </div>
  );
};

const AdminDashboard = ({ token }: { token: string }) => {
    const { t } = useTranslation();
    const [view, setView] = useState('stats');
    const [stats, setStats] = useState<any>({ active_subscriptions: 0, total_revenue: 0, new_users_today: 0, monthly_revenue: 0 });

    useEffect(() => {
        if (view === 'stats') {
            fetch(`${API_URL}/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` }})
                .then(res => res.json()).then(data => setStats(data));
        }
    }, [view, token]);

    if (!token) return <Navigate to="/login" />;

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                <h1 className="text-2xl font-black uppercase text-blue-500 tracking-tighter">Membersly <span className="text-white/20">Admin</span></h1>
                <div className="flex bg-neutral-900 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
                    {['stats', 'bots', 'channels', 'tariffs', 'broadcast', 'users'].map((v) => (
                        <button key={v} onClick={() => setView(v)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${view === v ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-neutral-500 hover:text-neutral-300'}`}>{v}</button>
                    ))}
                </div>
            </div>

            {view === 'stats' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Active Subs" value={stats.active_subscriptions} />
                    <StatCard label="Total Rev" value={`${stats.total_revenue} ₽`} color="text-green-500" />
                    <StatCard label="Last 30d" value={`${stats.monthly_revenue} ₽`} color="text-blue-400" />
                    <StatCard label="New Today" value={stats.new_users_today} />
                </div>
            )}
            {/* Other views logic... */}
        </div>
    );
};

const StatCard = ({ label, value, color = "text-white" }: any) => (
    <div className="p-6 bg-neutral-900 rounded-3xl border border-white/5 shadow-xl">
        <div className="text-[10px] font-black uppercase text-neutral-500 mb-2 tracking-widest">{label}</div>
        <div className={`text-4xl font-black tracking-tighter ${color}`}>{value}</div>
    </div>
);

// App & Auth remains same...
function App() {
    const { i18n } = useTranslation();
    const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
    return (
        <Router>
            <div className="min-h-screen bg-black text-neutral-100 font-sans selection:bg-blue-500/30">
                <nav className="p-4 border-b border-white/5 flex justify-between items-center px-8">
                    <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">
                        <Link to="/" className="hover:text-white transition">User</Link>
                        <Link to="/admin" className="hover:text-white transition">Admin</Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex gap-2 text-[10px] font-bold">
                            <button onClick={() => i18n.changeLanguage('ru')} className={i18n.language === 'ru' ? 'text-blue-500' : 'text-neutral-600'}>RU</button>
                            <button onClick={() => i18n.changeLanguage('en')} className={i18n.language === 'en' ? 'text-blue-500' : 'text-neutral-600'}>EN</button>
                        </div>
                        {token && <button onClick={() => { setToken(''); localStorage.removeItem('admin_token'); }} className="text-[10px] font-black uppercase text-red-500/50 hover:text-red-500 transition">Logout</button>}
                    </div>
                </nav>
                <div className="py-8"><Routes><Route path="/" element={<ClientZone />} /><Route path="/admin" element={<AdminDashboard token={token} />} /><Route path="/login" element={<div>Login Logic</div>} /></Routes></div>
            </div>
        </Router>
    );
}
export default App;
