export const StatCard = ({ label, value, color = "text-white" }: { label: string, value: string | number, color?: string }) => (
    <div className="p-8 bg-neutral-900 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden group hover:border-blue-500/30 transition-colors duration-500">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-600/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
        <div className="text-xs font-black uppercase text-neutral-400 mb-3 tracking-[0.2em] relative z-10">{label}</div>
        <div className={`text-4xl font-black tracking-tighter relative z-10 ${color}`}>{value}</div>
    </div>
);
