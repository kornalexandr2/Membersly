export const StatCard = ({ label, value, color = "text-white" }: { label: string, value: string | number, color?: string }) => (
    <div className="p-8 bg-neutral-900 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-600/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
        <div className="text-[10px] font-black uppercase text-neutral-500 mb-2 tracking-[0.2em] relative z-10">{label}</div>
        <div className={`text-4xl font-black tracking-tighter relative z-10 ${color}`}>{value}</div>
    </div>
);
