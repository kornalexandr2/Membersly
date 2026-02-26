import { useState } from 'react';

export const ManageBroadcast = ({ onAction }: any) => {
    const [msg, setMsg] = useState('');
    return (
        <div className="bg-neutral-900 p-10 rounded-[3rem] border border-white/10 max-w-2xl mx-auto space-y-8 shadow-2xl animate-in zoom-in-95 duration-500">
            <h3 className="text-2xl font-black uppercase text-white tracking-tight italic text-center">Global Neural <span className="text-blue-600">Broadcast</span></h3>
            <textarea className="w-full bg-black border border-white/10 rounded-[2rem] p-8 text-sm h-64 focus:border-blue-500 outline-none transition-all shadow-inner text-neutral-300" placeholder="Enter transmission data for all synchronized entities..." value={msg} onChange={e => setMsg(e.target.value)} />
            <button onClick={() => { onAction('POST', 'broadcast', msg); setMsg(''); }} className="w-full bg-blue-600 py-6 rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-500 transition shadow-2xl shadow-blue-600/40 transform active:scale-95">Initiate Neural Blast</button>
        </div>
    );
};
