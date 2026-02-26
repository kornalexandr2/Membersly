import { useState } from 'react';

export const ManageSettings = ({ apiUrl, token }: { apiUrl: string, token: string }) => {
    const [form, setForm] = useState({ old_pass: '', new_pass: '', tg_id: '' });
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const updatePassword = async () => {
        const res = await fetch(`${apiUrl}/auth/change-password`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ old_password: form.old_pass, new_password: form.new_pass })
        });
        if (res.ok) { alert('Password Updated'); setForm({ ...form, old_pass: '', new_pass: '' }); }
        else alert('Error updating password');
    };

    const updateTgId = async () => {
        const res = await fetch(`${apiUrl}/admin/settings/tg-id`, {
            method: 'POST',
            headers,
            body: JSON.stringify(parseInt(form.tg_id))
        });
        if (res.ok) alert('Telegram ID Linked');
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
            <div className="bg-neutral-900 p-10 rounded-[3rem] border border-white/10 space-y-6 shadow-2xl">
                <h3 className="text-xl font-black uppercase text-white italic">Security</h3>
                <div className="space-y-3">
                    <input className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 text-sm" type="password" placeholder="OLD PASSCODE" value={form.old_pass} onChange={e => setForm({...form, old_pass: e.target.value})} />
                    <input className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 text-sm" type="password" placeholder="NEW PASSCODE" value={form.new_pass} onChange={e => setForm({...form, new_pass: e.target.value})} />
                </div>
                <button onClick={updatePassword} className="w-full bg-blue-600 py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all">Change Pass</button>
            </div>

            <div className="bg-neutral-900 p-10 rounded-[3rem] border border-white/10 space-y-6 shadow-2xl text-center">
                <h3 className="text-xl font-black uppercase text-white italic">Notifications</h3>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Connect your account to receive sales reports</p>
                <input className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 text-sm font-mono text-center" placeholder="YOUR TELEGRAM ID" value={form.tg_id} onChange={e => setForm({...form, tg_id: e.target.value})} />
                <button onClick={updateTgId} className="w-full bg-white text-black py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all">Link Telegram</button>
            </div>
        </div>
    );
};
