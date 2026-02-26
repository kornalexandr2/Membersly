import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

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
            alert('Error!');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <form onSubmit={handleLogin} className="bg-neutral-900 p-8 rounded-3xl border border-white/10 w-full max-w-sm">
                <h2 className="text-2xl font-black mb-6 text-center uppercase tracking-tighter">Login</h2>
                <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 mb-4 outline-none focus:border-blue-500" placeholder="Login" value={login} onChange={e => setLogin(e.target.value)} />
                <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 mb-6 outline-none focus:border-blue-500" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                <button className="w-full bg-blue-600 py-4 rounded-2xl font-bold">Log In</button>
            </form>
        </div>
    );
};

const ManageChannels = ({ token }: { token: string }) => {
    const [channels, setChannels] = useState<any[]>([]);
    const [form, setForm] = useState({ chat_id: '', title: '', type: 'channel' });

    const fetchChannels = () => {
        fetch(`${API_URL}/admin/channels`, { headers: { 'Authorization': `Bearer ${token}` }})
            .then(res => res.json()).then(data => setChannels(Array.isArray(data) ? data : []));
    };

    useEffect(() => { fetchChannels(); }, [token]);

    const addChannel = (e: any) => {
        e.preventDefault();
        fetch(`${API_URL}/admin/channels?chat_id=${form.chat_id}&title=${form.title}&type=${form.type}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(() => { setForm({ chat_id: '', title: '', type: 'channel' }); fetchChannels(); });
    };

    return (
        <div className="space-y-6">
            <form onSubmit={addChannel} className="bg-neutral-900 p-6 rounded-xl border border-white/10 grid grid-cols-2 gap-4">
                <input placeholder="Chat ID (BigInt)" className="bg-black p-3 rounded-lg text-sm" value={form.chat_id} onChange={e => setForm({...form, chat_id: e.target.value})} />
                <input placeholder="Title" className="bg-black p-3 rounded-lg text-sm" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                <select className="bg-black p-3 rounded-lg text-sm" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="channel">Channel</option>
                    <option value="supergroup">Group</option>
                </select>
                <button className="bg-blue-600 rounded-lg font-bold">Add Resource</button>
            </form>
            <div className="grid gap-3">
                {channels.map(c => (
                    <div key={c.id} className="p-4 bg-neutral-900 rounded-xl border border-white/5 flex justify-between items-center">
                        <div>
                            <div className="font-bold">{c.title}</div>
                            <div className="text-xs text-neutral-500">ID: {c.telegram_chat_id} | {c.type}</div>
                        </div>
                    </div>))}
            </div>
        </div>
    );
};

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
                    {['stats', 'bots', 'channels', 'tariffs', 'broadcast'].map((v) => (
                        <button key={v} onClick={() => setView(v)} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition ${view === v ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-500'}`}>{v}</button>
                    ))}
                </div>
            </div>
            {view === 'stats' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-8 bg-neutral-900 rounded-3xl border border-white/5">
                        <div className="text-neutral-500 text-[10px] font-bold uppercase mb-2">Active Subs</div>
                        <div className="text-5xl font-black tracking-tighter">{stats.active_subscriptions}</div>
                    </div>
                    <div className="p-8 bg-neutral-900 rounded-3xl border border-white/5">
                        <div className="text-neutral-500 text-[10px] font-bold uppercase mb-2">Revenue</div>
                        <div className="text-5xl font-black tracking-tighter text-green-500">{stats.total_revenue} ₽</div>
                    </div>
                </div>
            )}
            {view === 'channels' && <ManageChannels token={token} />}
            {/* Other views omitted for brevity, logic remains same */}
        </div>
    );
};

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
             {token && <button onClick={() => { setToken(''); localStorage.removeItem('admin_token'); }} className="ml-4 text-[10px] font-bold uppercase text-red-500 border border-red-500/30 px-3 py-1 rounded">Logout</button>}
          </div>
        </nav>
        <div className="py-8">
            <Routes>
                <Route path="/" element={<div>Client Zone (Ref/Tariffs logic)</div>} />
                <Route path="/login" element={<Login setToken={setToken} />} />
                <Route path="/admin" element={<AdminDashboard token={token} />} />
            </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
