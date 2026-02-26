import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8000';

const ClientZone = () => {
  const { t } = useTranslation();
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [coupon, setCoupon] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/tariffs`)
      .then(res => res.json())
      .then(data => setTariffs(data));
  }, []);

  const handlePay = (tariffId: number) => {
    fetch(`${API_URL}/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tariff_id: tariffId, user_id: 12345, coupon_code: coupon }) // Replace with real UI user_id
    })
    .then(res => res.json())
    .then(data => { if(data.payment_url) window.location.href = data.payment_url; });
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">{t('welcome')}</h1>
      
      <div className="mb-6">
          <input 
            className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none"
            placeholder="Промокод (если есть)"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
          />
      </div>

      <div className="bg-neutral-900 p-6 rounded-2xl shadow-xl border border-white/5">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
            {t('tariffs')}
        </h2>
        <div className="grid gap-4">
            {tariffs.map(tariff => (
              <div key={tariff.id} className="p-4 bg-white/5 rounded-xl flex justify-between items-center border border-transparent hover:border-white/10">
                  <div>
                    <div className="font-bold text-lg">{tariff.title}</div>
                    <div className="text-sm text-neutral-400">{tariff.duration_days} дней</div>
                  </div>
                  <button 
                    onClick={() => handlePay(tariff.id)}
                    className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl font-bold transition">
                    {tariff.price} {tariff.currency}
                  </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const AdminBroadcast = () => {
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('');

    const sendBroadcast = () => {
        setStatus('Sending...');
        fetch(`${API_URL}/admin/broadcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
        })
        .then(res => res.json())
        .then(data => {
            setStatus(`Sent to ${data.sent_to} users`);
            setMessage('');
        });
    };

    return (
        <div className="bg-neutral-900 p-6 rounded-xl border border-white/10">
            <h3 className="text-lg font-semibold mb-4 text-red-400">Массовая рассылка</h3>
            <textarea 
                className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm h-32 mb-4 outline-none focus:border-red-500"
                placeholder="Введите текст сообщения для всех пользователей..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">{status}</span>
                <button onClick={sendBroadcast} className="bg-red-600 px-6 py-2 rounded-lg font-bold hover:bg-red-500 transition">Отправить</button>
            </div>
        </div>
    );
};

const ManageTariffs = () => {
    const [tariffs, setTariffs] = useState<any[]>([]);
    const [form, setForm] = useState({ title: '', price: '', currency: 'RUB', duration: '30' });

    const fetchTariffs = () => {
        fetch(`${API_URL}/admin/tariffs`).then(res => res.json()).then(data => setTariffs(data));
    };

    useEffect(() => { fetchTariffs(); }, []);

    const addTariff = (e: React.FormEvent) => {
        e.preventDefault();
        fetch(`${API_URL}/admin/tariffs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: form.title, price: parseFloat(form.price), currency: form.currency, duration_days: parseInt(form.duration) })
        }).then(() => { setForm({ title: '', price: '', currency: 'RUB', duration: '30' }); fetchTariffs(); });
    };

    return (
        <div className="space-y-6">
            <form onSubmit={addTariff} className="bg-neutral-900 p-6 rounded-xl border border-white/10 grid grid-cols-2 gap-4">
                <input placeholder="Название" className="bg-black p-2 rounded border border-white/5" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                <input placeholder="Цена" className="bg-black p-2 rounded border border-white/5" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                <button className="bg-blue-600 rounded col-span-2 py-2 font-bold">Создать тариф</button>
            </form>
            <div className="grid gap-2">
                {tariffs.map(t => (
                    <div key={t.id} className="p-4 bg-neutral-900 rounded-xl border border-white/5 flex justify-between">
                        <span>{t.title} - {t.price} {t.currency}</span>
                        <button className="text-red-500 text-sm">Удалить</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ManageBots = () => {
    const [bots, setBots] = useState<any[]>([]);
    const [token, setToken] = useState('');

    const fetchBots = () => {
        fetch(`${API_URL}/admin/bots`).then(res => res.json()).then(data => setBots(data));
    };

    useEffect(() => { fetchBots(); }, []);

    const addBot = (e: React.FormEvent) => {
        e.preventDefault();
        fetch(`${API_URL}/admin/bots`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, title: 'New Bot' })
        }).then(() => { setToken(''); fetchBots(); });
    };

    return (
        <div className="space-y-6">
            <form onSubmit={addBot} className="bg-neutral-900 p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-semibold mb-4 text-blue-400">Добавить нового бота</h3>
                <div className="flex gap-2">
                    <input className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500" placeholder="Bot Token" value={token} onChange={(e) => setToken(e.target.value)} />
                    <button className="bg-blue-600 px-4 py-2 rounded-lg font-bold">Добавить</button>
                </div>
            </form>
            <div className="grid gap-3">
                {bots.map(bot => (
                    <div key={bot.id} className="p-4 bg-neutral-900 rounded-xl border border-white/5 flex justify-between items-center">
                        <div className="truncate pr-4">
                            <span className="text-xs font-mono text-neutral-500">{bot.token.substring(0, 15)}...</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className={`w-2 h-2 rounded-full ${bot.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            {bot.is_active ? 'Active' : 'Offline'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const [view, setView] = useState<'stats' | 'bots' | 'tariffs' | 'broadcast'>('stats');

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold tracking-tight">Membersly Admin</h1>
                <div className="flex bg-neutral-900 p-1 rounded-xl border border-white/5 overflow-x-auto">
                    {['stats', 'bots', 'tariffs', 'broadcast'].map((v) => (
                        <button 
                            key={v}
                            onClick={() => setView(v as any)} 
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition whitespace-nowrap ${view === v ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-neutral-500'}`}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            {view === 'stats' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-8 bg-neutral-900 rounded-3xl border border-white/5">
                        <div className="text-neutral-500 text-xs font-bold uppercase mb-2">Active Subs</div>
                        <div className="text-5xl font-black">1,284</div>
                    </div>
                    <div className="p-8 bg-neutral-900 rounded-3xl border border-white/5">
                        <div className="text-neutral-500 text-xs font-bold uppercase mb-2">Total Revenue</div>
                        <div className="text-5xl font-black text-green-400">45,200 ₽</div>
                    </div>
                </div>
            )}
            {view === 'bots' && <ManageBots />}
            {view === 'tariffs' && <ManageTariffs />}
            {view === 'broadcast' && <AdminBroadcast />}
        </div>
    );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black text-neutral-100 selection:bg-blue-500/30">
        <nav className="p-4 border-b border-white/5 flex justify-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">
          <Link to="/" className="hover:text-white transition">Client</Link>
          <Link to="/admin" className="hover:text-white transition">Admin</Link>
        </nav>
        <div className="py-8">
            <Routes>
                <Route path="/" element={<ClientZone />} />
                <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
