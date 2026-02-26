import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8000';

const ClientZone = () => {
  const { t } = useTranslation();
  const [tariffs, setTariffs] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/tariffs`)
      .then(res => res.json())
      .then(data => setTariffs(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">{t('welcome')}</h1>
      <div className="bg-neutral-900 p-6 rounded-2xl shadow-xl border border-white/5">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
            {t('tariffs')}
        </h2>
        <div className="grid gap-4">
            {tariffs.map(tariff => (
              <div key={tariff.id} className="p-4 bg-white/5 rounded-xl flex justify-between items-center hover:bg-white/10 transition border border-transparent hover:border-white/10">
                  <div>
                    <div className="font-bold text-lg">{tariff.title}</div>
                    <div className="text-sm text-neutral-400">{tariff.duration_days} дней доступа</div>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl font-bold transition-all transform active:scale-95">
                    {tariff.price} {tariff.currency}
                  </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const ManageBots = () => {
    const [bots, setBots] = useState<any[]>([]);
    const [token, setToken] = useState('');

    const fetchBots = () => {
        fetch(`${API_URL}/admin/bots`)
            .then(res => res.json())
            .then(data => setBots(data));
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
                    <input 
                        className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                        placeholder="Telegram Bot Token"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                    />
                    <button className="bg-blue-600 px-4 py-2 rounded-lg font-bold">Add</button>
                </div>
            </form>

            <div className="grid gap-3">
                {bots.map(bot => (
                    <div key={bot.id} className="p-4 bg-neutral-900 rounded-xl border border-white/5 flex justify-between items-center">
                        <div className="truncate pr-4">
                            <span className="text-xs font-mono text-neutral-500">{bot.token.substring(0, 15)}...</span>
                            <div className="font-medium">Bot ID: {bot.id}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${bot.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span className="text-sm">{bot.is_active ? 'Active' : 'Offline'}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const [view, setView] = useState<'stats' | 'bots'>('stats');

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Membersly Admin</h1>
                <div className="flex bg-neutral-900 p-1 rounded-lg border border-white/5">
                    <button onClick={() => setView('stats')} className={`px-4 py-1.5 rounded-md text-sm transition ${view === 'stats' ? 'bg-blue-600 text-white' : 'text-neutral-400'}`}>Stats</button>
                    <button onClick={() => setView('bots')} className={`px-4 py-1.5 rounded-md text-sm transition ${view === 'bots' ? 'bg-blue-600 text-white' : 'text-neutral-400'}`}>Bots</button>
                </div>
            </div>

            {view === 'stats' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-neutral-900 rounded-2xl border border-white/5">
                        <div className="text-neutral-500 text-sm mb-1 uppercase tracking-wider">Active Subs</div>
                        <div className="text-4xl font-black">1,284</div>
                    </div>
                    <div className="p-6 bg-neutral-900 rounded-2xl border border-white/5">
                        <div className="text-neutral-500 text-sm mb-1 uppercase tracking-wider">Total Revenue</div>
                        <div className="text-4xl font-black text-green-400">45,200 ₽</div>
                    </div>
                </div>
            ) : <ManageBots />}
        </div>
    );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black text-neutral-100 font-sans">
        <nav className="p-4 border-b border-white/5 flex justify-center gap-8 text-xs font-bold uppercase tracking-widest text-neutral-500">
          <Link to="/" className="hover:text-white transition">User Client</Link>
          <Link to="/admin" className="hover:text-white transition">Management Panel</Link>
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
