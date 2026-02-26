import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { StatCard } from '../components/StatCard';
import { ManageTariffs } from '../components/admin/ManageTariffs';
import { ManageUsers } from '../components/admin/ManageUsers';
import { ManageBots } from '../components/admin/ManageBots';
import { ManageChannels } from '../components/admin/ManageChannels';
import { ManageBroadcast } from '../components/admin/ManageBroadcast';
import { ManageCoupons } from '../components/admin/ManageCoupons';

export const AdminDashboard = ({ token, apiUrl }: { token: string, apiUrl: string }) => {
    const [view, setView] = useState('stats');
    const [stats, setStats] = useState<any>({ active_subscriptions: 0, total_revenue: 0, new_users_today: 0, monthly_revenue: 0 });
    const [dataList, setDataList] = useState<any[]>([]);
    const [channels, setChannels] = useState<any[]>([]);

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const fetchData = async () => {
        if (!token) return;
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
            setDataList(Array.isArray(await res.json()) ? await res.json() : []);
        }
    };

    useEffect(() => { fetchData(); }, [view, token, apiUrl]);

    const handleAction = async (method: string, endpoint: string, body?: any) => {
        const res = await fetch(`${apiUrl}/admin/${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
        if (res.ok) fetchData();
    };

    if (!token) return <Navigate to="/login" />;

    return (
        <div className="p-4 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-4xl font-black uppercase italic tracking-tighter text-white">Membersly <span className="text-blue-600">.OS</span></div>
                <div className="flex bg-neutral-900 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar shadow-2xl">
                    {['stats', 'channels', 'tariffs', 'broadcast', 'users', 'coupons', 'bots'].map((v) => (
                        <button key={v} onClick={() => setView(v)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${view === v ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-neutral-500 hover:text-white'}`}>{v}</button>
                    ))}
                </div>
            </div>

            <div className="min-h-[60vh]">
                {view === 'stats' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                        <StatCard label="Total Nodes" value={stats.active_subscriptions} />
                        <StatCard label="Total Capital" value={`${stats.total_revenue} ₽`} color="text-green-500" />
                        <StatCard label="30D Momentum" value={`${stats.monthly_revenue} ₽`} color="text-blue-400" />
                        <StatCard label="System Growth" value={stats.new_users_today} />
                    </div>
                )}

                {view === 'channels' && <ManageChannels data={dataList} onAction={handleAction} />}
                {view === 'tariffs' && <ManageTariffs data={dataList} channels={channels} onAction={handleAction} />}
                {view === 'broadcast' && <ManageBroadcast onAction={handleAction} />}
                {view === 'users' && <ManageUsers data={dataList} onAction={handleAction} />}
                {view === 'coupons' && <ManageCoupons data={dataList} onAction={handleAction} />}
                {view === 'bots' && <ManageBots data={dataList} onAction={handleAction} />}
            </div>
        </div>
    );
};
