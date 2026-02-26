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
    const tg = (window as any).Telegram?.WebApp;
    if (tg) { tg.ready(); setTgUser(tg.initDataUnsafe?.user); }
    fetch(`${API_URL}/tariffs`).then(res => res.json()).then(data => setTariffs(Array.isArray(data) ? data : []));
  }, []);

  const handlePay = (tariffId: number) => {
    fetch(`${API_URL}/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tariff_id: tariffId, user_id: tgUser?.id || 12345, coupon_code: coupon, use_balance: true })
    }).then(res => res.json()).then(data => { 
        if(data.payment_url) window.location.href = data.payment_url; 
        else alert(data.message || 'Activated!');
    });
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-black mb-6 text-center tracking-tighter uppercase">{t('welcome')}</h1>
      <div className="bg-neutral-900 p-6 rounded-2xl shadow-xl border border-white/5">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><span className="w-2 h-6 bg-blue-500 rounded-full"></span>{t('tariffs')}</h2>
        <div className="grid gap-4">
            {tariffs.map(tariff => (
              <div key={tariff.id} className="p-4 bg-white/5 rounded-xl flex justify-between items-center transition">
                  <div>
                    <div className="font-bold text-lg">{tariff.title}</div>
                    {tariff.trial_days > 0 && <div className="text-[10px] text-green-500 font-bold uppercase">Free {tariff.trial_days} days trial</div>}
                  </div>
                  <button onClick={() => handlePay(tariff.id)} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl font-bold transition">
                    {tariff.price} {tariff.currency}
                  </button>
              </div>))}
        </div>
      </div>
    </div>
  );
};

const ManageUsers = ({ token }: { token: string }) => {
    const [users, setUsers] = useState<any[]>([]);
    const fetchUsers = () => fetch(`${API_URL}/admin/users`, { headers: { 'Authorization': `Bearer ${token}` }}).then(res => res.json()).then(data => setUsers(Array.isArray(data) ? data : []));
    useEffect(() => { fetchUsers(); }, [token]);

    const updateBalance = (uid: number) => {
        const val = prompt('Enter new balance:');
        if (val) {
            fetch(`${API_URL}/admin/users/${uid}/balance`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(parseFloat(val))
            }).then(() => fetchUsers());
        }
    };

    return (
        <div className="bg-neutral-900 rounded-2xl border border-white/5 overflow-hidden">
            <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-neutral-500 uppercase font-bold"><tr className="border-b border-white/5"><th className="p-4">User</th><th className="p-4">Balance</th><th className="p-4">Action</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                    {users.map(u => (
                        <tr key={u.telegram_id}>
                            <td className="p-4"><div>{u.full_name}</div><div className="text-[10px] text-neutral-500">@{u.username}</div></td>
                            <td className="p-4 font-mono text-blue-400">{u.balance} Ⓜ️</td>
                            <td className="p-4"><button onClick={() => updateBalance(u.telegram_id)} className="text-blue-500 font-bold hover:underline">Edit Ⓜ️</button></td>
                        </tr>))}
                </tbody>
            </table>
        </div>
    );
};

// ... Rest of AdminDashboard and App remains similar
const AdminDashboard = ({ token }: { token: string }) => {
    const [view, setView] = useState('stats');
    if (!token) return <Navigate to="/login" />;
    return (
        <div className="p-4 max-w-6xl mx-auto">
            <div className="flex justify-between mb-8">
                <h1 className="text-xl font-black uppercase text-blue-500">Admin</h1>
                <div className="flex bg-neutral-900 p-1 rounded-xl">
                    {['stats', 'users', 'tariffs'].map(v => <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${view === v ? 'bg-blue-600 text-white' : 'text-neutral-500'}`}>{v}</button>)}
                </div>
            </div>
            {view === 'users' && <ManageUsers token={token} />}
            {/* stats & tariffs views... */}
        </div>
    );
};

function App() {
    const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
    return (
        <Router>
            <div className="min-h-screen bg-black text-neutral-100">
                <nav className="p-4 border-b border-white/5 flex gap-4 text-[10px] uppercase font-bold text-neutral-600"><Link to="/">Client</Link><Link to="/admin">Admin</Link></nav>
                <div className="py-8">
                    <Routes>
                        <Route path="/" element={<ClientZone />} />
                        <Route path="/admin" element={<AdminDashboard token={token} />} />
                        <Route path="/login" element={<div>Login Page</div>} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}
export default App;
