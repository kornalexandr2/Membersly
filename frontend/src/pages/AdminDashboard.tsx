import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { StatCard } from '../components/StatCard';

export const AdminDashboard = ({ token, apiUrl }: { token: string, apiUrl: string }) => {
    const [view, setView] = useState('stats');
    const [stats, setStats] = useState<any>({ active_subscriptions: 0, total_revenue: 0, new_users_today: 0, monthly_revenue: 0 });
    const [dataList, setDataList] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [form, setForm] = useState<any>({});

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

    if (!token) return <Navigate to="/login" />;

    const filteredUsers = dataList.filter(u => 
        view === 'users' && (
            u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.telegram_id.toString().includes(searchTerm)
        )
    );

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

            {view === 'stats' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Active Base" value={stats.active_subscriptions} />
                    <StatCard label="Total Cash" value={`${stats.total_revenue} ₽`} color="text-green-500" />
                    <StatCard label="30D Velocity" value={`${stats.monthly_revenue} ₽`} color="text-blue-400" />
                    <StatCard label="New Pulse" value={stats.new_users_today} />
                </div>
            )}

            {view === 'users' && (
                <div className="space-y-6">
                    <input 
                        className="w-full bg-neutral-900 border border-white/5 rounded-2xl px-6 py-4 text-xs font-bold tracking-widest focus:border-blue-500 outline-none transition-all"
                        placeholder="SEARCH BY NAME, USERNAME OR ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <div className="bg-neutral-900 rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-white/5 text-neutral-500 uppercase font-black"><tr className="border-b border-white/5"><th className="p-6">User Entity</th><th className="p-6">Balance</th><th className="p-6">Control</th></tr></thead>
                            <tbody className="divide-y divide-white/5">
                                {(searchTerm ? filteredUsers : dataList).map(u => (
                                    <tr key={u.telegram_id} className="hover:bg-white/[0.02] transition group">
                                        <td className="p-6">
                                            <div className="font-bold text-sm uppercase">{u.full_name}</div>
                                            <div className="text-neutral-500">@{u.username || 'hidden'} • <span className="font-mono text-[10px]">{u.telegram_id}</span></div>
                                        </td>
                                        <td className="p-6 font-mono text-blue-400">{u.balance} Ⓜ️</td>
                                        <td className="p-6 flex gap-3">
                                            <button onClick={() => {const a = prompt('New Balance?'); if(a) handleAction('POST', `users/${u.telegram_id}/balance`, parseFloat(a))}} className="text-[10px] font-black uppercase text-blue-500 hover:text-white transition">Edit_Ⓜ️</button>
                                            <button onClick={() => {const d = prompt('Add Days?'); if(d) handleAction('POST', `users/${u.telegram_id}/extend`, {tariff_id: 1, days: parseInt(d)})}} className="text-[10px] font-black uppercase text-green-500 hover:text-white transition">+Ext_Sub</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === 'bots' && (
                <div className="space-y-6">
                    <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/10 flex gap-4">
                        <input placeholder="BOT TOKEN" className="bg-black p-4 rounded-2xl flex-1 text-xs font-bold" onChange={e => setForm({...form, token: e.target.value})} />
                        <button onClick={() => handleAction('POST', 'bots', {token: form.token, title: 'Bot'})} className="bg-blue-600 px-8 rounded-2xl font-black text-[10px] uppercase">Authorize</button>
                    </div>
                    <div className="grid gap-3">
                        {dataList.map(b => (
                            <div key={b.id} className="p-6 bg-neutral-900 rounded-[2rem] border border-white/5 flex justify-between items-center hover:border-white/10 transition-all">
                                <div className="truncate pr-8">
                                    <span className="text-[10px] font-bold text-neutral-600 block mb-1 uppercase tracking-widest">Active Signal</span>
                                    <span className="text-xs font-mono text-neutral-400">{b.token.substring(0, 40)}...</span>
                                </div>
                                <button onClick={() => handleAction('DELETE', `bots/${b.id}`)} className="text-red-600 font-black text-[10px] uppercase border border-red-600/20 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all">Revoke</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Other views remain same or use the handleAction pattern */}
            {view === 'tariffs' && (
                <div className="space-y-6">
                    <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/10 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input placeholder="PLAN NAME" className="bg-black p-4 rounded-2xl text-xs font-bold" onChange={e => setForm({...form, title: e.target.value})} />
                            <input placeholder="PRICE (RUB)" className="bg-black p-4 rounded-2xl text-xs font-bold" onChange={e => setForm({...form, price: e.target.value})} />
                        </div>
                        <button onClick={() => handleAction('POST', 'tariffs', {title: form.title, price: parseFloat(form.price), currency: 'RUB', duration_days: 30})} className="w-full bg-blue-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Establish Protocol</button>
                    </div>
                    <div className="grid gap-4">
                        {dataList.map(t => (
                            <div key={t.id} className="p-6 bg-neutral-900 rounded-[2rem] border border-white/5 flex justify-between items-center hover:bg-white/[0.02] transition">
                                <div><div className="font-black text-xl uppercase tracking-tighter text-blue-400">{t.title}</div><div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{t.price} ₽ • {t.duration_days} days</div></div>
                                <button onClick={() => handleAction('DELETE', `tariffs/${t.id}`)} className="text-red-600 font-black text-[10px] uppercase hover:underline">Decommission</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
