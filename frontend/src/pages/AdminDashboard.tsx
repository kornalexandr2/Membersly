import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { StatCard } from '../components/StatCard';

export const AdminDashboard = ({ token, apiUrl }: { token: string, apiUrl: string }) => {
    const [view, setView] = useState('stats');
    const [stats, setStats] = useState<any>({ active_subscriptions: 0, total_revenue: 0, new_users_today: 0, monthly_revenue: 0 });
    const [dataList, setDataList] = useState<any[]>([]);
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

    return (
        <div className="p-4 max-w-6xl mx-auto space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-3xl font-black uppercase italic tracking-tighter">Membersly <span className="text-blue-600">.OS</span></div>
                <div className="flex bg-neutral-900 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
                    {['stats', 'bots', 'channels', 'tariffs', 'broadcast', 'users', 'coupons'].map((v) => (
                        <button key={v} onClick={() => setView(v)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${view === v ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-neutral-500 hover:text-white'}`}>{v}</button>
                    ))}
                </div>
            </div>

            {view === 'stats' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                    <StatCard label="Active Base" value={stats.active_subscriptions} />
                    <StatCard label="Total Cash" value={`${stats.total_revenue} ₽`} color="text-green-500" />
                    <StatCard label="30D Velocity" value={`${stats.monthly_revenue} ₽`} color="text-blue-400" />
                    <StatCard label="New Pulse" value={stats.new_users_today} />
                </div>
            )}

            {view === 'users' && (
                <div className="bg-neutral-900 rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 text-neutral-500 uppercase font-black"><tr className="border-b border-white/5"><th className="p-6">User Entity</th><th className="p-6">Balance</th><th className="p-6">Control</th></tr></thead>
                        <tbody className="divide-y divide-white/5">
                            {dataList.map(u => (
                                <tr key={u.telegram_id} className="hover:bg-white/[0.02] transition">
                                    <td className="p-6"><div className="font-bold text-sm">{u.full_name}</div><div className="text-neutral-500">@{u.username}</div></td>
                                    <td className="p-6 font-mono text-blue-400">{u.balance} Ⓜ️</td>
                                    <td className="p-6"><button onClick={() => {const a = prompt('New Balance?'); if(a) handleAction('POST', `users/${u.telegram_id}/balance`, parseFloat(a))}} className="text-blue-500 font-bold hover:underline">MOD_BAL</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {view === 'broadcast' && (
                <div className="bg-neutral-900 p-10 rounded-[3rem] border border-white/10 max-w-2xl mx-auto space-y-8 shadow-2xl">
                    <h3 className="text-2xl font-black uppercase text-white tracking-tight italic">Global Neural Broadcast</h3>
                    <textarea className="w-full bg-black border border-white/10 rounded-[2rem] p-8 text-sm h-64 focus:border-blue-500 outline-none transition-all shadow-inner" placeholder="Enter transmission data..." onChange={e => setForm({msg: e.target.value})} />
                    <button onClick={() => handleAction('POST', 'broadcast', form.msg)} className="w-full bg-blue-600 py-6 rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-500 transition shadow-2xl shadow-blue-600/40">Initiate Blast</button>
                </div>
            )}

            {view === 'coupons' && (
                <div className="space-y-6">
                    <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/10 flex gap-4">
                        <input placeholder="CODE" className="bg-black p-4 rounded-2xl flex-1 text-xs font-bold" onChange={e => setForm({...form, code: e.target.value})} />
                        <input placeholder="VALUE" className="bg-black p-4 rounded-2xl w-24 text-xs font-bold" onChange={e => setForm({...form, val: e.target.value})} />
                        <button onClick={() => handleAction('POST', 'coupons', {code: form.code, value: parseFloat(form.val), discount_type: 'fixed'})} className="bg-blue-600 px-8 rounded-2xl font-black text-[10px] uppercase">Generate</button>
                    </div>
                    <div className="grid gap-3">
                        {dataList.map(c => (
                            <div key={c.id} className="p-6 bg-neutral-900 rounded-[2rem] border border-white/5 flex justify-between items-center">
                                <span className="font-black text-blue-500 tracking-widest">{c.code}</span>
                                <div className="flex items-center gap-6">
                                    <span className="text-xs font-bold text-neutral-400">{c.value} ₽ ({c.used_count}/{c.usage_limit})</span>
                                    <button onClick={() => handleAction('DELETE', `coupons/${c.id}`)} className="text-red-600 font-black text-[10px] uppercase hover:underline">Revoke</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
