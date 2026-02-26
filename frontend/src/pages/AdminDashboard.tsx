import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { StatCard } from '../components/StatCard';

export const AdminDashboard = ({ token, apiUrl }: { token: string, apiUrl: string }) => {
    const [view, setView] = useState('stats');
    const [stats, setStats] = useState<any>({ active_subscriptions: 0, total_revenue: 0, new_users_today: 0, monthly_revenue: 0 });
    const [dataList, setDataList] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [form, setForm] = useState<any>({ access_level: 'full_access', is_recurring: false, selectedChannels: [] });

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const fetchData = async () => {
        if (!token) return;
        if (view === 'stats') {
            const res = await fetch(`${apiUrl}/admin/stats`, { headers });
            setStats(await res.json());
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

            {view === 'tariffs' && (
                <div className="space-y-8">
                    <form className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/10 space-y-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-blue-400 uppercase tracking-widest italic">New Protocol Creation</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input placeholder="PLAN NAME" className="bg-black p-4 rounded-2xl text-xs font-bold border border-white/5" onChange={e => setForm({...form, title: e.target.value})} />
                            <input placeholder="PRICE (RUB)" className="bg-black p-4 rounded-2xl text-xs font-bold border border-white/5" onChange={e => setForm({...form, price: e.target.value})} />
                            <input placeholder="TRIAL (DAYS)" className="bg-black p-4 rounded-2xl text-xs font-bold border border-white/5" onChange={e => setForm({...form, trial: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-[10px] font-black text-neutral-500 uppercase mb-3 ml-2 tracking-[0.2em]">Access Hierarchy</p>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setForm({...form, access_level: 'read_only'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${form.access_level === 'read_only' ? 'bg-white text-black border-white' : 'bg-black text-neutral-600 border-white/5'}`}>Read Only</button>
                                    <button type="button" onClick={() => setForm({...form, access_level: 'full_access'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${form.access_level === 'full_access' ? 'bg-white text-black border-white' : 'bg-black text-neutral-600 border-white/5'}`}>Full Access</button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                                <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Auto-Recurrency</span>
                                <button type="button" onClick={() => setForm({...form, is_recurring: !form.is_recurring})} className={`w-12 h-6 rounded-full transition-all relative ${form.is_recurring ? 'bg-blue-600' : 'bg-neutral-800'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.is_recurring ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-neutral-500 uppercase mb-3 ml-2 tracking-[0.2em]">Linked Resources</p>
                            <div className="flex flex-wrap gap-2">
                                {/* Note: Channels need to be fetched, assuming they are in dataList when view changes or fetched separately */}
                                <p className="text-[9px] text-neutral-600 italic">Select channels from 'Channels' tab first to link here.</p>
                            </div>
                        </div>
                        <button onClick={(e) => {e.preventDefault(); handleAction('POST', 'tariffs', {title: form.title, price: parseFloat(form.price), currency: 'RUB', duration_days: 30, trial_days: parseInt(form.trial || 0), access_level: form.access_level, is_recurring: form.is_recurring, channel_ids: []})}} className="w-full bg-blue-600 py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/20">Establish Protocol</button>
                    </form>
                    <div className="grid gap-4">
                        {dataList.map(t => (
                            <div key={t.id} className="p-6 bg-neutral-900 rounded-[2rem] border border-white/5 flex justify-between items-center hover:bg-white/[0.01] transition-all group">
                                <div className="space-y-1">
                                    <div className="font-black text-xl uppercase tracking-tighter group-hover:text-blue-400 transition">{t.title}</div>
                                    <div className="flex gap-2">
                                        <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded-full text-neutral-500 font-bold uppercase">{t.access_level}</span>
                                        {t.is_recurring && <span className="text-[9px] bg-green-500/10 px-2 py-0.5 rounded-full text-green-500 font-bold uppercase">Recurring</span>}
                                    </div>
                                </div>
                                <button onClick={() => handleAction('DELETE', `tariffs/${t.id}`)} className="text-red-600 font-black text-[10px] uppercase hover:underline">Decommission</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Rest of the views (stats, users, coupons, broadcast, bots, channels) follow similar modular handleAction pattern */}
            {view === 'stats' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                    <StatCard label="Active Base" value={stats.active_subscriptions} />
                    <StatCard label="Total Cash" value={`${stats.total_revenue} ₽`} color="text-green-500" />
                    <StatCard label="30D Velocity" value={`${stats.monthly_revenue} ₽`} color="text-blue-400" />
                    <StatCard label="New Pulse" value={stats.new_users_today} />
                </div>
            )}
        </div>
    );
};
