import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  LayoutDashboard, 
  Sliders, 
  ShieldAlert, 
  Activity, 
  Users, 
  ArrowRight,
  Compass,
  Smartphone
} from 'lucide-react';

const ICON_MAP = {
  UserPlus,
  LayoutDashboard,
  Sliders,
  ShieldAlert,
  Activity,
  Users,
  Compass,
  Smartphone
};

export const NavCard = ({ card }) => {
  const navigate = useNavigate();
  if (!card) return null;

  const IconComponent = ICON_MAP[card.iconName] || Compass;

  const handleNavigate = () => {
    if (card.route) {
      navigate(card.route);
    }
  };

  return (
    <div className="mt-3.5 w-full max-w-md rounded-2xl bg-gradient-to-br from-[#12131F] via-[#10111A] to-[#0A0A10] border border-indigo-500/25 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-indigo-500/40 transition-all group">
      
      {/* Category Pill & ID */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/5 text-[11px] font-mono">
        <span className="text-indigo-400 font-semibold tracking-wider uppercase">
          {card.category || 'Direct Shortcut'}
        </span>
        <span className="text-zinc-500">
          Quick Link
        </span>
      </div>

      {/* Main Body */}
      <div className="flex items-start gap-3.5 py-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 group-hover:bg-indigo-500/20 transition-all shadow-sm">
          <IconComponent className="w-5 h-5 stroke-[2]" />
        </div>

        <div className="flex flex-col">
          <h4 className="text-sm font-semibold text-white tracking-tight group-hover:text-indigo-200 transition-colors">
            {card.title}
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
            {card.description}
          </p>
          {card.reason && (
            <span className="text-[10px] text-zinc-500 font-mono mt-1 italic">
              Context: {card.reason}
            </span>
          )}
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={handleNavigate}
        className="w-full mt-1.5 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#A477FF] hover:bg-[#B18BFF] text-[#100A1C] text-xs font-bold shadow-[0_0_20px_rgba(164,119,255,0.25)] hover:shadow-[0_0_25px_rgba(164,119,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
      >
        <span>{card.buttonLabel || 'Open Destination'}</span>
        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
      </button>
    </div>
  );
};

export default NavCard;

