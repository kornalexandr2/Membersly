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
    } catch (e) { 
        console.error(e); 
        alert('Failed to connect to the server. Please try again later.');
    }
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
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            alert(data.detail || 'Payment initialization failed');
            return;
        }
        if(data.payment_url) window.location.href = data.payment_url; 
        else if (data.status === 'succeeded') { 
            alert('Activated successfully!'); 
            setCoupon('');
            fetchData(); 
        }
    }).catch(e => {
        console.error(e);
        alert('Network error. Try again.');
    });
  };

  const getAccess = (s_id: number, c_id: number) => {
    if (!token) return;
    fetch(`${apiUrl}/orders/access-link/${s_id}/${c_id}`, { headers: { 'Authorization': `Bearer ${token}` }})
        .then(async res => {
            const data = await res.json();
            if (!res.ok) {
                alert(data.detail || 'Failed to generate access link');
                return;
            }
            if(data.invite_link) {
                const tg = (window as any).Telegram?.WebApp;
                if (tg && tg.openTelegramLink) {
                    tg.openTelegramLink(data.invite_link);
                } else {
                    window.open(data.invite_link, '_blank');
                }
            } 
        }).catch(e => {
            console.error(e);
            alert('Network error while generating link.');
        });
  };

  const toggleRenew = (s_id: number) => {
    if (!token) return;
    fetch(`${apiUrl}/orders/subscriptions/${s_id}/toggle-renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    }).then(async res => {
        if (!res.ok) {
            const data = await res.json();
            alert(data.detail || 'Failed to toggle auto-renew');
            return;
        }
        fetchData();
    }).catch(e => console.error(e));
  };

  const copyRefLink = () => {
    const link = `t.me/${botUsername}?start=ref_${tgUser?.id || profile?.telegram_id || ''}`;
    navigator.clipboard.writeText(link).then(() => {
        const tg = (window as any).Telegram?.WebApp;
        if (tg && tg.showAlert) tg.showAlert('Referral link copied!');
        else alert('Referral link copied!');
    });
  };

  const isTg = !!(window as any).Telegram?.WebApp?.initData;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 overflow-x-hidden">
      {!isTg && (
        <>
          {/* 1. HERO SECTION */}
          <section className="relative pt-12 md:pt-20 pb-20 md:pb-32 px-4 md:px-6 overflow-hidden border-b border-white/5">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full -z-10"></div>
            <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-10">
              <h1 className="text-4xl sm:text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none animate-in fade-in slide-in-from-top-10 duration-1000 break-words">
                {t('landing_hero_title')}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-neutral-400 font-medium max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-10 delay-300 duration-1000 px-2">
                {t('landing_hero_subtitle')}
              </p>
              <div className="pt-4 md:pt-6 animate-in fade-in zoom-in delay-500 duration-1000">
                <button onClick={() => document.getElementById('app-main')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 md:px-12 py-5 md:py-6 rounded-full font-black uppercase tracking-widest text-xs md:text-sm shadow-2xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95">
                  {t('landing_hero_cta')}
                </button>
              </div>
            </div>
          </section>

          {/* 2. FEATURES SECTION */}
          <section className="py-16 md:py-24 px-4 md:px-6 bg-neutral-950/50">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
              <div className="space-y-3 md:space-y-4">
                <div className="text-3xl md:text-4xl">🤖</div>
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">{t('landing_feature_1_title')}</h3>
                <p className="text-xs md:text-sm text-neutral-500 leading-relaxed px-4">{t('landing_feature_1_desc')}</p>
              </div>
              <div className="space-y-3 md:space-y-4">
                <div className="text-3xl md:text-4xl">💳</div>
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">{t('landing_feature_2_title')}</h3>
                <p className="text-xs md:text-sm text-neutral-500 leading-relaxed px-4">{t('landing_feature_2_desc')}</p>
              </div>
              <div className="space-y-3 md:space-y-4">
                <div className="text-3xl md:text-4xl">📊</div>
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">{t('landing_feature_3_title')}</h3>
                <p className="text-xs md:text-sm text-neutral-500 leading-relaxed px-4">{t('landing_feature_3_desc')}</p>
              </div>
            </div>
          </section>
        </>
      )}

      {/* 3. FUNCTIONAL APP SECTION */}
      <section id="app-main" className={`px-4 max-w-3xl mx-auto space-y-8 md:space-y-12 ${isTg ? 'py-6 md:py-10' : 'py-16 md:py-24'}`}>
        {!isTg && (
          <div className="text-center space-y-2 mb-8 md:mb-16">
            <h2 className="text-xs md:text-sm font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-blue-500 italic">User Terminal</h2>
            <div className="h-1 w-16 md:w-20 bg-blue-600 mx-auto rounded-full"></div>
          </div>
        )}

        {/* Profile Card */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-neutral-900 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/10 shadow-2xl gap-6 md:gap-8">
            <div className="text-center sm:text-left w-full sm:w-auto">
              <div className="text-[10px] md:text-xs font-black uppercase text-neutral-400 mb-1 md:mb-2 tracking-widest">{t('client_balance')}</div>
              <div className={`text-4xl md:text-5xl font-black tracking-tighter break-words ${profile?.balance > 0 ? 'text-blue-500' : 'text-neutral-700'}`}>{profile?.balance || 0} Ⓜ️</div>
            </div>
            <div className="text-center sm:text-right w-full sm:w-auto">
              <div className="text-[10px] md:text-xs font-black uppercase text-neutral-400 mb-1 md:mb-2 tracking-widest">{t('client_ref_link')}</div>
              <div onClick={copyRefLink} className="text-[10px] md:text-xs font-mono text-blue-400 bg-black/50 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border border-white/5 break-all w-full cursor-pointer hover:bg-blue-600/10 hover:border-blue-500/30 transition-all active:scale-95">t.me/{botUsername}?start=ref_{tgUser?.id || profile?.telegram_id || 'ERROR'}</div>
            </div>
        </div>

        {/* Promo Code */}
        <div className="px-2 md:px-4">
            <input 
              className="w-full bg-neutral-900 border border-white/10 rounded-2xl md:rounded-3xl px-6 md:px-8 py-4 md:py-6 text-xs md:text-sm font-black tracking-widest focus:border-blue-500 outline-none transition-all shadow-inner text-white text-center uppercase"
              placeholder={t('client_promo_placeholder')}
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            />
        </div>

        {/* Active Subscriptions */}
        {userSubs.length > 0 && (
          <div className="space-y-6 md:space-y-8">
              <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-neutral-400 ml-4 md:ml-10 italic border-l-4 border-blue-600 pl-4 md:pl-6">{t('client_active_protocols')}</h2>
              <div className="grid gap-4 md:gap-6">
                  {userSubs.map(sub => (
                      <div key={sub.id} className="bg-neutral-900 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/10 space-y-6 md:space-y-8 shadow-2xl">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
                              <div className="w-full sm:w-auto">
                                  <div className="font-black uppercase tracking-tight text-xl md:text-2xl break-words">{sub.tariff?.title || t('client_protocol')}</div>
                                  <div className="text-[10px] md:text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">{t('client_expires')}: {new Date(sub.end_date).toLocaleDateString()}</div>
                              </div>
                              <button onClick={() => toggleRenew(sub.id)} className={`w-full sm:w-auto text-[9px] md:text-[10px] font-black uppercase px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl border transition-all ${sub.auto_renew ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 border-white/10 text-neutral-600'}`}>
                                  {sub.auto_renew ? t('client_renew_on') : t('client_renew_off')}
                              </button>
                          </div>
                          
                          <div className="space-y-3 md:space-y-4">
                              <p className="text-[8px] md:text-[10px] font-black text-neutral-500 uppercase tracking-[0.1em] md:tracking-[0.2em] ml-2 md:ml-4">{t('client_assigned_resources')}</p>
                              <div className="grid grid-cols-1 gap-2 md:gap-3">
                                  {sub.tariff?.channels?.map((c: any) => (
                                      <button key={c.id} onClick={() => getAccess(sub.id, c.id)} className="w-full bg-white/[0.03] hover:bg-blue-600 text-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] flex flex-col sm:flex-row justify-between items-center sm:items-center group transition-all border border-white/5 hover:scale-[1.02] active:scale-[0.98] gap-2 sm:gap-0 text-center sm:text-left">
                                          <span className="font-black text-base md:text-lg uppercase tracking-tighter break-words max-w-full">{t('client_enter')} {c.title}</span>
                                          <span className="text-[9px] md:text-xs font-black uppercase opacity-60 sm:opacity-40 group-hover:opacity-100 transition-opacity whitespace-nowrap">{t('client_access_link')}</span>
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
        <div className="bg-neutral-900 p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-blue-600/5 blur-[100px] rounded-full"></div>
          <h2 className="text-2xl md:text-3xl font-black mb-8 md:mb-12 uppercase text-white tracking-tighter italic flex items-center gap-3 md:gap-4">
              <span className="w-8 md:w-12 h-[3px] bg-blue-600"></span> {t('client_upgrade')}
          </h2>
          <div className="grid gap-4 md:gap-6">
              {tariffs.map(t_item => (
                <div key={t_item.id} className="p-6 md:p-8 bg-black/40 rounded-[2rem] md:rounded-[2.5rem] flex flex-col sm:flex-row justify-between items-center border border-white/5 hover:border-blue-500/30 transition-all group gap-4 md:gap-6">
                    <div className="space-y-2 md:space-y-3 text-center sm:text-left w-full sm:w-auto">
                      <div className="font-black text-xl md:text-2xl uppercase tracking-tighter group-hover:text-blue-400 transition-colors break-words">{t_item.title}</div>
                      <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
                          {t_item.channels?.map((c: any) => (
                              <span key={c.id} className="text-[8px] md:text-[10px] bg-blue-500/10 text-blue-500 px-3 md:px-4 py-1 md:py-1.5 rounded-full font-black uppercase tracking-widest border border-blue-500/20">{c.title}</span>
                          ))}
                      </div>
                    </div>
                    <button onClick={() => handlePay(t_item.id)} className="w-full sm:w-auto bg-white text-black hover:bg-blue-600 hover:text-white px-8 md:px-12 py-4 md:py-5 rounded-full font-black text-xs md:text-sm uppercase transition-all transform active:scale-95 shadow-2xl hover:scale-105 whitespace-nowrap">
                      {t_item.price} {t_item.currency || '₽'}
                    </button>
                </div>))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 md:py-16 text-center border-t border-white/5 bg-neutral-950">
        <div className="text-xs md:text-sm font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-neutral-700">MEMBERSLY</div>
        <p className="text-[9px] md:text-[10px] text-neutral-600 uppercase mt-3 md:mt-4 tracking-widest">&copy; 2026 System Core. All rights reserved.</p>
      </footer>
    </div>
  );
};
