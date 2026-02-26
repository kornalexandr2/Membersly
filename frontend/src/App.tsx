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
            <div className="text-[10px] font-black uppercase text-neutral-500 mb-1">Affiliate Link</div>
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

// ... Admin Dashboard and App components remain as before ...
function App() {
    const { i18n } = useTranslation();
    const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
    return (
        <Router>
            <div className="min-h-screen bg-black text-neutral-100 font-sans">
                <nav className="p-6 border-b border-white/5 flex justify-between items-center px-10">
                    <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600">
                        <Link to="/" className="hover:text-white transition">Terminal</Link>
                        <Link to="/admin" className="hover:text-white transition">Control</Link>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex gap-3">
                            <button onClick={() => i18n.changeLanguage('ru')} className={`text-[10px] font-bold ${i18n.language === 'ru' ? 'text-blue-500' : 'text-neutral-700'}`}>RU</button>
                            <button onClick={() => i18n.changeLanguage('en')} className={`text-[10px] font-bold ${i18n.language === 'en' ? 'text-blue-500' : 'text-neutral-700'}`}>EN</button>
                        </div>
                        {token && <button onClick={() => { setToken(''); localStorage.removeItem('admin_token'); }} className="text-[10px] font-black uppercase text-red-600/40 hover:text-red-500 transition border border-red-500/10 px-4 py-1.5 rounded-full">System Exit</button>}
                    </div>
                </nav>
                <div className="py-8"><Routes><Route path="/" element={<ClientZone />} /><Route path="/admin" element={<AdminDashboard token={token} />} /><Route path="/login" element={<div>Login Page</div>} /></Routes></div>
            </div>
        </Router>
    );
}
export default App;
