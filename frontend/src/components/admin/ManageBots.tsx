import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const ManageBots = ({ data, onAction }: any) => {
    const { t } = useTranslation();
    const [token, setToken] = useState('');
    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/10 flex gap-4 shadow-xl">
                <input placeholder="SECURE BOT TOKEN (from @BotFather)" className="bg-black p-4 rounded-2xl flex-1 text-xs font-bold border border-white/5 outline-none focus:border-blue-500 transition-all" value={token} onChange={e => setToken(e.target.value)} />
                <button onClick={() => { if(token) { onAction('POST', 'bots', {token, title: 'Bot'}); setToken(''); } }} className="bg-blue-600 px-8 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all">{t('admin.add_bot')}</button>
            </div>
            <div className="grid gap-3">
                {data.map((b: any) => (
                    <div key={b.id} className="p-6 bg-neutral-900 rounded-[2rem] border border-white/5 flex justify-between items-center hover:bg-white/[0.01] transition-all group">
                        <div className="truncate pr-8">
                            <span className="text-[10px] font-black text-neutral-600 block mb-1 uppercase tracking-widest italic">Signal Pulse Active</span>
                            <span className="text-xs font-mono text-neutral-400 group-hover:text-blue-400 transition-colors">{b.token.substring(0, 40)}...</span>
                        </div>
                        <button onClick={() => onAction('DELETE', `bots/${b.id}`)} className="text-red-600 font-black text-[10px] uppercase border border-red-600/10 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all">{t('admin.delete')}</button>
                    </div>
                ))}
            </div>
        </div>
    );
};
