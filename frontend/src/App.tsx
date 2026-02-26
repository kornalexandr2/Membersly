import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

const ClientZone = () => {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{t('welcome')}</h1>
      <div className="bg-white/10 p-4 rounded-xl shadow-lg border border-white/20">
        <h2 className="text-lg font-medium mb-3">{t('tariffs')}</h2>
        <div className="space-y-2">
            <div className="p-3 bg-blue-500/20 rounded-lg flex justify-between items-center">
                <span>Standard (1 Mo)</span>
                <button className="bg-blue-500 px-3 py-1 rounded text-sm">499 ₽</button>
            </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-gray-400 text-sm">Active Subs</h3>
          <p className="text-2xl font-bold">1,284</p>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-gray-400 text-sm">Revenue (MTD)</h3>
          <p className="text-2xl font-bold">45,200 ₽</p>
        </div>
      </div>
      <div className="mt-8 space-y-4">
        <button className="w-full py-3 bg-indigo-600 rounded-lg font-semibold">Manage Bots</button>
        <button className="w-full py-3 bg-indigo-600 rounded-lg font-semibold">Edit Tariffs</button>
        <button className="w-full py-3 bg-indigo-600 rounded-lg font-semibold text-red-400">Broadcast Message</button>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <nav className="p-4 border-b border-white/10 flex gap-4 text-sm font-medium">
          <Link to="/" className="hover:text-blue-400 transition">User View</Link>
          <Link to="/admin" className="hover:text-blue-400 transition">Admin Panel</Link>
        </nav>
        <Routes>
          <Route path="/" element={<ClientZone />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
