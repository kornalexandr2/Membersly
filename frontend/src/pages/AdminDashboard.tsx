import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { StatCard } from '../components/StatCard';

export const AdminDashboard = ({ token, apiUrl }: { token: string, apiUrl: string }) => {
    const [view, setView] = useState('stats');
    const [stats, setStats] = useState<any>({ active_subscriptions: 0, total_revenue: 0, new_users_today: 0, monthly_revenue: 0 });
    const [dataList, setDataList] = useState<any[]>([]);
    const [channels, setChannels] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [form, setForm] = useState<any>({ access_level: 'full_access', is_recurring: false, selectedChannels: [] });

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const fetchData = async () => {
        if (!token) return;
        setSearchTerm('');
        if (view === 'stats') {
            const res = await fetch(`${apiUrl}/admin/stats`, { headers });
            setStats(await res.json());
        } else if (view === 'tariffs') {
            const [tRes, cRes] = await Promise.all([
                fetch(`${apiUrl}/admin/tariffs`, { headers }),
                fetch(`${apiUrl}/admin/channels`, { headers })
            ]);
            setDataList(await tRes.json());
            setChannels(await cRes.json());
        } else {
            const res = await fetch(`${apiUrl}/admin/${view}`, { headers });
            const data = await res.json();
            setDataList(Array.isArray(data) ? data : []);
        }
    };

    useEffect(() => { fetchData(); }, [view, token]);

    const handleAction = async (method: string, endpoint: string, body?: any) => {
        const res = await fetch(`${apiUrl}/admin/${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
        if (res.ok) fetchData();
    };

    const toggleChannel = (id: number) => {
        setForm((prev: any) => ({
            ...prev,
            selectedChannels: prev.selectedChannels.includes(id) 
                ? prev.selectedChannels.filter((i: number) => i !== id) 
                : [...prev.selectedChannels, id]
        }));
    };

    if (!token) return <Navigate to="/login" />;

    const filteredList = dataList.filter(item => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        if (view === 'users') {
            return item.full_name?.toLowerCase().includes(search) || 
                   item.username?.toLowerCase().includes(search) || 
                   item.telegram_id.toString().includes(search);
        }
        if (view === 'coupons') return item.code.toLowerCase().includes(search);
        if (view === 'channels' || view === 'tariffs') return item.title.toLowerCase().includes(search);
        return true;
    });

    return (
        <div className="p-4 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-3xl font-black uppercase italic tracking-tighter">Membersly <span className="text-blue-600">.OS</span></div>
                <div className="flex bg-neutral-900 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
                    {['stats', 'bots', 'channels', 'tariffs', 'broadcast', 'users', 'coupons'].map((v) => (
                        <button key={v} onClick={() => setView(v)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${view === v ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-neutral-500 hover:text-white'}`}>{v}</button>
                    ))}
                </div>
            </div>

            {view !== 'stats' && view !== 'broadcast' && (
                <div className="px-2">
                    <input 
                        className="w-full bg-neutral-900 border border-white/5 rounded-2xl px-6 py-4 text-[10px] font-black tracking-widest focus:border-blue-500 outline-none transition-all shadow-inner text-white uppercase"
                        placeholder={`SEARCH IN ${view.toUpperCase()}...`}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            {view === 'stats' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                    <StatCard label="Active Base" value={stats.active_subscriptions} />
                    <StatCard label="Total Cash" value={`${stats.total_revenue} ₽`} color="text-green-500" />
                    <StatCard label="30D Velocity" value={`${stats.monthly_revenue} ₽`} color="text-blue-400" />
                    <StatCard label="New Pulse" value={stats.new_users_today} />
                </div>
            )}

            {view === 'users' && (
                <div className="bg-neutral-900 rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[600px]">
                        <thead className="bg-white/5 text-neutral-500 uppercase font-black"><tr className="border-b border-white/5"><th className="p-6">User Entity</th><th className="p-6">Balance</th><th className="p-6">Access Control</th></tr></thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredList.map(u => (
                                <tr key={u.telegram_id} className="hover:bg-white/[0.02] transition">
                                    <td className="p-6">
                                        <div className="font-bold text-sm uppercase">{u.full_name}</div>
                                        <div className="text-neutral-500">@{u.username || 'N/A'} • <span className="font-mono text-[10px]">{u.telegram_id}</span></div>
                                    </td>
                                    <td className="p-6 font-mono text-blue-400">{u.balance} Ⓜ️</td>
                                    <td className="p-6 flex gap-3">
                                        <button onClick={() => {const a = prompt('New Balance?'); if(a) handleAction('POST', `users/${u.telegram_id}/balance`, parseFloat(a))}} className="text-[10px] font-black uppercase text-blue-500 hover:text-white transition border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500">Edit_Ⓜ️</button>
                                        <button onClick={() => {const d = prompt('Add Days?'); if(d) handleAction('POST', `users/${u.telegram_id}/extend`, {tariff_id: 1, days: parseInt(d)})}} className="text-[10px] font-black uppercase text-green-500 hover:text-white transition border border-green-500/20 px-3 py-1.5 rounded-lg hover:bg-green-500">+Ext_Sub</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {view === 'coupons' && (
                <div className="space-y-6">
                    <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/10 flex flex-wrap gap-4 shadow-xl">
                        <input placeholder="CODE" className="bg-black p-4 rounded-2xl flex-1 min-w-[150px] text-xs font-bold border border-white/5" onChange={e => setForm({...form, code: e.target.value})} />
                        <input placeholder="VALUE" className="bg-black p-4 rounded-2xl w-24 text-xs font-bold border border-white/5" onChange={e => setForm({...form, val: e.target.value})} />
                        <select className="bg-black p-4 rounded-2xl text-[10px] font-black uppercase border border-white/5 text-neutral-400" onChange={e => setForm({...form, type: e.target.value})}>
                            <option value="fixed">RUB</option>
                            <option value="percent">%</option>
                        </select>
                        <button onClick={() => handleAction('POST', 'coupons', {code: form.code, value: parseFloat(form.val), discount_type: form.type || 'fixed', usage_limit: 100})} className="bg-blue-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-600/20">Generate</button>
                    </div>
                    <div className="grid gap-3">
                        {filteredList.map(c => (
                            <div key={c.id} className="p-6 bg-neutral-900 rounded-[2rem] border border-white/5 flex justify-between items-center hover:bg-white/[0.01] transition-all group">
                                <div><div className="font-black text-blue-500 tracking-widest uppercase">{c.code}</div><div className="text-[10px] text-neutral-500 font-bold uppercase mt-1">{c.value} {c.discount_type === 'percent' ? '%' : 'RUB'} • Used: {c.used_count}/{c.usage_limit}</div></div>
                                <button onClick={() => handleAction('DELETE', `coupons/${c.id}`)} className="text-red-600 font-black text-[10px] uppercase border border-red-600/10 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all">Revoke</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'tariffs' && (
                <div className="space-y-8">
                    <form className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/10 space-y-6 shadow-2xl" onSubmit={e => e.preventDefault()}>
                        <h3 className="text-lg font-bold text-blue-400 uppercase tracking-widest italic text-center">Protocol Architect</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input placeholder="PLAN NAME" className="bg-black p-4 rounded-2xl text-xs font-bold border border-white/5" onChange={e => setForm({...form, title: e.target.value})} />
                            <input placeholder="PRICE (RUB)" className="bg-black p-4 rounded-2xl text-xs font-bold border border-white/5" onChange={e => setForm({...form, price: e.target.value})} />
                            <input placeholder="TRIAL (DAYS)" className="bg-black p-4 rounded-2xl text-xs font-bold border border-white/5" onChange={e => setForm({...form, trial: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-[10px] font-black text-neutral-500 uppercase mb-3 ml-2 tracking-[0.2em]">Hierarchy Level</p>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setForm({...form, access_level: 'read_only'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${form.access_level === 'read_only' ? 'bg-white text-black border-white shadow-lg' : 'bg-black text-neutral-600 border-white/5'}`}>Observer</button>
                                    <button type="button" onClick={() => setForm({...form, access_level: 'full_access'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${form.access_level === 'full_access' ? 'bg-white text-black border-white shadow-lg' : 'bg-black text-neutral-600 border-white/5'}`}>Operator</button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                                <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Recurrent Protocol</span>
                                <button type="button" onClick={() => setForm({...form, is_recurring: !form.is_recurring})} className={`w-12 h-6 rounded-full transition-all relative ${form.is_recurring ? 'bg-blue-600' : 'bg-neutral-800'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.is_recurring ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-neutral-500 uppercase mb-3 ml-2 tracking-[0.2em]">Resource Matrix</p>
                            <div className="flex flex-wrap gap-2">
                                {channels.map(c => (
                                    <button key={c.id} type="button" onClick={() => toggleChannel(c.id)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${form.selectedChannels.includes(c.id) ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-black border-white/5 text-neutral-600 hover:text-neutral-400'}`}>
                                        {c.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => handleAction('POST', 'tariffs', {title: form.title, price: parseFloat(form.price), currency: 'RUB', duration_days: 30, trial_days: parseInt(form.trial || 0), access_level: form.access_level, is_recurring: form.is_recurring, channel_ids: form.selectedChannels})} className="w-full bg-blue-600 py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/20">Establish Protocol</button>
                    </form>
                    <div className="grid gap-4">
                        {filteredList.map(t => (
                            <div key={t.id} className="p-6 bg-neutral-900 rounded-[2rem] border border-white/5 flex justify-between items-center hover:bg-white/[0.01] transition-all group">
                                <div>
                                    <div className="font-black text-xl uppercase tracking-tighter group-hover:text-blue-400 transition">{t.title}</div>
                                    <div className="flex gap-2 items-center mt-1 flex-wrap">
                                        <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded-full text-neutral-500 font-bold uppercase">{t.access_level}</span>
                                        {t.is_recurring && <span className="text-[9px] bg-green-500/10 px-2 py-0.5 rounded-full text-green-500 font-bold uppercase tracking-widest">Auto-Renew</span>}
                                        {t.channels?.map((c: any) => <span key={c.id} className="text-[8px] text-blue-500/60 font-black uppercase">#{c.title}</span>)}
                                    </div>
                                </div>
                                <button onClick={() => handleAction('DELETE', `tariffs/${t.id}`)} className="text-red-600 font-black text-[10px] uppercase border border-red-600/10 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all">Decommission</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'channels' && (
                <div className="space-y-6">
                    <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/10 flex flex-wrap gap-4 shadow-xl">
                        <input placeholder="TELEGRAM CHAT ID" className="bg-black p-4 rounded-2xl flex-1 min-w-[200px] text-xs font-bold border border-white/5" onChange={e => setForm({...form, chat_id: e.target.value})} />
                        <input placeholder="TITLE" className="bg-black p-4 rounded-2xl flex-1 min-w-[200px] text-xs font-bold border border-white/5" onChange={e => setForm({...form, title: e.target.value})} />
                        <button onClick={() => handleAction('POST', `channels?chat_id=${form.chat_id}&title=${form.title}&type=channel`)} className="bg-blue-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-600/20">Link Matrix</button>
                    </div>
                    <div className="grid gap-3">
                        {filteredList.map(c => (
                            <div key={c.id} className="p-6 bg-neutral-900 rounded-[2rem] border border-white/5 flex justify-between items-center hover:bg-white/[0.01] transition-all group">
                                <div><div className="font-black text-sm uppercase tracking-tighter group-hover:text-blue-400 transition">{c.title}</div><div className="text-[10px] text-neutral-500 font-bold mt-1">UUID: {c.telegram_chat_id}</div></div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[8px] bg-white/5 px-2 py-1 rounded-full font-black uppercase text-neutral-500 tracking-widest">{c.type}</span>
                                    <button onClick={() => handleAction('DELETE', `channels/${c.id}`)} className="text-red-600 font-black text-[10px] uppercase border border-red-600/10 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all">Unlink</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'broadcast' && (
                <div className="bg-neutral-900 p-10 rounded-[3rem] border border-white/10 max-w-2xl mx-auto space-y-8 shadow-2xl animate-in zoom-in-95 duration-500">
                    <h3 className="text-2xl font-black uppercase text-white tracking-tight italic text-center">Global Neural <span className="text-blue-600">Broadcast</span></h3>
                    <textarea className="w-full bg-black border border-white/10 rounded-[2rem] p-8 text-sm h-64 focus:border-blue-500 outline-none transition-all shadow-inner text-neutral-300" placeholder="Enter transmission data for all synchronized entities..." onChange={e => setForm({msg: e.target.value})} />
                    <button onClick={() => handleAction('POST', 'broadcast', form.msg)} className="w-full bg-blue-600 py-6 rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-500 transition shadow-2xl shadow-blue-600/40 transform active:scale-95">Initiate Neural Blast</button>
                </div>
            )}

            {view === 'bots' && (
                <div className="space-y-6">
                    <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/10 flex flex-wrap gap-4 shadow-xl">
                        <input placeholder="SECURE BOT TOKEN" className="bg-black p-4 rounded-2xl flex-1 min-w-[250px] text-xs font-bold border border-white/5" onChange={e => setForm({...form, token: e.target.value})} />
                        <button onClick={() => handleAction('POST', 'bots', {token: form.token, title: 'Drone'})} className="bg-blue-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-600/20">Authorize Drone</button>
                    </div>
                    <div className="grid gap-3">
                        {dataList.map(b => (
                            <div key={b.id} className="p-6 bg-neutral-900 rounded-[2rem] border border-white/5 flex justify-between items-center hover:bg-white/[0.01] transition-all group">
                                <div className="truncate pr-8">
                                    <span className="text-[10px] font-black text-neutral-600 block mb-1 uppercase tracking-widest italic">Signal Pulse Active</span>
                                    <span className="text-xs font-mono text-neutral-400 group-hover:text-blue-400 transition-colors">{b.token.substring(0, 40)}...</span>
                                </div>
                                <button onClick={() => handleAction('DELETE', `bots/${b.id}`)} className="text-red-600 font-black text-[10px] uppercase border border-red-600/10 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all">Deauthorize</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
