import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

const API_URL = window.location.origin.includes('localhost:5173') ? 'http://localhost:8000' : '/api';

const ClientZone = () => {
  const { t } = useTranslation();
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [userSubs, setUserSubs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [tgUser, setTgUser] = useState<any>(null);
  const [botUsername, setBotUsername] = useState('bot');

  const userId = tgUser?.id || 12345;

  const fetchData = async () => {
    const [tRes, sRes, pRes, cRes] = await Promise.all([
        fetch(`${API_URL}/tariffs`),
        fetch(`${API_URL}/orders/subscriptions/${userId}`),
        fetch(`${API_URL}/profile/${userId}`),
        fetch(`${API_URL}/config`)
    ]);
    setTariffs(await tRes.json());
    setUserSubs(await sRes.json());
    setProfile(await pRes.json());
    const config = await cRes.json();
    setBotUsername(config.bot_username);
  };

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) { tg.ready(); setTgUser(tg.initDataUnsafe?.user); }
    fetchData();
  }, [tgUser?.id]);

  const handlePay = (t_id: number) => {
    fetch(`${API_URL}/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tariff_id: t_id, user_id: userId, use_balance: true })
    }).then(res => res.json()).then(data => { if(data.payment_url) window.location.href = data.payment_url; else fetchData(); });
  };

  const toggleRenew = (s_id: number) => {
    fetch(`${API_URL}/orders/subscriptions/${s_id}/toggle-renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userId)
    }).then(() => fetchData());
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-neutral-900 p-6 rounded-[2rem] border border-white/5 shadow-xl">
          <div>
            <div className="text-[10px] font-black uppercase text-neutral-500 mb-1">Your Balance</div>
            <div className="text-3xl font-black tracking-tighter text-blue-500">{profile?.balance || 0} Ⓜ️</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black uppercase text-neutral-500 mb-1">Affiliate Program</div>
            <div className="text-[10px] font-mono text-neutral-400 bg-white/5 px-2 py-1 rounded-lg">t.me/{botUsername}?start=ref_{userId}</div>
          </div>
      </div>

      {userSubs.length > 0 && (
        <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-neutral-500 ml-4">My Subscriptions</h2>
            <div className="grid gap-3">
                {userSubs.map(sub => (
                    <div key={sub.id} className="bg-neutral-900 p-5 rounded-3xl border border-white/5 flex justify-between items-center">
                        <div>
                            <div className="font-bold">{sub.tariff.title}</div>
                            <div className="text-[10px] text-neutral-500 uppercase">Ends: {new Date(sub.end_date).toLocaleDateString()}</div>
                        </div>
                        <button onClick={() => toggleRenew(sub.id)} className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl border ${sub.auto_renew ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-white/5 border-white/10 text-neutral-500'}`}>
                            {sub.auto_renew ? 'Auto-renew ON' : 'Auto-renew OFF'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}

      <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
        <h2 className="text-lg font-bold mb-6 uppercase text-blue-500 tracking-tighter flex items-center gap-2">
            <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span> Upgrade Access
        </h2>
        <div className="grid gap-4">
            {tariffs.map(t_item => (
              <div key={t_item.id} className="p-6 bg-white/[0.02] rounded-3xl flex justify-between items-center border border-white/5 hover:border-white/10 transition group">
                  <div className="space-y-1">
                    <div className="font-black text-xl uppercase tracking-tighter group-hover:text-blue-400 transition">{t_item.title}</div>
                    <div className="flex gap-1 flex-wrap">
                        {t_item.channels?.map((c: any) => (
                            <span key={c.id} className="text-[8px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{c.title}</span>
                        ))}
                    </div>
                  </div>
                  <button onClick={() => handlePay(t_item.id)} className="bg-white text-black hover:bg-blue-500 hover:text-white px-6 py-3 rounded-2xl font-black text-sm transition-all transform active:scale-90">
                    {t_item.price} ₽
                  </button>
              </div>))}
        </div>
      </div>
    </div>
  );
};

const ManageBots = ({ token }: { token: string }) => {
    const [bots, setBots] = useState<any[]>([]);
    const [tok, setTok] = useState('');
    const fetchBots = () => fetch(`${API_URL}/admin/bots`, { headers: { 'Authorization': `Bearer ${token}` }}).then(res => res.json()).then(data => setBots(Array.isArray(data) ? data : []));
    useEffect(() => fetchBots(), [token]);
    const addBot = (e: any) => {
        e.preventDefault();
        fetch(`${API_URL}/admin/bots`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: tok, title: 'Bot' })
        }).then(() => { setTok(''); fetchBots(); });
    };
    const deleteBot = (id: number) => fetch(`${API_URL}/admin/bots/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }}).then(() => fetchBots());
    return (
        <div className="space-y-6">
            <form onSubmit={addBot} className="bg-neutral-900 p-6 rounded-3xl border border-white/10 flex gap-2">
                <input className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-sm" placeholder="New Bot Token" value={tok} onChange={e => setTok(e.target.value)} />
                <button className="bg-blue-600 px-6 py-2 rounded-xl font-bold uppercase text-[10px]">Add Bot</button>
            </form>
            <div className="grid gap-3">
                {bots.map(b => (
                    <div key={b.id} className="p-4 bg-neutral-900 rounded-2xl border border-white/5 flex justify-between items-center">
                        <div className="truncate max-w-[300px] text-xs font-mono text-neutral-500">{b.token}</div>
                        <button onClick={() => deleteBot(b.id)} className="text-red-500 font-bold uppercase text-[10px]">Revoke</button>
                    </div>))}
            </div>
        </div>
    );
};

const ManageBroadcast = ({ token }: { token: string }) => {
    const [msg, setMsg] = useState('');
    const [status, setStatus] = useState('');
    const send = () => {
        setStatus('Sending...');
        fetch(`${API_URL}/admin/broadcast`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(msg)
        }).then(res => res.json()).then(data => setStatus(`Sent to ${data.sent_to} users`));
    };
    return (
        <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/10 max-w-2xl mx-auto space-y-6">
            <h3 className="text-xl font-black uppercase text-blue-500 italic">Global Broadcast</h3>
            <textarea className="w-full bg-black border border-white/10 rounded-3xl p-6 text-sm h-48 focus:border-blue-500 outline-none transition-all" placeholder="Enter message text for all users..." value={msg} onChange={e => setMsg(e.target.value)} />
            <button onClick={send} className="w-full bg-blue-600 py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-blue-500 transition shadow-xl shadow-blue-600/20">Blast Message</button>
            {status && <p className="text-center text-xs font-bold text-neutral-500">{status}</p>}
        </div>
    );
};

const AdminDashboard = ({ token }: { token: string }) => {
    const { t } = useTranslation();
    const [view, setView] = useState('stats');
    const [stats, setStats] = useState<any>({ active_subscriptions: 0, total_revenue: 0, new_users_today: 0, monthly_revenue: 0 });

    useEffect(() => {
        if (view === 'stats') fetch(`${API_URL}/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` }}).then(res => res.json()).then(data => setStats(data));
    }, [view, token]);

    if (!token) return <Navigate to="/login" />;

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                <div className="text-3xl font-black uppercase italic tracking-tighter">Membersly <span className="text-blue-600">.OS</span></div>
                <div className="flex bg-neutral-900 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar w-full md:w-auto">
                    {['stats', 'bots', 'channels', 'tariffs', 'broadcast', 'users'].map((v) => (
                        <button key={v} onClick={() => setView(v)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${view === v ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-neutral-500 hover:text-white'}`}>{v}</button>
                    ))}
                </div>
            </div>
            {view === 'stats' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Active Base" value={stats.active_subscriptions} />
                    <StatCard label="Total Cash" value={`${stats.total_revenue} ₽`} color="text-green-500" />
                    <StatCard label="30D Velocity" value={`${stats.monthly_revenue} ₽`} color="text-blue-400" />
                    <StatCard label="New Pulse" value={stats.new_users_today} />
                </div>
            )}
            {view === 'bots' && <ManageBots token={token} />}
            {view === 'broadcast' && <ManageBroadcast token={token} />}
            {/* Tariffs, Channels and Users views would follow similar modular pattern */}
        </div>
    );
};

const StatCard = ({ label, value, color = "text-white" }: any) => (
    <div className="p-8 bg-neutral-900 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-600/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
        <div className="text-[10px] font-black uppercase text-neutral-500 mb-2 tracking-[0.2em] relative z-10">{label}</div>
        <div className={`text-4xl font-black tracking-tighter relative z-10 ${color}`}>{value}</div>
    </div>
);

const Login = ({ setToken }: { setToken: (t: string) => void }) => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const handleLogin = async (e: any) => {
        e.preventDefault();
        const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login, password }) });
        if (res.ok) { const data = await res.json(); setToken(data.access_token); localStorage.setItem('admin_token', data.access_token); navigate('/admin'); }
        else alert('Unauthorized');
    };
    return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <form onSubmit={handleLogin} className="bg-neutral-900 p-10 rounded-[3rem] border border-white/10 w-full max-w-sm space-y-6 shadow-2xl">
                <h2 className="text-3xl font-black text-center uppercase tracking-tighter italic">Admin <span className="text-blue-600">Access</span></h2>
                <div className="space-y-3">
                    <input className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all text-sm" placeholder="Login ID" value={login} onChange={e => setLogin(e.target.value)} />
                    <input className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all text-sm" type="password" placeholder="Passcode" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <button className="w-full bg-blue-600 py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20">Unlock Terminal</button>
            </form>
        </div>
    );
};

function App() {
    const { i18n } = useTranslation();
    const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
    return (
        <Router>
            <div className="min-h-screen bg-black text-neutral-100 font-sans selection:bg-blue-500/30">
                <nav className="p-6 border-b border-white/5 flex justify-between items-center px-10">
                    <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600">
                        <Link to="/" className="hover:text-white transition">Terminal</Link>
                        <Link to="/admin" className="hover:text-white transition">Control</Link>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex gap-3 text-[10px] font-black uppercase">
                            <button onClick={() => i18n.changeLanguage('ru')} className={i18n.language === 'ru' ? 'text-blue-500' : 'text-neutral-700'}>RU</button>
                            <button onClick={() => i18n.changeLanguage('en')} className={i18n.language === 'en' ? 'text-blue-500' : 'text-neutral-700'}>EN</button>
                        </div>
                        {token && <button onClick={() => { setToken(''); localStorage.removeItem('admin_token'); }} className="text-[10px] font-black uppercase text-red-600/40 hover:text-red-500 transition border border-red-500/10 px-4 py-1.5 rounded-full">System Exit</button>}
                    </div>
                </nav>
                <div className="py-8"><Routes><Route path="/" element={<ClientZone />} /><Route path="/admin" element={<AdminDashboard token={token} />} /><Route path="/login" element={<Login setToken={setToken} />} /></Routes></div>
            </div>
        </Router>
    );
}
export default App;
