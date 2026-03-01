import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const ManageCoupons = ({ data, onAction }: any) => {
    const { t } = useTranslation();
    const [form, setForm] = useState<any>({ discount_type: 'fixed', usage_limit: 100 });
    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row gap-4 shadow-xl flex-wrap items-end">
                <div className="flex-1 w-full md:w-auto">
                    <label className="text-[10px] font-black uppercase text-neutral-500 ml-4 mb-1 block tracking-widest">{t('admin.coupons_code')}</label>
                    <input placeholder="SUMMER2026" className="w-full bg-black p-4 rounded-2xl text-xs font-bold border border-white/5 outline-none focus:border-blue-500 uppercase" value={form.code || ''} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} />
                </div>
                <div className="flex-1 w-full md:w-auto min-w-[120px]">
                    <label className="text-[10px] font-black uppercase text-neutral-500 ml-4 mb-1 block tracking-widest">{t('admin.coupons_type', 'Type')}</label>
                    <select className="w-full bg-black p-4 rounded-2xl text-xs font-black uppercase border border-white/5 text-white" value={form.discount_type} onChange={e => setForm({...form, discount_type: e.target.value})}>
                        <option value="fixed">{t('admin.currency_rub', 'RUB')}</option>
                        <option value="percent">%</option>
                    </select>
                </div>
                <div className="flex-1 w-full md:w-auto min-w-[120px]">
                    <label className="text-[10px] font-black uppercase text-neutral-500 ml-4 mb-1 block tracking-widest">{t('admin.coupons_value')}</label>
                    <input type="number" placeholder="500" className="w-full bg-black p-4 rounded-2xl text-xs font-bold border border-white/5 outline-none focus:border-blue-500" value={form.val || ''} onChange={e => setForm({...form, val: e.target.value})} />
                </div>
                <div className="flex-1 w-full md:w-auto min-w-[120px]">
                    <label className="text-[10px] font-black uppercase text-neutral-500 ml-4 mb-1 block tracking-widest">{t('admin.coupons_limit', 'Usage limit')}</label>
                    <input type="number" placeholder="100" className="w-full bg-black p-4 rounded-2xl text-xs font-bold border border-white/5 outline-none focus:border-blue-500" value={form.usage_limit || ''} onChange={e => setForm({...form, usage_limit: parseInt(e.target.value)})} />
                </div>
                <div className="flex-1 w-full md:w-auto min-w-[140px]">
                    <label className="text-[10px] font-black uppercase text-neutral-500 ml-4 mb-1 block tracking-widest">{t('admin.coupons_duration', 'Valid (Days)')}</label>
                    <input type="number" placeholder="30 (empty = forever)" className="w-full bg-black p-4 rounded-2xl text-xs font-bold border border-white/5 outline-none focus:border-blue-500" value={form.valid_until_days || ''} onChange={e => setForm({...form, valid_until_days: e.target.value ? parseInt(e.target.value) : null})} />
                </div>
                
                <button onClick={() => {
                    if (form.code && form.val !== undefined && form.val !== '') {
                        onAction('POST', 'coupons', {code: form.code, value: parseFloat(form.val), discount_type: form.discount_type, usage_limit: form.usage_limit, valid_until_days: form.valid_until_days || null});
                        setForm({ discount_type: 'fixed', usage_limit: 100, code: '', val: '', valid_until_days: '' });
                    }
                }} className="w-full md:w-auto bg-blue-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-500">{t('admin.coupons_generate')}</button>
            </div>
            <div className="grid gap-3">
                {data.map((c: any) => (
                    <div key={c.id} className="p-6 bg-neutral-900 rounded-[2rem] border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center group gap-4 md:gap-0">
                        <div>
                            <div className="font-black text-blue-500 tracking-widest uppercase text-xl flex items-center gap-3">
                                {c.code}
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase ${c.discount_type === 'percent' ? 'bg-purple-500/10 text-purple-400' : 'bg-green-500/10 text-green-400'}`}>
                                    {c.value} {c.discount_type === 'percent' ? '%' : t('admin.currency_rub')}
                                </span>
                            </div>
                            <div className="text-[10px] text-neutral-500 font-bold uppercase mt-2">
                                {t('admin.coupons_used')}: {c.used_count} / {c.usage_limit} 
                                {c.valid_until ? ` • Expires: ${new Date(c.valid_until).toLocaleDateString()}` : ' • Never expires'}
                            </div>
                        </div>
                        <button onClick={() => onAction('DELETE', `coupons/${c.id}`)} className="w-full md:w-auto text-red-600 font-black text-[10px] uppercase border border-red-600/10 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all">{t('admin.delete')}</button>
                    </div>
                ))}
            </div>
        </div>
    );
};
