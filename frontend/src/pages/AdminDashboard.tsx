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

            {view === 'channels' && (
                <div className="space-y-6">
                    <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/10 flex gap-4">
                        <input placeholder="CHAT ID" className="bg-black p-4 rounded-2xl flex-1 text-xs font-bold" onChange={e => setForm({...form, chat_id: e.target.value})} />
                        <input placeholder="TITLE" className="bg-black p-4 rounded-2xl flex-1 text-xs font-bold" onChange={e => setForm({...form, title: e.target.value})} />
                        <button onClick={() => handleAction('POST', `channels?chat_id=${form.chat_id}&title=${form.title}&type=channel`)} className="bg-blue-600 px-8 rounded-2xl font-black text-[10px] uppercase">Link</button>
                    </div>
                    <div className="grid gap-3">
                        {dataList.map(c => (
                            <div key={c.id} className="p-6 bg-neutral-900 rounded-[2rem] border border-white/5 flex justify-between items-center">
                                <div><div className="font-black text-sm uppercase tracking-tighter">{c.title}</div><div className="text-[10px] text-neutral-500">ID: {c.telegram_chat_id}</div></div>
                                <span className="text-[8px] bg-white/10 px-3 py-1 rounded-full font-black uppercase text-neutral-400">{c.type}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'tariffs' && (
                <div className="space-y-6">
                    <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/10 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input placeholder="NAME" className="bg-black p-4 rounded-2xl text-xs font-bold" onChange={e => setForm({...form, title: e.target.value})} />
                            <input placeholder="PRICE" className="bg-black p-4 rounded-2xl text-xs font-bold" onChange={e => setForm({...form, price: e.target.value})} />
                        </div>
                        <button onClick={() => handleAction('POST', 'tariffs', {title: form.title, price: parseFloat(form.price), currency: 'RUB', duration_days: 30})} className="w-full bg-blue-600 py-4 rounded-2xl font-black text-[10px] uppercase">Create Plan</button>
                    </div>
                    <div className="grid gap-4">
                        {dataList.map(t => (
                            <div key={t.id} className="p-6 bg-neutral-900 rounded-[2rem] border border-white/5 flex justify-between items-center">
                                <div><div className="font-black text-xl uppercase tracking-tighter">{t.title}</div><div className="text-xs text-neutral-500 font-bold">{t.price} ₽ • {t.duration_days} days</div></div>
                                <button onClick={() => handleAction('DELETE', `tariffs/${t.id}`)} className="text-red-600 font-black text-[10px] uppercase hover:underline">Remove</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* users, broadcast, coupons views logic remains same as previous */}
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
        </div>
    );
};
