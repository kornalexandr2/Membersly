import { useState } from 'react';

export const ManageUsers = ({ data, onAction }: any) => {
    const [search, setSearch] = useState('');
    const filtered = data.filter((u: any) => u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.telegram_id.toString().includes(search));

    return (
        <div className="space-y-6 animate-in fade-in">
            <input className="w-full bg-neutral-900 border border-white/5 rounded-3xl px-8 py-5 text-sm font-bold tracking-widest focus:border-blue-500 outline-none transition-all shadow-inner" placeholder="IDENTIFY USER (NAME / ID)..." value={search} onChange={e => setSearch(e.target.value)} />
            <div className="bg-neutral-900 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-neutral-500 uppercase font-black tracking-widest"><tr className="border-b border-white/5"><th className="p-6">Entity</th><th className="p-6">Capital (Ⓜ️)</th><th className="p-6">Operation</th></tr></thead>
                    <tbody className="divide-y divide-white/5">
                        {filtered.map((u: any) => (
                            <tr key={u.telegram_id} className="hover:bg-white/[0.02] transition">
                                <td className="p-6"><div className="font-bold text-sm text-white uppercase">{u.full_name}</div><div className="text-neutral-500 text-[10px]">@{u.username} • {u.telegram_id}</div></td>
                                <td className="p-6 font-mono text-blue-400 text-lg">{u.balance} Ⓜ️</td>
                                <td className="p-6"><button onClick={() => { const a = prompt('MOD_AMOUNT'); if(a) onAction('POST', `users/${u.telegram_id}/balance`, parseFloat(a)); }} className="bg-white/5 hover:bg-blue-600 px-4 py-2 rounded-xl font-black uppercase text-[10px] transition-all">MOD_BAL</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
