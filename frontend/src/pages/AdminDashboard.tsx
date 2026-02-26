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
        const res = await fetch(`${apiUrl}/admin/${view}`, { headers });
        if (view === 'stats') setStats(await res.json());
        else setDataList(Array.isArray(await res.json()) ? await res.json() : []);
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
                <div className="text-3xl font-black uppercase text-blue-500 italic">Membersly</div>
                <div className="flex bg-neutral-900 p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
                    {['stats', 'users', 'subscriptions', 'payments', 'tariffs', 'broadcast'].map((v) => (
                        <button key={v} onClick={() => setView(v)} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition ${view === v ? 'bg-blue-600 text-white' : 'text-neutral-500'}`}>{v}</button>
                    ))}
                </div>
            </div>

            {view === 'subscriptions' && (
                <div className="bg-neutral-900 rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 text-neutral-500 uppercase font-black"><tr className="border-b border-white/5"><th className="p-6">User ID</th><th className="p-6">Expires</th><th className="p-6">Status</th><th className="p-6">Control</th></tr></thead>
                        <tbody className="divide-y divide-white/5">
                            {dataList.map(s => (
                                <tr key={s.id} className="hover:bg-white/[0.02] transition">
                                    <td className="p-6 font-mono">{s.user_id}</td>
                                    <td className="p-6 font-bold">{new Date(s.end_date).toLocaleDateString()}</td>
                                    <td className="p-6">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${s.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{s.is_active ? 'Active' : 'Expired'}</span>
                                    </td>
                                    <td className="p-6">
                                        {s.is_active && <button onClick={() => handleAction('DELETE', `subscriptions/${s.id}`)} className="text-red-500 font-bold uppercase text-[10px] hover:underline">Revoke Access</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* stats, users, payments, tariffs, broadcast logic remains consistent... */}
        </div>
    );
};
