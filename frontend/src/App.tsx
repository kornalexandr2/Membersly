import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

const API_URL = window.location.origin.includes('localhost:5173') ? 'http://localhost:8000' : '/api';

const ManageBots = ({ token }: { token: string }) => {
    const [bots, setBots] = useState<any[]>([]);
    const [tok, setTok] = useState('');
    const fetchBots = () => fetch(`${API_URL}/admin/bots`, { headers: { 'Authorization': `Bearer ${token}` }}).then(res => res.json()).then(data => setBots(Array.isArray(data) ? data : []));
    useEffect(() => fetchBots(), [token]);

    const addBot = (e: any) => {
        e.preventDefault();
        fetch(`${API_URL}/admin/bots`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: tok, title: 'Bot' })
        }).then(() => { setTok(''); fetchBots(); });
    };

    const deleteBot = (id: number) => {
        fetch(`${API_URL}/admin/bots/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }}).then(() => fetchBots());
    };

    return (
        <div className="space-y-6">
            <form onSubmit={addBot} className="bg-neutral-900 p-6 rounded-3xl border border-white/10 flex gap-2">
                <input className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-sm outline-none" placeholder="New Bot Token" value={tok} onChange={e => setTok(e.target.value)} />
                <button className="bg-blue-600 px-6 py-2 rounded-xl font-bold uppercase text-[10px]">Add Bot</button>
            </form>
            <div className="grid gap-3">
                {bots.map(b => (
                    <div key={b.id} className="p-4 bg-neutral-900 rounded-2xl border border-white/5 flex justify-between items-center">
                        <div className="truncate max-w-[200px] text-xs font-mono text-neutral-500">{b.token}</div>
                        <button onClick={() => deleteBot(b.id)} className="text-red-500 font-bold uppercase text-[10px] hover:underline">Revoke</button>
                    </div>))}
            </div>
        </div>
    );
};

const ManageChannels = ({ token }: { token: string }) => {
    const [channels, setChannels] = useState<any[]>([]);
    const [form, setForm] = useState({ chat_id: '', title: '', type: 'channel' });
    const fetchChannels = () => fetch(`${API_URL}/admin/channels`, { headers: { 'Authorization': `Bearer ${token}` }}).then(res => res.json()).then(data => setChannels(Array.isArray(data) ? data : []));
    useEffect(() => fetchChannels(), [token]);

    const addChannel = (e: any) => {
        e.preventDefault();
        fetch(`${API_URL}/admin/channels?chat_id=${form.chat_id}&title=${form.title}&type=${form.type}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(() => { setForm({ chat_id: '', title: '', type: 'channel' }); fetchChannels(); });
    };

    return (
        <div className="space-y-6">
            <form onSubmit={addChannel} className="bg-neutral-900 p-6 rounded-3xl border border-white/10 grid grid-cols-2 gap-4">
                <input placeholder="Chat ID" className="bg-black p-3 rounded-xl text-sm" value={form.chat_id} onChange={e => setForm({...form, chat_id: e.target.value})} />
                <input placeholder="Title" className="bg-black p-3 rounded-xl text-sm" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                <button className="bg-blue-600 rounded-xl font-bold uppercase text-[10px] col-span-2 py-3">Link Resource</button>
            </form>
            <div className="grid gap-3">
                {channels.map(c => (
                    <div key={c.id} className="p-4 bg-neutral-900 rounded-2xl border border-white/5 flex justify-between items-center">
                        <div><div className="font-bold">{c.title}</div><div className="text-[10px] text-neutral-500 italic">ID: {c.telegram_chat_id}</div></div>
                        <span className="text-[8px] bg-white/10 px-2 py-1 rounded-full font-black uppercase">{c.type}</span>
                    </div>))}
            </div>
        </div>
    );
};

// App navigation & State remains same...
// Simplified rendering for brevity - keeping logic structure
function App() {
    const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
    return (
        <Router>
            <div className="min-h-screen bg-black text-neutral-100 font-sans">
                <nav className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-neutral-600"><Link to="/">Client</Link><Link to="/admin">Admin</Link></div>
                </nav>
                <div className="py-8"><Routes><Route path="/admin" element={<AdminDashboard token={token} />} /></Routes></div>
            </div>
        </Router>
    );
}
export default App;
