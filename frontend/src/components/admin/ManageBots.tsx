import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const ManageBots = ({ data, onAction }: any) => {
    const { t } = useTranslation();
    const [token, setToken] = useState('');
    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row gap-4 shadow-xl">
                <input placeholder={t('admin.bots_token_placeholder')} className="bg-black p-4 rounded-2xl flex-1 text-xs font-bold border border-white/5 outline-none focus:border-blue-500 transition-all" value={token} onChange={e => setToken(e.target.value)} />
                <button onClick={() => { if(token) { onAction('POST', 'bots', {token, title: 'Bot'}); setToken(''); } }} className="bg-blue-600 px-8 py-4 md:py-0 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all">{t('admin.add_bot')}</button>
            </div>
            <div className="grid gap-3">
                {data.length === 0 && (
                    <div className="text-center p-12 bg-neutral-900/50 rounded-[2rem] border border-white/5 text-neutral-600 font-black uppercase text-[10px] tracking-widest italic animate-pulse">
                        {t('admin.bots_empty')}
                    </div>
                )}
                {data.map((b: any) => (
                    <div key={b.id} className="p-4 md:p-6 bg-neutral-900 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-white/[0.01] transition-all group gap-4 md:gap-0">
                        <div className="w-full md:w-auto md:pr-8">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest italic">{t('admin.bots_active_signal', 'ACTIVE')}</span>
                                <span className="text-xs font-black uppercase text-white tracking-tighter">{b.title}</span>
                            </div>
                            <span className="text-[10px] md:text-xs font-mono text-neutral-500 group-hover:text-neutral-400 transition-colors break-all block">{b.token}</span>
                        </div>
                        <button onClick={() => onAction('DELETE', `bots/${b.id}`)} className="w-full md:w-auto text-red-600 font-black text-[10px] uppercase border border-red-600/10 px-4 py-2 md:py-3 rounded-xl hover:bg-red-600 hover:text-white transition-all">{t('admin.delete')}</button>
                    </div>
                ))}
            </div>
        </div>
    );
};
