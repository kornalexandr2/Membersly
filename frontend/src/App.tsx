import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

const API_URL = window.location.origin.includes('localhost:5173') ? 'http://localhost:8000' : '/api';

const ClientZone = () => {
  const { t } = useTranslation();
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [coupon, setCoupon] = useState('');
  const [tgUser, setTgUser] = useState<any>(null);
  const [botUsername, setBotUsername] = useState('bot');

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) { tg.ready(); setTgUser(tg.initDataUnsafe?.user); }
    fetch(`${API_URL}/tariffs`).then(res => res.json()).then(data => setTariffs(Array.isArray(data) ? data : []));
    fetch(`${API_URL}/config`).then(res => res.json()).then(data => setBotUsername(data.bot_username));
  }, []);

  const handlePay = (tariffId: number) => {
    fetch(`${API_URL}/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tariff_id: tariffId, user_id: tgUser?.id || 12345, coupon_code: coupon, use_balance: true })
    }).then(res => res.json()).then(data => { if(data.payment_url) window.location.href = data.payment_url; else if(data.status === 'succeeded') alert('Paid with Ⓜ️!'); });
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-black mb-2 text-center tracking-tighter uppercase">{t('welcome')}</h1>
      <div className="mb-6 p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-center">
          <div className="text-[10px] font-bold uppercase text-blue-400 mb-1">Invite friends & get 5% Ⓜ️</div>
          <div className="text-xs font-mono break-all text-neutral-300">https://t.me/{botUsername}?start=ref_{tgUser?.id || 'id'}</div>
      </div>
      <div className="mb-6"><input className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" placeholder={t('promo')} value={coupon} onChange={(e) => setCoupon(e.target.value)} /></div>
      <div className="bg-neutral-900 p-6 rounded-2xl shadow-xl border border-white/5">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><span className="w-2 h-6 bg-blue-500 rounded-full"></span>{t('tariffs')}</h2>
        <div className="grid gap-4">
            {tariffs.map(tariff => (
              <div key={tariff.id} className="p-4 bg-white/5 rounded-xl flex justify-between items-center transition">
                  <div><div className="font-bold text-lg">{tariff.title}</div><div className="text-sm text-neutral-400">{tariff.duration_days} days</div></div>
                  <button onClick={() => handlePay(tariff.id)} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-600/20">{tariff.price} {tariff.currency}</button>
              </div>))}
        </div>
      </div>
    </div>
  );
};

const ManagePayments = ({ token }: { token: string }) => {
    const [payments, setPayments] = useState<any[]>([]);
    useEffect(() => { fetch(`${API_URL}/admin/payments`, { headers: { 'Authorization': `Bearer ${token}` }}).then(res => res.json()).then(data => setPayments(Array.isArray(data) ? data : [])); }, [token]);
    return (
        <div className="bg-neutral-900 rounded-2xl border border-white/5 overflow-hidden">
            <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-neutral-500 uppercase font-bold"><tr className="border-b border-white/5"><th className="p-4">User ID</th><th className="p-4">Amount</th><th className="p-4">Provider</th><th className="p-4">Status</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                    {payments.map(p => (
                        <tr key={p.id} className="hover:bg-white/5">
                            <td className="p-4 font-mono">{p.user_id}</td>
                            <td className="p-4 font-bold">{p.amount} {p.currency}</td>
                            <td className="p-4 text-neutral-400 uppercase">{p.provider}</td>
                            <td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${p.status === 'succeeded' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{p.status}</span></td>
                        </tr>))}
                </tbody>
            </table>
        </div>
    );
};

const AdminDashboard = ({ token }: { token: string }) => {
    const { t } = useTranslation();
    const [view, setView] = useState('stats');
    const [stats, setStats] = useState({ active_subscriptions: 0, total_revenue: 0 });

    useEffect(() => { if (view === 'stats') fetch(`${API_URL}/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` }}).then(res => res.json()).then(data => setStats(data)); }, [view, token]);
    if (!token) return <Navigate to="/login" />;

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-2xl font-black uppercase text-blue-500">Membersly</h1>
                <div className="flex bg-neutral-900 p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar w-full md:w-auto">
                    {['stats', 'bots', 'channels', 'payments', 'users', 'broadcast'].map((v) => (
                        <button key={v} onClick={() => setView(v)} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition ${view === v ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-500'}`}>{v}</button>
                    ))}
                </div>
            </div>
            {view === 'stats' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-8 bg-neutral-900 rounded-3xl border border-white/5 text-center">
                        <div className="text-neutral-500 text-[10px] font-bold uppercase mb-2">Active Subs</div>
                        <div className="text-6xl font-black tracking-tighter">{stats.active_subscriptions}</div>
                    </div>
                    <div className="p-8 bg-neutral-900 rounded-3xl border border-white/5 text-center">
                        <div className="text-neutral-500 text-[10px] font-bold uppercase mb-2">Revenue</div>
                        <div className="text-6xl font-black tracking-tighter text-green-500">{stats.total_revenue} ₽</div>
                    </div>
                </div>
            )}
            {view === 'payments' && <ManagePayments token={token} />}
            {/* Other views omitted for space, logic is consistent */}
        </div>
    );
};

// ... App component remains same
function App() {
    const { i18n } = useTranslation();
    const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
    return (
        <Router>
            <div className="min-h-screen bg-black text-neutral-100 font-sans">
                <nav className="p-4 border-b border-white/5 flex justify-between items-center px-6">
                    <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-neutral-600">
                        <Link to="/" className="hover:text-white transition">Client</Link>
                        <Link to="/admin" className="hover:text-white transition">Admin</Link>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => i18n.changeLanguage('ru')} className={`text-xs ${i18n.language === 'ru' ? 'text-blue-500' : ''}`}>RU</button>
                        <button onClick={() => i18n.changeLanguage('en')} className={`text-xs ${i18n.language === 'en' ? 'text-blue-500' : ''}`}>EN</button>
                        {token && <button onClick={() => { setToken(''); localStorage.removeItem('admin_token'); }} className="text-[10px] font-bold uppercase text-red-500">Logout</button>}
                    </div>
                </nav>
                <div className="py-8"><Routes><Route path="/" element={<ClientZone />} /><Route path="/admin" element={<AdminDashboard token={token} />} /><Route path="/login" element={<div>Login Page Logic</div>} /></Routes></div>
            </div>
        </Router>
    );
}
export default App;
