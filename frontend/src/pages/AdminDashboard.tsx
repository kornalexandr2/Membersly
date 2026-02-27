import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StatCard } from '../components/StatCard';
import { ManageTariffs } from '../components/admin/ManageTariffs';
import { ManageUsers } from '../components/admin/ManageUsers';
import { ManageBots } from '../components/admin/ManageBots';
import { ManageChannels } from '../components/admin/ManageChannels';
import { ManageBroadcast } from '../components/admin/ManageBroadcast';
import { ManageCoupons } from '../components/admin/ManageCoupons';
import { ManageSettings } from '../components/admin/ManageSettings';

export const AdminDashboard = ({ token, apiUrl }: { token: string, apiUrl: string }) => {
    const { t } = useTranslation();
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
        } else if (view === 'settings') {
            // Static view
        } else {
            const res = await fetch(`${apiUrl}/admin/${view}`, { headers });
            setDataList(Array.isArray(await res.json()) ? await res.json() : []);
        }
    };

    useEffect(() => { fetchData(); }, [view, token, apiUrl]);

    const handleAction = async (method: string, endpoint: string, body?: any) => {
        const fetchOptions: any = { method, headers };
        if (body) {
            // Если body уже строка (как было для broadcast), оставляем как есть, 
            // но лучше всегда передавать объект для консистентности.
            fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
        }
        const res = await fetch(`${apiUrl}/admin/${endpoint}`, fetchOptions);
        if (res.ok) fetchData();
    };

    if (!token) return <Navigate to="/login" />;

    return (
        <div className="p-4 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-4xl font-black uppercase italic tracking-tighter text-white">Membersly <span className="text-blue-600">.OS</span></div>
                <div className="flex bg-neutral-900 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar shadow-2xl">
                    {['stats', 'channels', 'tariffs', 'broadcast', 'users', 'coupons', 'bots', 'settings'].map((v) => (
                        <button key={v} onClick={() => setView(v)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${view === v ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-neutral-500 hover:text-white'}`}>{t(`admin.${v}`)}</button>
                    ))}
                </div>
            </div>

            <div className="min-h-[60vh]">
                {view === 'stats' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                        <StatCard label={t('admin.stats_nodes')} value={stats.active_subscriptions} />
                        <StatCard label={t('admin.stats_capital')} value={`${stats.total_revenue} ₽`} color="text-green-500" />
                        <StatCard label={t('admin.stats_momentum')} value={`${stats.monthly_revenue} ₽`} color="text-blue-400" />
                        <StatCard label={t('admin.stats_growth')} value={stats.new_users_today} />
                    </div>
                )}

                {view === 'channels' && <ManageChannels data={dataList} onAction={handleAction} />}
                {view === 'tariffs' && <ManageTariffs data={dataList} channels={channels} onAction={handleAction} />}
                {view === 'broadcast' && <ManageBroadcast onAction={handleAction} />}
                {view === 'users' && <ManageUsers data={dataList} onAction={handleAction} />}
                {view === 'coupons' && <ManageCoupons data={dataList} onAction={handleAction} />}
                {view === 'bots' && <ManageBots data={dataList} onAction={handleAction} />}
                {view === 'settings' && <ManageSettings apiUrl={apiUrl} token={token} />}
            </div>
        </div>
    );
};
