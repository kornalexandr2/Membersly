import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const ManageCoupons = ({ data, onAction }: any) => {
    const { t } = useTranslation();
    const [form, setForm] = useState<any>({});
    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/10 flex flex-wrap gap-4 shadow-xl">
                <input placeholder={t('admin.coupons_code')} className="bg-black p-4 rounded-2xl flex-1 min-w-[150px] text-xs font-bold border border-white/5 outline-none focus:border-blue-500" onChange={e => setForm({...form, code: e.target.value})} />
                <input placeholder={t('admin.coupons_value')} className="bg-black p-4 rounded-2xl w-24 text-xs font-bold border border-white/5 outline-none focus:border-blue-500" onChange={e => setForm({...form, val: e.target.value})} />
                <button onClick={() => onAction('POST', 'coupons', {code: form.code, value: parseFloat(form.val), discount_type: 'fixed', usage_limit: 100})} className="bg-blue-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-500">{t('admin.coupons_generate')}</button>
            </div>
            <div className="grid gap-3">
                {data.map((c: any) => (
                    <div key={c.id} className="p-6 bg-neutral-900 rounded-[2rem] border border-white/5 flex justify-between items-center group">
                        <div><div className="font-black text-blue-500 tracking-widest uppercase">{c.code}</div><div className="text-[10px] text-neutral-500 font-bold uppercase mt-1">{c.value} {t('admin.currency_rub')} • {t('admin.coupons_used')}: {c.used_count}/{c.usage_limit}</div></div>
                        <button onClick={() => onAction('DELETE', `coupons/${c.id}`)} className="text-red-600 font-black text-[10px] uppercase border border-red-600/10 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all">{t('admin.delete')}</button>
                    </div>
                ))}
            </div>
        </div>
    );
};
