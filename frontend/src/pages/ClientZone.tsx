import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const ClientZone = ({ apiUrl }: { apiUrl: string }) => {
  const { t } = useTranslation();
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [userSubs, setUserSubs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [tgUser, setTgUser] = useState<any>(null);
  const [botUsername, setBotUsername] = useState('bot');
  const [coupon, setCoupon] = useState('');

  const [token, setToken] = useState<string | null>(localStorage.getItem('user_token'));

  const fetchData = async () => {
    if (!token) return;
    try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [tRes, sRes, pRes, cRes] = await Promise.all([
            fetch(`${apiUrl}/tariffs`),
            fetch(`${apiUrl}/orders/subscriptions`, { headers }),
            fetch(`${apiUrl}/profile`, { headers }),
            fetch(`${apiUrl}/config`)
        ]);
        setTariffs(await tRes.json());
        setUserSubs(await sRes.json());
        setProfile(await pRes.json());
        const config = await cRes.json();
        setBotUsername(config.bot_username);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.initData) {
      tg.ready();
      setTgUser(tg.initDataUnsafe?.user);
      
      // Perform Telegram Auth
      fetch(`${apiUrl}/auth/telegram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tg.initData)
      }).then(res => res.json()).then(data => {
          if (data.access_token) {
              setToken(data.access_token);
              localStorage.setItem('user_token', data.access_token);
          }
      });
    }
    fetchData();
  }, [apiUrl, token]);

  const handlePay = (t_id: number) => {
    if (!token) return;
    fetch(`${apiUrl}/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ tariff_id: t_id, use_balance: true, coupon_code: coupon })
    }).then(res => res.json()).then(data => { 
        if(data.payment_url) window.location.href = data.payment_url; 
        else if (data.status === 'succeeded') { alert('Activated!'); fetchData(); }
    });
  };

  const getAccess = (s_id: number) => {
    if (!token) return;
    fetch(`${apiUrl}/orders/access-link/${s_id}`, { headers: { 'Authorization': `Bearer ${token}` }})
        .then(res => res.json())
        .then(data => { if(data.invite_link) window.location.href = data.invite_link; });
  };

  const toggleRenew = (s_id: number) => {
    if (!token) return;
    fetch(`${apiUrl}/orders/subscriptions/${s_id}/toggle-renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    }).then(() => fetchData());
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center bg-neutral-900 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <div>
            <div className="text-[10px] font-black uppercase text-neutral-500 mb-1 tracking-widest">Global Balance</div>
            <div className={`text-4xl font-black tracking-tighter ${profile?.balance > 0 ? 'text-blue-500' : 'text-neutral-700'}`}>{profile?.balance || 0} Ⓜ️</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black uppercase text-neutral-500 mb-1">Referral Link</div>
            <div className="text-[10px] font-mono text-blue-400">t.me/{botUsername}?start=ref_{userId}</div>
          </div>
      </div>

      <div className="px-2">
          <input 
            className="w-full bg-neutral-900 border border-white/5 rounded-2xl px-6 py-4 text-xs font-black tracking-widest focus:border-blue-500 outline-none transition-all shadow-inner text-white"
            placeholder="PROMO CODE"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
          />
      </div>

      {userSubs.length > 0 && (
        <div className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600 ml-6 italic">Active Protocols</h2>
            <div className="grid gap-3">
                {userSubs.map(sub => (
                    <div key={sub.id} className="bg-neutral-900 p-6 rounded-[2rem] border border-white/5 space-y-4 shadow-xl">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-black uppercase tracking-tight text-lg">{sub.tariff?.title || 'Protocol'}</div>
                                <div className="text-[10px] text-neutral-500 font-bold">EXPIRES: {new Date(sub.end_date).toLocaleDateString()}</div>
                            </div>
                            <button onClick={() => toggleRenew(sub.id)} className={`text-[8px] font-black uppercase px-3 py-1 rounded-lg border transition-all ${sub.auto_renew ? 'bg-blue-600/20 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/10 text-neutral-600'}`}>
                                {sub.auto_renew ? 'Auto-renew ON' : 'Auto-renew OFF'}
                            </button>
                        </div>
                        <button onClick={() => getAccess(sub.id)} className="w-full bg-white text-black py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-lg">
                            Get Access Link
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}

      <div className="bg-neutral-900 p-8 rounded-[3.5rem] border border-white/5 shadow-2xl">
        <h2 className="text-xl font-black mb-8 uppercase text-white tracking-tighter italic flex items-center gap-3">
            <span className="w-8 h-[2px] bg-blue-600"></span> Upgrade Access
        </h2>
        <div className="grid gap-4">
            {tariffs.map(t_item => (
              <div key={t_item.id} className="p-6 bg-white/[0.02] rounded-[2rem] flex justify-between items-center border border-white/5 hover:border-white/10 transition group">
                  <div className="space-y-2">
                    <div className="font-black text-xl uppercase tracking-tighter group-hover:text-blue-400 transition">{t_item.title}</div>
                    <div className="flex gap-1.5 flex-wrap">
                        {t_item.channels?.map((c: any) => (
                            <span key={c.id} className="text-[8px] bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded-lg font-black uppercase tracking-widest">{c.title}</span>
                        ))}
                    </div>
                  </div>
                  <button onClick={() => handlePay(t_item.id)} className="bg-white text-black hover:bg-blue-600 hover:text-white px-8 py-4 rounded-3xl font-black text-xs uppercase transition-all transform active:scale-90 shadow-xl">
                    {t_item.price} ₽
                  </button>
              </div>))}
        </div>
      </div>
    </div>
  );
};
