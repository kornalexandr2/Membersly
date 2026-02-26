import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

// Use /api as prefix when running behind Nginx, fallback to localhost for dev
const API_URL = window.location.origin.includes('localhost:5173') ? 'http://localhost:8000' : '/api';

const Login = ({ setToken }: { setToken: (t: string) => void }) => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password })
        });
        if (res.ok) {
            const data = await res.json();
            setToken(data.access_token);
            localStorage.setItem('admin_token', data.access_token);
            navigate('/admin');
        } else {
            alert('Неверный логин или пароль');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <form onSubmit={handleLogin} className="bg-neutral-900 p-8 rounded-3xl border border-white/10 w-full max-w-sm">
                <h2 className="text-2xl font-black mb-6 text-center uppercase tracking-tighter">Admin Login</h2>
                <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 mb-4 outline-none focus:border-blue-500" placeholder="Login" value={login} onChange={e => setLogin(e.target.value)} />
                <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 mb-6 outline-none focus:border-blue-500" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                <button className="w-full bg-blue-600 py-4 rounded-2xl font-bold hover:bg-blue-500 transition">Войти</button>
            </form>
        </div>
    );
};

const ClientZone = () => {
  const { t } = useTranslation();
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [coupon, setCoupon] = useState('');
  const [userId] = useState(12345); // Placeholder for Telegram ID

  useEffect(() => {
    fetch(`${API_URL}/tariffs`).then(res => res.json()).then(data => setTariffs(Array.isArray(data) ? data : []));
  }, []);

  const handlePay = (tariffId: number) => {
    fetch(`${API_URL}/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tariff_id: tariffId, user_id: userId, coupon_code: coupon })
    }).then(res => res.json()).then(data => { if(data.payment_url) window.location.href = data.payment_url; });
  };

  const refLink = `https://t.me/your_bot?start=ref_${userId}`;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">{t('welcome')}</h1>
      
      <div className="mb-6 p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-center">
          <div className="text-[10px] font-bold uppercase text-blue-400 mb-1">Приглашайте друзей и получайте 5%</div>
          <div className="text-xs font-mono break-all text-neutral-300">{refLink}</div>
      </div>

      <div className="mb-6"><input className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" placeholder={t('promo')} value={coupon} onChange={(e) => setCoupon(e.target.value)} /></div>
      <div className="bg-neutral-900 p-6 rounded-2xl shadow-xl border border-white/5">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><span className="w-2 h-6 bg-blue-500 rounded-full"></span>{t('tariffs')}</h2>
        <div className="grid gap-4">
            {tariffs.map(tariff => (
              <div key={tariff.id} className="p-4 bg-white/5 rounded-xl flex justify-between items-center border border-transparent hover:border-white/10">
                  <div><div className="font-bold text-lg">{tariff.title}</div><div className="text-sm text-neutral-400">{tariff.duration_days} d.</div></div>
                  <button onClick={() => handlePay(tariff.id)} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl font-bold transition">{tariff.price} {tariff.currency}</button>
              </div>))}
        </div>
      </div>
    </div>
  );
};

// ... (Rest of Admin components simplified for brevity, assume they use token for fetch)

const AdminDashboard = ({ token }: { token: string }) => {
    const { t } = useTranslation();
    const [view, setView] = useState('stats');
    const [stats, setStats] = useState({ active_subscriptions: 0, total_revenue: 0 });

    useEffect(() => {
        if (view === 'stats') {
            fetch(`${API_URL}/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` }})
                .then(res => res.json()).then(data => setStats(data));
        }
    }, [view, token]);

    if (!token) return <Navigate to="/login" />;

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-2xl font-black uppercase text-blue-500">Membersly Admin</h1>
                <div className="flex bg-neutral-900 p-1 rounded-xl border border-white/5">
                    {['stats', 'bots', 'tariffs', 'broadcast'].map((v) => (
                        <button key={v} onClick={() => setView(v)} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition ${view === v ? 'bg-blue-600 text-white' : 'text-neutral-500'}`}>{t(`admin.${v}`)}</button>
                    ))}
                </div>
            </div>
            {view === 'stats' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-8 bg-neutral-900 rounded-3xl border border-white/5">
                        <div className="text-neutral-500 text-xs font-bold uppercase mb-2">Active Subs</div>
                        <div className="text-5xl font-black">{stats.active_subscriptions}</div>
                    </div>
                    <div className="p-8 bg-neutral-900 rounded-3xl border border-white/5">
                        <div className="text-neutral-500 text-xs font-bold uppercase mb-2">Revenue</div>
                        <div className="text-5xl font-black text-green-400">{stats.total_revenue} ₽</div>
                    </div>
                </div>
            )}
            {/* ... other admin views */}
        </div>
    );
};

function App() {
  const { i18n } = useTranslation();
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');

  return (
    <Router>
      <div className="min-h-screen bg-black text-neutral-100">
        <nav className="p-4 border-b border-white/5 flex justify-between items-center px-10">
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-neutral-600">
            <Link to="/" className="hover:text-white transition">Client</Link>
            <Link to="/admin" className="hover:text-white transition">Admin</Link>
          </div>
          <div className="flex gap-2 text-xs">
            <button onClick={() => i18n.changeLanguage('ru')} className={i18n.language === 'ru' ? 'text-blue-400' : ''}>RU</button>
            <button onClick={() => i18n.changeLanguage('en')} className={i18n.language === 'en' ? 'text-blue-400' : ''}>EN</button>
            {token && <button onClick={() => { setToken(''); localStorage.removeItem('admin_token'); }} className="ml-4 text-red-500">Logout</button>}
          </div>
        </nav>
        <div className="py-8">
            <Routes>
                <Route path="/" element={<ClientZone />} />
                <Route path="/login" element={<Login setToken={setToken} />} />
                <Route path="/admin" element={<AdminDashboard token={token} />} />
            </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
