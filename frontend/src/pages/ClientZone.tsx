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

  const getAccess = (s_id: number, c_id: number) => {
    if (!token) return;
    fetch(`${apiUrl}/orders/access-link/${s_id}/${c_id}`, { headers: { 'Authorization': `Bearer ${token}` }})
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
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* 1. HERO SECTION */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden border-b border-white/5">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full -z-10"></div>
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none animate-in fade-in slide-in-from-top-10 duration-1000">
            {t('landing_hero_title')}
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 font-medium max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-10 delay-300 duration-1000">
            {t('landing_hero_subtitle')}
          </p>
          <div className="pt-6 animate-in fade-in zoom-in delay-500 duration-1000">
            <button onClick={() => document.getElementById('app-main')?.scrollIntoView({ behavior: 'smooth' })} className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-6 rounded-full font-black uppercase tracking-widest text-sm shadow-2xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95">
              {t('landing_hero_cta')}
            </button>
          </div>
        </div>
      </section>

      {/* 2. FEATURES SECTION */}
      <section className="py-24 px-6 bg-neutral-950/50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="space-y-4">
            <div className="text-4xl">🤖</div>
            <h3 className="text-xl font-black uppercase tracking-tight">{t('landing_feature_1_title')}</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">{t('landing_feature_1_desc')}</p>
          </div>
          <div className="space-y-4">
            <div className="text-4xl">💳</div>
            <h3 className="text-xl font-black uppercase tracking-tight">{t('landing_feature_2_title')}</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">{t('landing_feature_2_desc')}</p>
          </div>
          <div className="space-y-4">
            <div className="text-4xl">📊</div>
            <h3 className="text-xl font-black uppercase tracking-tight">{t('landing_feature_3_title')}</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">{t('landing_feature_3_desc')}</p>
          </div>
        </div>
      </section>

      {/* 3. FUNCTIONAL APP SECTION */}
      <section id="app-main" className="py-24 px-4 max-w-3xl mx-auto space-y-12">
        <div className="text-center space-y-2 mb-16">
          <h2 className="text-sm font-black uppercase tracking-[0.5em] text-blue-500 italic">User Terminal</h2>
          <div className="h-1 w-20 bg-blue-600 mx-auto rounded-full"></div>
        </div>

        {/* Profile Card */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-neutral-900 p-8 rounded-[3rem] border border-white/10 shadow-2xl gap-8">
            <div className="text-center md:text-left">
              <div className="text-xs font-black uppercase text-neutral-400 mb-2 tracking-widest">{t('client_balance')}</div>
              <div className={`text-5xl font-black tracking-tighter ${profile?.balance > 0 ? 'text-blue-500' : 'text-neutral-700'}`}>{profile?.balance || 0} Ⓜ️</div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-xs font-black uppercase text-neutral-400 mb-2 tracking-widest">{t('client_ref_link')}</div>
              <div className="text-xs font-mono text-blue-400 bg-black/50 px-6 py-3 rounded-2xl border border-white/5 break-all">t.me/{botUsername}?start=ref_{tgUser?.id || profile?.telegram_id || 'ERROR'}</div>
            </div>
        </div>

        {/* Promo Code */}
        <div className="px-4">
            <input 
              className="w-full bg-neutral-900 border border-white/10 rounded-3xl px-8 py-6 text-sm font-black tracking-widest focus:border-blue-500 outline-none transition-all shadow-inner text-white text-center"
              placeholder={t('client_promo_placeholder')}
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            />
        </div>

        {/* Active Subscriptions */}
        {userSubs.length > 0 && (
          <div className="space-y-8">
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-neutral-400 ml-10 italic border-l-4 border-blue-600 pl-6">{t('client_active_protocols')}</h2>
              <div className="grid gap-6">
                  {userSubs.map(sub => (
                      <div key={sub.id} className="bg-neutral-900 p-10 rounded-[3rem] border border-white/10 space-y-8 shadow-2xl">
                          <div className="flex justify-between items-start">
                              <div>
                                  <div className="font-black uppercase tracking-tight text-2xl">{sub.tariff?.title || t('client_protocol')}</div>
                                  <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">{t('client_expires')}: {new Date(sub.end_date).toLocaleDateString()}</div>
                              </div>
                              <button onClick={() => toggleRenew(sub.id)} className={`text-[10px] font-black uppercase px-6 py-3 rounded-2xl border transition-all ${sub.auto_renew ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 border-white/10 text-neutral-600'}`}>
                                  {sub.auto_renew ? t('client_renew_on') : t('client_renew_off')}
                              </button>
                          </div>
                          
                          <div className="space-y-4">
                              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-4">{t('client_assigned_resources')}</p>
                              <div className="grid grid-cols-1 gap-3">
                                  {sub.tariff?.channels?.map((c: any) => (
                                      <button key={c.id} onClick={() => getAccess(sub.id, c.id)} className="w-full bg-white/[0.03] hover:bg-blue-600 text-white p-6 rounded-[2rem] flex justify-between items-center group transition-all border border-white/5 hover:scale-[1.02] active:scale-[0.98]">
                                          <span className="font-black text-lg uppercase tracking-tighter">{t('client_enter')} {c.title}</span>
                                          <span className="text-xs font-black uppercase opacity-40 group-hover:opacity-100 transition-opacity">{t('client_access_link')}</span>
                                      </button>
                                  ))}
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
        )}

        {/* Pricing Table */}
        <div className="bg-neutral-900 p-12 rounded-[4rem] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full"></div>
          <h2 className="text-3xl font-black mb-12 uppercase text-white tracking-tighter italic flex items-center gap-4">
              <span className="w-12 h-[3px] bg-blue-600"></span> {t('client_upgrade')}
          </h2>
          <div className="grid gap-6">
              {tariffs.map(t_item => (
                <div key={t_item.id} className="p-8 bg-black/40 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center border border-white/5 hover:border-blue-500/30 transition-all group gap-6">
                    <div className="space-y-3 text-center md:text-left">
                      <div className="font-black text-2xl uppercase tracking-tighter group-hover:text-blue-400 transition-colors">{t_item.title}</div>
                      <div className="flex gap-2 flex-wrap justify-center md:justify-start">
                          {t_item.channels?.map((c: any) => (
                              <span key={c.id} className="text-[10px] bg-blue-500/10 text-blue-500 px-4 py-1.5 rounded-full font-black uppercase tracking-widest border border-blue-500/20">{c.title}</span>
                          ))}
                      </div>
                    </div>
                    <button onClick={() => handlePay(t_item.id)} className="w-full md:w-auto bg-white text-black hover:bg-blue-600 hover:text-white px-12 py-5 rounded-full font-black text-sm uppercase transition-all transform active:scale-95 shadow-2xl hover:scale-105">
                      {t_item.price} {t_item.currency || '₽'}
                    </button>
                </div>))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 text-center border-t border-white/5 bg-neutral-950">
        <div className="text-sm font-black uppercase tracking-[0.5em] text-neutral-700">MEMBERSLY</div>
        <p className="text-[10px] text-neutral-600 uppercase mt-4 tracking-widest">&copy; 2026 System Core. All rights reserved.</p>
      </footer>
    </div>
  );
};
