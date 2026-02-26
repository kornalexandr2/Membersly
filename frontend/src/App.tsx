import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

const API_URL = window.location.origin.includes('localhost:5173') ? 'http://localhost:8000' : '/api';

const ManageTariffs = ({ token }: { token: string }) => {
    const { t } = useTranslation();
    const [tariffs, setTariffs] = useState<any[]>([]);
    const [channels, setChannels] = useState<any[]>([]);
    const [form, setForm] = useState({ title: '', price: '', duration: '30', trial: '0', selectedChannels: [] as number[] });

    const fetchData = async () => {
        const [tRes, cRes] = await Promise.all([
            fetch(`${API_URL}/admin/tariffs`, { headers: { 'Authorization': `Bearer ${token}` }}),
            fetch(`${API_URL}/admin/channels`, { headers: { 'Authorization': `Bearer ${token}` }})
        ]);
        setTariffs(await tRes.json());
        setChannels(await cRes.json());
    };

    useEffect(() => { fetchData(); }, [token]);

    const addTariff = (e: any) => {
        e.preventDefault();
        fetch(`${API_URL}/admin/tariffs`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                title: form.title, 
                price: parseFloat(form.price), 
                currency: 'RUB', 
                duration_days: parseInt(form.duration),
                trial_days: parseInt(form.trial),
                channel_ids: form.selectedChannels
            })
        }).then(() => { setForm({ title: '', price: '', duration: '30', trial: '0', selectedChannels: [] }); fetchData(); });
    };

    const toggleChannel = (id: number) => {
        setForm(prev => ({
            ...prev,
            selectedChannels: prev.selectedChannels.includes(id) 
                ? prev.selectedChannels.filter(i => i !== id) 
                : [...prev.selectedChannels, id]
        }));
    };

    return (
        <div className="space-y-8">
            <form onSubmit={addTariff} className="bg-neutral-900 p-8 rounded-3xl border border-white/10 space-y-6">
                <h3 className="text-lg font-bold text-blue-400 uppercase tracking-widest">New Tariff Plan</h3>
                <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Plan Name" className="bg-black p-3 rounded-xl border border-white/5" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                    <input placeholder="Price (RUB)" className="bg-black p-3 rounded-xl border border-white/5" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                    <input placeholder="Duration (Days)" className="bg-black p-3 rounded-xl border border-white/5" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} />
                    <input placeholder="Trial (Days)" className="bg-black p-3 rounded-xl border border-white/5" value={form.trial} onChange={e => setForm({...form, trial: e.target.value})} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase mb-3 ml-1">Included Resources:</p>
                    <div className="flex flex-wrap gap-2">
                        {channels.map(c => (
                            <button key={c.id} type="button" onClick={() => toggleChannel(c.id)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${form.selectedChannels.includes(c.id) ? 'bg-blue-600 border-blue-500' : 'bg-white/5 border-white/5 text-neutral-500'}`}>
                                {c.title}
                            </button>
                        ))}
                    </div>
                </div>
                <button className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase tracking-tighter hover:bg-blue-500 transition shadow-lg shadow-blue-600/20">Create Strategy</button>
            </form>

            <div className="grid gap-4">
                {tariffs.map(t_item => (
                    <div key={t_item.id} className="p-6 bg-neutral-900 rounded-3xl border border-white/5 flex justify-between items-start">
                        <div>
                            <div className="font-black text-xl uppercase tracking-tighter">{t_item.title}</div>
                            <div className="text-xs text-neutral-500 font-bold mb-3">{t_item.price} RUB • {t_item.duration_days} days</div>
                            <div className="flex gap-1">
                                {t_item.channels?.map((c: any) => (
                                    <span key={c.id} className="text-[9px] bg-white/5 px-2 py-0.5 rounded-full text-neutral-400 font-bold uppercase">{c.title}</span>
                                ))}
                            </div>
                        </div>
                        <button className="text-red-500 text-[10px] font-bold uppercase hover:underline">Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ... ClientZone and StatCard logic remains similar to previous version ...

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
      <h1 className="text-4xl font-black mb-8 text-center uppercase tracking-tighter italic">{t('welcome')}</h1>
      <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
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
      <div className="mt-10 p-6 bg-white/5 rounded-3xl text-center border border-dashed border-white/10">
          <div className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-2">Affiliate Program</div>
          <div className="text-xs font-mono text-blue-400/80 break-all px-4 select-all">https://t.me/{botUsername}?start=ref_{tgUser?.id || 'id'}</div>
      </div>
    </div>
  );
};

const AdminDashboard = ({ token }: { token: string }) => {
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
                <div className="flex bg-neutral-900 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
                    {['stats', 'channels', 'tariffs', 'broadcast', 'users'].map((v) => (
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
            {view === 'tariffs' && <ManageTariffs token={token} />}
            {/* Other views handled similarly */}
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
                <div className="py-12"><Routes><Route path="/" element={<ClientZone />} /><Route path="/admin" element={<AdminDashboard token={token} />} /><Route path="/login" element={<div className="text-center py-20 uppercase font-black tracking-widest text-neutral-800">Authorization Required</div>} /></Routes></div>
            </div>
        </Router>
    );
}
export default App;
