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
            const data = await res.json();
            setDataList(Array.isArray(data) ? data : []);
        }
    };

    useEffect(() => { fetchData(); }, [view, token, apiUrl]);

    const handleAction = async (method: string, endpoint: string, body?: any) => {
        const fetchOptions: any = { method, headers };
        if (body) {
            fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
        }
        const res = await fetch(`${apiUrl}/admin/${endpoint}`, fetchOptions);
        if (res.ok) {
            fetchData();
        } else {
            const err = await res.json();
            alert(`Error: ${err.detail || 'Action failed'}`);
        }
    };

    if (!token) return <Navigate to="/login" />;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 md:space-y-16 animate-in fade-in duration-700 overflow-x-hidden">
            <div className="flex flex-col items-center gap-6 md:gap-10 text-center">
                <div className="text-4xl sm:text-5xl md:text-6xl font-black uppercase italic tracking-tighter text-white drop-shadow-[0_0_30px_rgba(59,130,246,0.2)] break-words">MEMBERSLY</div>
                <div className="w-full overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 flex justify-start lg:justify-center">
                    <div className="flex lg:flex-wrap bg-neutral-900 p-2 md:p-2.5 rounded-[2rem] md:rounded-[2.5rem] border border-white/10 shadow-2xl w-max lg:w-auto gap-2">
                        {['stats', 'channels', 'tariffs', 'broadcast', 'users', 'coupons', 'bots', 'settings'].map((v) => (
                            <button key={v} onClick={() => setView(v)} className={`px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-[1.5rem] md:rounded-[2rem] text-[9px] sm:text-[10px] md:text-xs font-black uppercase transition-all duration-300 whitespace-nowrap ${view === v ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/40 scale-105 z-10' : 'text-neutral-300 hover:text-white hover:bg-white/5'}`}>{t(`admin.${v}`)}</button>
                        ))}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />

            <div className="min-h-[60vh]">
                {view === 'stats' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-in slide-in-from-bottom-4 duration-500">
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
