import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

const API_URL = window.location.origin.includes('localhost:5173') ? 'http://localhost:8000' : '/api';

const ClientZone = () => {
  const { t } = useTranslation();
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [coupon, setCoupon] = useState('');
  const [tgUser, setTgUser] = useState<any>(null);

  useEffect(() => {
    // Real Telegram WebApp Integration
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      setTgUser(tg.initDataUnsafe?.user);
    }
    fetch(`${API_URL}/tariffs`).then(res => res.json()).then(data => setTariffs(Array.isArray(data) ? data : []));
  }, []);

  const handlePay = (tariffId: number) => {
    const userId = tgUser?.id || 12345; // Fallback for testing
    fetch(`${API_URL}/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tariff_id: tariffId, user_id: userId, coupon_code: coupon })
    }).then(res => res.json()).then(data => { if(data.payment_url) window.location.href = data.payment_url; });
  };

  const refLink = `https://t.me/your_bot?start=ref_${tgUser?.id || 'id'}`;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-black mb-2 text-center tracking-tighter uppercase">{t('welcome')}</h1>
      {tgUser && <p className="text-center text-neutral-500 text-xs mb-6">Hello, {tgUser.first_name}!</p>}
      
      <div className="mb-6 p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-center">
          <div className="text-[10px] font-bold uppercase text-blue-400 mb-1">Invite friends & get 5%</div>
          <div className="text-xs font-mono break-all text-neutral-300">{refLink}</div>
      </div>

      <div className="mb-6"><input className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" placeholder={t('promo')} value={coupon} onChange={(e) => setCoupon(e.target.value)} /></div>

      <div className="bg-neutral-900 p-6 rounded-2xl shadow-xl border border-white/5">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><span className="w-2 h-6 bg-blue-500 rounded-full"></span>{t('tariffs')}</h2>
        <div className="grid gap-4">
            {tariffs.map(tariff => (
              <div key={tariff.id} className="p-4 bg-white/5 rounded-xl flex justify-between items-center border border-transparent hover:border-white/10 transition">
                  <div><div className="font-bold text-lg">{tariff.title}</div><div className="text-sm text-neutral-400">{tariff.duration_days} days</div></div>
                  <button onClick={() => handlePay(tariff.id)} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl font-bold transition shadow-lg shadow-blue-600/20">{tariff.price} {tariff.currency}</button>
              </div>))}
        </div>
      </div>
    </div>
  );
};

const ManageCoupons = ({ token }: { token: string }) => {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [form, setForm] = useState({ code: '', value: '', type: 'percent' });
    const fetchCoupons = () => fetch(`${API_URL}/admin/coupons`, { headers: { 'Authorization': `Bearer ${token}` }}).then(res => res.json()).then(data => setCoupons(Array.isArray(data) ? data : []));
    useEffect(() => fetchCoupons(), [token]);

    const addCoupon = (e: any) => {
        e.preventDefault();
        fetch(`${API_URL}/admin/coupons`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: form.code, value: parseFloat(form.value), discount_type: form.type })
        }).then(() => { setForm({ code: '', value: '', type: 'percent' }); fetchCoupons(); });
    };

    return (
        <div className="space-y-6">
            <form onSubmit={addCoupon} className="bg-neutral-900 p-6 rounded-xl border border-white/10 flex gap-2">
                <input placeholder="Code" className="flex-1 bg-black p-2 rounded text-sm" value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
                <input placeholder="Value" className="w-20 bg-black p-2 rounded text-sm" value={form.value} onChange={e => setForm({...form, value: e.target.value})} />
                <button className="bg-blue-600 px-4 py-2 rounded font-bold text-xs uppercase">Create</button>
            </form>
            <div className="grid gap-2">
                {coupons.map(c => (
                    <div key={c.id} className="p-4 bg-neutral-900 rounded-xl border border-white/5 flex justify-between items-center">
                        <span className="font-mono text-blue-400">{c.code}</span>
                        <span className="text-sm">{c.value} {c.discount_type === 'percent' ? '%' : 'RUB'}</span>
                    </div>))}
            </div>
        </div>
    );
};

const ManageUsers = ({ token }: { token: string }) => {
    const [users, setUsers] = useState<any[]>([]);
    useEffect(() => { fetch(`${API_URL}/admin/users`, { headers: { 'Authorization': `Bearer ${token}` }}).then(res => res.json()).then(data => setUsers(Array.isArray(data) ? data : [])); }, [token]);
    return (
        <div className="bg-neutral-900 rounded-2xl border border-white/5 overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-neutral-500 uppercase text-[10px] font-bold"><tr className="border-b border-white/5"><th className="p-4">User</th><th className="p-4">Balance</th><th className="p-4">Created</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                    {users.map(u => (
                        <tr key={u.telegram_id} className="hover:bg-white/5 transition">
                            <td className="p-4"><div className="font-bold">{u.full_name}</div><div className="text-[10px] text-neutral-500">@{u.username}</div></td>
                            <td className="p-4 font-mono">{u.balance} ₽</td>
                            <td className="p-4 text-[10px] text-neutral-500">{new Date(u.created_at).toLocaleDateString()}</td>
                        </tr>))}
                </tbody>
            </table>
        </div>
    );
};

// ... Login & AdminDashboard remains similar but use components above

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
                <h1 className="text-2xl font-black uppercase text-blue-500 tracking-tighter">Membersly</h1>
                <div className="flex bg-neutral-900 p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar w-full md:w-auto">
                    {['stats', 'bots', 'channels', 'tariffs', 'broadcast', 'coupons', 'users'].map((v) => (
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
            {view === 'coupons' && <ManageCoupons token={token} />}
            {view === 'users' && <ManageUsers token={token} />}
            {/* ... other views */}
        </div>
    );
};

// Main App component with Routing
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
                        {token && <button onClick={() => { setToken(''); localStorage.removeItem('admin_token'); }} className="text-[10px] font-bold uppercase text-red-500">Logout</button>}
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
