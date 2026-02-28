import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const ManageTariffs = ({ data, channels, onAction }: any) => {
    const { t } = useTranslation();
    const [form, setForm] = useState<any>({ access_level: 'full_access', selectedChannels: [], currency: 'RUB' });
    const [editing, setEditing] = useState<number | null>(null);

    const submit = (e: any) => {
        e.preventDefault();
        const body = { 
            ...form, 
            price: parseFloat(form.price), 
            duration_days: parseInt(form.duration_days || 30), 
            channel_ids: form.selectedChannels,
            currency: form.currency || 'RUB' // Default to RUB if not specified
        };
        if (editing) onAction('PATCH', `tariffs/${editing}`, body);
        else onAction('POST', 'tariffs', body);
        setForm({ access_level: 'full_access', selectedChannels: [], currency: 'RUB' });
        setEditing(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-4">
            <form onSubmit={submit} className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/10 space-y-6 shadow-2xl">
                <h3 className="text-sm font-black uppercase text-blue-500 tracking-[0.2em] italic">{editing ? t('admin.tariffs_edit_title') : t('admin.tariffs_new_title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input placeholder={t('admin.tariffs_name')} className="bg-black p-4 rounded-2xl text-xs font-bold border border-white/5" value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} required />
                    <input placeholder={t('admin.tariffs_price')} type="number" className="bg-black p-4 rounded-2xl text-xs font-bold border border-white/5" value={form.price || ''} onChange={e => setForm({...form, price: e.target.value})} required />
                    <input placeholder={t('admin.tariffs_currency')} className="bg-black p-4 rounded-2xl text-xs font-bold border border-white/5" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} />
                    <input placeholder={t('admin.tariffs_duration')} type="number" className="bg-black p-4 rounded-2xl text-xs font-bold border border-white/5" value={form.duration_days || ''} onChange={e => setForm({...form, duration_days: e.target.value})} />
                </div>
                <div className="flex flex-wrap gap-2">
                    {channels.map((c: any) => (
                        <button key={c.id} type="button" onClick={() => setForm((prev: any) => ({ ...prev, selectedChannels: prev.selectedChannels.includes(c.id) ? prev.selectedChannels.filter((i: any) => i !== c.id) : [...prev.selectedChannels, c.id] }))} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${form.selectedChannels.includes(c.id) ? 'bg-blue-600 border-blue-500' : 'bg-black border-white/5 text-neutral-600'}`}>{c.title}</button>
                    ))}
                </div>
                <button className="w-full bg-blue-600 py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-500 transition shadow-xl">{editing ? t('admin.tariffs_update_btn') : t('admin.tariffs_create_btn')}</button>
            </form>

            <div className="grid gap-4">
                {data.map((t_item: any) => (
                    <div key={t_item.id} className="p-6 bg-neutral-900 rounded-[2rem] border border-white/5 flex justify-between items-center group">
                        <div className="space-y-1">
                            <div className="font-black text-xl uppercase tracking-tighter text-white group-hover:text-blue-400 transition">{t_item.title}</div>
                            <div className="text-[10px] text-neutral-500 font-bold uppercase">{t_item.price} {t_item.currency} • {t_item.duration_days} {t('admin.days')}</div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => { setEditing(t_item.id); setForm({ ...t_item, selectedChannels: t_item.channels?.map((c: any) => c.id) || [] }); }} className="text-white/40 font-black text-[10px] uppercase hover:text-white transition">{t('admin.edit')}</button>
                            <button onClick={() => onAction('DELETE', `tariffs/${t_item.id}`)} className="text-red-600/40 font-black text-[10px] uppercase hover:text-red-500 transition">{t('admin.delete')}</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
