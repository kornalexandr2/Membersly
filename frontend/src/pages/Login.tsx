import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const LoginPage = ({ setToken, apiUrl }: { setToken: (t: string) => void, apiUrl: string }) => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password })
        });
        if (res.ok) {
            const data = await res.json();
            setToken(data.access_token);
            localStorage.setItem('admin_token', data.access_token);
            navigate('/admin');
        } else {
            alert('Access Denied');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <form onSubmit={handleLogin} className="bg-neutral-900 p-10 rounded-[3rem] border border-white/10 w-full max-w-sm space-y-6 shadow-2xl">
                <h2 className="text-3xl font-black text-center uppercase tracking-tighter italic">Admin <span className="text-blue-600">Access</span></h2>
                <div className="space-y-3">
                    <input className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all text-sm" placeholder="Login ID" value={login} onChange={e => setLogin(e.target.value)} />
                    <input className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all text-sm" type="password" placeholder="Passcode" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <button className="w-full bg-blue-600 py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20">Unlock Terminal</button>
            </form>
        </div>
    );
};
