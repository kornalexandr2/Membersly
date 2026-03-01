import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const ManageChannels = ({ data, onAction }: any) => {
    const { t } = useTranslation();
    const [form, setForm] = useState<any>({ type: 'channel', pin_welcome: false });
    const [editing, setEditing] = useState<number | null>(null);

    const submit = (e: any) => {
        e.preventDefault();
        const payload = {
            chat_id: parseInt(form.chat_id),
            title: form.title,
            type: form.type,
            welcome_text: form.welcome_text,
            pin_welcome: form.pin_welcome
        };
        
        if (editing) {
            onAction('PATCH', `channels/${editing}`, { title: form.title, welcome_text: form.welcome_text, pin_welcome: form.pin_welcome });
        } else {
            onAction('POST', `channels`, payload);
        }
        
        setForm({ type: 'channel', pin_welcome: false, chat_id: '', title: '', welcome_text: '' });
        setEditing(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <form onSubmit={submit} className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/10 space-y-4 shadow-xl">
                <h3 className="text-sm font-black uppercase text-blue-500 tracking-[0.2em] italic">{editing ? t('admin.channels_edit_title') : t('admin.channels_new_title')}</h3>
                <div className="flex flex-wrap gap-4">
                    <input disabled={!!editing} placeholder={t('admin.channels_chat_id')} className="bg-black p-4 rounded-2xl flex-1 min-w-full md:min-w-[200px] text-xs font-bold border border-white/5 outline-none focus:border-blue-500" value={form.chat_id || ''} onChange={e => setForm({...form, chat_id: e.target.value})} />
                    <input placeholder={t('admin.channels_title')} className="bg-black p-4 rounded-2xl flex-1 min-w-full md:min-w-[200px] text-xs font-bold border border-white/5 outline-none focus:border-blue-500" value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} />
                    {!editing && (
                        <select className="bg-black p-4 rounded-2xl text-[10px] font-black flex-1 min-w-full md:min-w-[150px] uppercase border border-white/5 text-neutral-400" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                            <option value="channel">{t('admin.channels_type_channel')}</option>
                            <option value="supergroup">{t('admin.channels_type_group')}</option>
                        </select>
                    )}
                </div>
                <div className="space-y-2">
                    <textarea
                        className="w-full bg-black border border-white/5 rounded-2xl p-4 text-xs focus:border-blue-500 outline-none transition-all shadow-inner resize-none h-24"
                        placeholder={t('admin.channels_welcome_msg')}
                        value={form.welcome_text || ''}
                        onChange={e => setForm({...form, welcome_text: e.target.value})}
                    />
                    <div className="flex items-center gap-3 ml-2">
                        <button type="button" onClick={() => setForm({...form, pin_welcome: !form.pin_welcome})} className={`w-8 h-4 rounded-full transition-all relative ${form.pin_welcome ? 'bg-blue-600' : 'bg-neutral-800'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${form.pin_welcome ? 'left-4.5' : 'left-0.5'}`}></div>
                        </button>
                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{t('admin.channels_pin_welcome')}</span>
                    </div>
                </div>
                <button className="w-full bg-blue-600 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-500">{editing ? t('admin.channels_update_btn') : t('admin.channels_create_btn')}</button>  
            </form>
            <div className="grid gap-3">
                {data.map((c: any) => (
                    <div key={c.id} className="p-4 md:p-6 bg-neutral-900 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center group gap-4 md:gap-0">
                        <div className="w-full md:w-auto break-words">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="font-black text-sm uppercase tracking-tighter group-hover:text-blue-400 transition">{c.title}</div>
                                <span className="bg-white/10 px-2 py-0.5 rounded-md text-[8px] uppercase font-black text-neutral-400">{c.type}</span>
                            </div>
                            <div className="text-[10px] text-neutral-500 font-bold mt-1 break-all">ID: {c.telegram_chat_id}</div>
                            {c.welcome_text && <div className="text-[9px] text-green-500 font-bold uppercase mt-1">{t('admin.channels_welcome_active')} {c.pin_welcome && `(${t('admin.channels_pinned')})`}</div>}
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                            <button onClick={() => { setEditing(c.id); setForm(c); }} className="text-white/40 font-black text-[10px] uppercase hover:text-white transition">{t('admin.edit')}</button>
                            <button onClick={() => onAction('DELETE', `channels/${c.id}`)} className="text-red-600 font-black text-[10px] uppercase border border-red-600/10 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all">{t('admin.channels_unlink')}</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
