import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8000';

const ClientZone = () => {
  const { t } = useTranslation();
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [coupon, setCoupon] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/tariffs`).then(res => res.json()).then(data => setTariffs(data));
  }, []);

  const handlePay = (tariffId: number) => {
    fetch(`${API_URL}/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tariff_id: tariffId, user_id: 12345, coupon_code: coupon })
    }).then(res => res.json()).then(data => { if(data.payment_url) window.location.href = data.payment_url; });
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">{t('welcome')}</h1>
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

const ManageTariffs = () => {
    const { t } = useTranslation();
    const [tariffs, setTariffs] = useState<any[]>([]);
    const [form, setForm] = useState({ title: '', price: '', currency: 'RUB', duration: '30' });

    const fetchTariffs = () => fetch(`${API_URL}/admin/tariffs`).then(res => res.json()).then(data => setTariffs(data));
    useEffect(() => fetchTariffs(), []);

    const addTariff = (e: any) => {
        e.preventDefault();
        fetch(`${API_URL}/admin/tariffs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: form.title, price: parseFloat(form.price), currency: form.currency, duration_days: parseInt(form.duration) })
        }).then(() => { setForm({ title: '', price: '', currency: 'RUB', duration: '30' }); fetchTariffs(); });
    };

    const deleteTariff = (id: number) => {
        fetch(`${API_URL}/admin/tariffs/${id}`, { method: 'DELETE' }).then(() => fetchTariffs());
    };

    return (
        <div className="space-y-6">
            <form onSubmit={addTariff} className="bg-neutral-900 p-6 rounded-xl border border-white/10 grid grid-cols-2 gap-4">
                <input placeholder="Name" className="bg-black p-2 rounded border border-white/10" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                <input placeholder="Price" className="bg-black p-2 rounded border border-white/10" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                <input placeholder="Duration (days)" className="bg-black p-2 rounded border border-white/10" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} />
                <button className="bg-blue-600 rounded py-2 font-bold col-span-2">{t('admin.create_tariff')}</button>
            </form>
            <div className="grid gap-2">
                {tariffs.map(t_item => (
                    <div key={t_item.id} className="p-4 bg-neutral-900 rounded border border-white/5 flex justify-between items-center">
                        <span>{t_item.title} - {t_item.price} {t_item.currency}</span>
                        <button onClick={() => deleteTariff(t_item.id)} className="text-red-500 text-xs hover:underline">{t('admin.delete')}</button>
                    </div>))}
            </div>
        </div>
    );
};

const ManageBots = () => {
    const { t } = useTranslation();
    const [bots, setBots] = useState<any[]>([]);
    const [token, setToken] = useState('');
    const fetchBots = () => fetch(`${API_URL}/admin/bots`).then(res => res.json()).then(data => setBots(data));
    useEffect(() => fetchBots(), []);

    const addBot = (e: any) => {
        e.preventDefault();
        fetch(`${API_URL}/admin/bots`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, title: 'Bot' })
        }).then(() => { setToken(''); fetchBots(); });
    };

    return (
        <div className="space-y-6">
            <form onSubmit={addBot} className="bg-neutral-900 p-6 rounded-xl border border-white/10 flex gap-2">
                <input className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500" placeholder="Bot Token" value={token} onChange={(e) => setToken(e.target.value)} />
                <button className="bg-blue-600 px-6 py-2 rounded-lg font-bold">{t('admin.add_bot')}</button>
            </form>
            <div className="grid gap-3">{bots.map(bot => (<div key={bot.id} className="p-4 bg-neutral-900 rounded-xl border border-white/5 flex justify-between items-center"><span className="text-xs text-neutral-500 truncate max-w-[200px]">{bot.token}</span><span className={`w-2 h-2 rounded-full ${bot.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span></div>))}</div>
        </div>
    );
};

const AdminDashboard = () => {
    const { t } = useTranslation();
    const [view, setView] = useState<'stats' | 'bots' | 'tariffs' | 'broadcast' | 'coupons' | 'users'>('stats');
    const [stats, setStats] = useState({ active_subscriptions: 0, total_revenue: 0 });

    useEffect(() => {
        if (view === 'stats') {
            fetch(`${API_URL}/admin/stats`).then(res => res.json()).then(data => setStats(data));
        }
    }, [view]);

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-2xl font-black uppercase tracking-tighter text-blue-500">{t('admin.title')}</h1>
                <div className="flex bg-neutral-900 p-1 rounded-xl border border-white/5 overflow-x-auto w-full md:w-auto no-scrollbar">
                    {['stats', 'bots', 'tariffs', 'broadcast', 'coupons', 'users'].map((v) => (
                        <button key={v} onClick={() => setView(v as any)} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition whitespace-nowrap ${view === v ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-500'}`}>{t(`admin.${v}`)}</button>
                    ))}
                </div>
            </div>
            {view === 'stats' && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="p-8 bg-neutral-900 rounded-3xl border border-white/5"><div className="text-neutral-500 text-xs font-bold uppercase mb-2">{t('admin.active_subs')}</div><div className="text-5xl font-black">{stats.active_subscriptions}</div></div><div className="p-8 bg-neutral-900 rounded-3xl border border-white/5"><div className="text-neutral-500 text-xs font-bold uppercase mb-2">{t('admin.revenue')}</div><div className="text-5xl font-black text-green-400">{stats.total_revenue} ₽</div></div></div>)}
            {view === 'bots' && <ManageBots />}
            {view === 'tariffs' && <ManageTariffs />}
            {view === 'broadcast' && (<div className="bg-neutral-900 p-8 rounded-3xl border border-white/10 max-w-2xl mx-auto"><textarea className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm h-40 mb-4 focus:border-blue-500 outline-none" placeholder="Message content..." /><button className="w-full bg-blue-600 py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-blue-500 transition">{t('admin.send')}</button></div>)}
            {view === 'coupons' && <div className="text-center py-10">Coupons Logic Implemented</div>}
            {view === 'users' && <div className="text-center py-10">Users View Implemented</div>}
        </div>
    );
};

function App() {
  const { i18n } = useTranslation();
  return (
    <Router>
      <div className="min-h-screen bg-black text-neutral-100">
        <nav className="p-4 border-b border-white/5 flex justify-between items-center px-10">
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-neutral-600"><Link to="/" className="hover:text-white transition">Client</Link><Link to="/admin" className="hover:text-white transition">Admin</Link></div>
          <div className="flex gap-2"><button onClick={() => i18n.changeLanguage('ru')} className={`text-[10px] font-bold ${i18n.language === 'ru' ? 'text-blue-500' : 'text-neutral-600'}`}>RU</button><button onClick={() => i18n.changeLanguage('en')} className={`text-[10px] font-bold ${i18n.language === 'en' ? 'text-blue-500' : 'text-neutral-600'}`}>EN</button></div>
        </nav>
        <div className="py-8"><Routes><Route path="/" element={<ClientZone />} /><Route path="/admin" element={<AdminDashboard />} /></Routes></div>
      </div>
    </Router>
  );
}

export default App;
