import { useState } from 'react';

export const ManageChannels = ({ data, onAction }: any) => {
    const [form, setForm] = useState<any>({});
    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/10 flex flex-wrap gap-4 shadow-xl">
                <input placeholder="TELEGRAM CHAT ID" className="bg-black p-4 rounded-2xl flex-1 min-w-[200px] text-xs font-bold border border-white/5 outline-none focus:border-blue-500" onChange={e => setForm({...form, chat_id: e.target.value})} />
                <input placeholder="TITLE" className="bg-black p-4 rounded-2xl flex-1 min-w-[200px] text-xs font-bold border border-white/5 outline-none focus:border-blue-500" onChange={e => setForm({...form, title: e.target.value})} />
                <button onClick={() => onAction('POST', `channels?chat_id=${form.chat_id}&title=${form.title}&type=channel`)} className="bg-blue-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-500">Link Matrix</button>
            </div>
            <div className="grid gap-3">
                {data.map((c: any) => (
                    <div key={c.id} className="p-6 bg-neutral-900 rounded-[2rem] border border-white/5 flex justify-between items-center group">
                        <div><div className="font-black text-sm uppercase tracking-tighter group-hover:text-blue-400 transition">{c.title}</div><div className="text-[10px] text-neutral-500 font-bold mt-1">UUID: {c.telegram_chat_id}</div></div>
                        <button onClick={() => onAction('DELETE', `channels/${c.id}`)} className="text-red-600 font-black text-[10px] uppercase border border-red-600/10 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all">Unlink</button>
                    </div>
                ))}
            </div>
        </div>
    );
};
