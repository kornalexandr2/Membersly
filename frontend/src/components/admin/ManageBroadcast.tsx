import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const ManageBroadcast = ({ onAction }: any) => {
    const { t } = useTranslation();
    const [msg, setMsg] = useState('');
    const [segment, setSegment] = useState('all');
    const [status, setStatus] = useState('');

    const send = async () => {
        if (!msg) return;
        setStatus(t('admin.broadcast_initiating'));
        await onAction('POST', 'broadcast', { text: msg, segment });
        setMsg('');
        setStatus(t('admin.broadcast_complete'));
    };

    return (
        <div className="bg-neutral-900 p-10 rounded-[3rem] border border-white/10 max-w-2xl mx-auto space-y-8 shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="text-center space-y-2">
                <h3 className="text-2xl font-black uppercase text-white tracking-tight italic">{t('admin.broadcast_title')} <span className="text-blue-600">{t('admin.broadcast_title_span')}</span></h3>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">{t('admin.broadcast_subtitle')}</p>
            </div>

            <div className="flex gap-2 p-1.5 bg-black rounded-2xl border border-white/5">
                {['all', 'active', 'expired'].map(s => (
                    <button key={s} onClick={() => setSegment(s)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${segment === s ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-600 hover:text-neutral-400'}`}>
                        {t(`admin.broadcast_${s}`)}
                    </button>
                ))}
            </div>

            <textarea 
                className="w-full bg-black border border-white/10 rounded-[2rem] p-8 text-sm h-64 focus:border-blue-500 outline-none transition-all shadow-inner text-neutral-300 resize-none" 
                placeholder={t('admin.broadcast_placeholder')} 
                value={msg} 
                onChange={e => setMsg(e.target.value)} 
            />

            <div className="space-y-4">
                <button onClick={send} className="w-full bg-blue-600 py-6 rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-500 transition shadow-2xl shadow-blue-600/40 transform active:scale-95">
                    {t('admin.broadcast_execute')}
                </button>
                {status && <p className="text-center text-[10px] font-black uppercase text-blue-500/50 tracking-widest animate-pulse">{status}</p>}
            </div>
        </div>
    );
};
