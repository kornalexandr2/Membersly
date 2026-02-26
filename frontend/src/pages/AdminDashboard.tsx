import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { StatCard } from '../components/StatCard';

export const AdminDashboard = ({ token, apiUrl }: { token: string, apiUrl: string }) => {
    const [view, setView] = useState('stats');
    const [stats, setStats] = useState<any>({ active_subscriptions: 0, total_revenue: 0, new_users_today: 0, monthly_revenue: 0 });
    const [bots, setBots] = useState<any[]>([]);
    const [broadcastMsg, setBroadcastMsg] = useState('');

    useEffect(() => {
        if (!token) return;
        if (view === 'stats') fetch(`${apiUrl}/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` }}).then(res => res.json()).then(data => setStats(data));
        if (view === 'bots') fetch(`${apiUrl}/admin/bots`, { headers: { 'Authorization': `Bearer ${token}` }}).then(res => res.json()).then(data => setBots(Array.isArray(data) ? data : []));
    }, [view, token, apiUrl]);

    if (!token) return <Navigate to="/login" />;

    const sendBroadcast = () => {
        fetch(`${apiUrl}/admin/broadcast`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(broadcastMsg)
        }).then(() => { alert('Broadcast Sent!'); setBroadcastMsg(''); });
    };

    return (
        <div className="p-4 max-w-6xl mx-auto space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-3xl font-black uppercase italic tracking-tighter">Membersly <span className="text-blue-600">.OS</span></div>
                <div className="flex bg-neutral-900 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
                    {['stats', 'bots', 'channels', 'tariffs', 'broadcast', 'users'].map((v) => (
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

            {view === 'broadcast' && (
                <div className="bg-neutral-900 p-10 rounded-[3rem] border border-white/10 max-w-2xl mx-auto space-y-8 shadow-2xl">
                    <h3 className="text-2xl font-black uppercase text-white tracking-tight italic">Global Neural Broadcast</h3>
                    <textarea className="w-full bg-black border border-white/10 rounded-[2rem] p-8 text-sm h-64 focus:border-blue-500 outline-none transition-all shadow-inner" placeholder="Enter transmission data..." value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} />
                    <button onClick={sendBroadcast} className="w-full bg-blue-600 py-6 rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-500 transition shadow-2xl shadow-blue-600/40">Initiate Blast</button>
                </div>
            )}

            {view === 'bots' && (
                <div className="grid gap-4 max-w-3xl mx-auto">
                    {bots.map(b => (
                        <div key={b.id} className="p-6 bg-neutral-900 rounded-[2rem] border border-white/5 flex justify-between items-center hover:border-blue-500/30 transition-all">
                            <div className="truncate pr-8"><span className="text-[10px] font-bold text-neutral-600 block mb-1">ENCRYPTED TOKEN</span><span className="text-xs font-mono text-neutral-400">{b.token.substring(0, 30)}...</span></div>
                            <span className={`w-3 h-3 rounded-full ${b.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
