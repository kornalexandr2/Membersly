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
        } else if (view === 'settings') {
            // No list to fetch
        } else {
            const res = await fetch(`${apiUrl}/admin/${view}`, { headers });
            setDataList(Array.isArray(await res.json()) ? await res.json() : []);
        }
    };

    useEffect(() => { fetchData(); }, [view, token]);

    const handleAction = async (method: string, endpoint: string, body?: any) => {
        const res = await fetch(`${apiUrl}/admin/${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
        if (res.ok) fetchData();
    };

    if (!token) return <Navigate to="/login" />;

    const filteredList = dataList.filter(item => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        if (view === 'users') return item.full_name?.toLowerCase().includes(search) || item.username?.toLowerCase().includes(search) || item.telegram_id.toString().includes(search);
        if (view === 'coupons') return item.code.toLowerCase().includes(search);
        if (view === 'channels' || view === 'tariffs') return item.title.toLowerCase().includes(search);
        return true;
    });

    return (
        <div className="p-4 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-3xl font-black uppercase italic tracking-tighter text-white">Membersly <span className="text-blue-600">.OS</span></div>
                <div className="flex bg-neutral-900 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
                    {['stats', 'bots', 'channels', 'tariffs', 'broadcast', 'users', 'coupons', 'settings'].map((v) => (
                        <button key={v} onClick={() => setView(v)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${view === v ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-neutral-500 hover:text-white'}`}>{v}</button>
                    ))}
                </div>
            </div>

            {view === 'settings' && (
                <div className="max-w-md mx-auto bg-neutral-900 p-10 rounded-[3rem] border border-white/10 space-y-6 shadow-2xl">
                    <h3 className="text-xl font-black uppercase tracking-widest text-center italic">Admin Security</h3>
                    <div className="space-y-3">
                        <input className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 text-sm" type="password" placeholder="OLD PASSCODE" onChange={e => setForm({...form, old_pass: e.target.value})} />
                        <input className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 text-sm" type="password" placeholder="NEW PASSCODE" onChange={e => setForm({...form, new_pass: e.target.value})} />
                    </div>
                    <button onClick={() => {
                        fetch(`${apiUrl}/auth/change-password`, { method: 'POST', headers, body: JSON.stringify({ old_password: form.old_pass, new_password: form.new_pass }) })
                        .then(r => r.ok ? alert('Success') : alert('Error'));
                    }} className="w-full bg-blue-600 py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all">Update Credentials</button>
                </div>
            )}

            {/* Other views (stats, users, coupons, broadcast, bots, channels, tariffs) use the handleAction / filteredList logic from before... */}
            {view === 'stats' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Active Base" value={stats.active_subscriptions} />
                    <StatCard label="Total Cash" value={`${stats.total_revenue} ₽`} color="text-green-500" />
                    <StatCard label="30D Velocity" value={`${stats.monthly_revenue} ₽`} color="text-blue-400" />
                    <StatCard label="New Pulse" value={stats.new_users_today} />
                </div>
            )}
            {/* Implement remaining views with Edit/Update buttons */}
        </div>
    );
};
