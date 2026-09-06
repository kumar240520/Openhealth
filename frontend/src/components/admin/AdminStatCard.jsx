import React from 'react';
import { motion } from 'framer-motion';

export default function AdminStatCard({ 
  title, 
  value, 
  subtext, 
  icon: Icon, 
  color = 'blue', 
  trend, 
  pulse = false 
}) {
  const colorStyles = {
    blue: {
      iconBg: 'bg-blue-500/10 border-blue-200/60 text-blue-600',
      badge: 'text-blue-700 bg-blue-50 border-blue-200',
      accent: 'text-blue-600'
    },
    emerald: {
      iconBg: 'bg-emerald-500/10 border-emerald-200/60 text-emerald-600',
      badge: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      accent: 'text-emerald-600'
    },
    amber: {
      iconBg: 'bg-amber-500/10 border-amber-200/60 text-amber-600',
      badge: 'text-amber-700 bg-amber-50 border-amber-200',
      accent: 'text-amber-600'
    },
    purple: {
      iconBg: 'bg-purple-500/10 border-purple-200/60 text-purple-600',
      badge: 'text-purple-700 bg-purple-50 border-purple-200',
      accent: 'text-purple-600'
    },
    rose: {
      iconBg: 'bg-rose-500/10 border-rose-200/60 text-rose-600',
      badge: 'text-rose-700 bg-rose-50 border-rose-200',
      accent: 'text-rose-600'
    },
    cyan: {
      iconBg: 'bg-cyan-500/10 border-cyan-200/60 text-cyan-600',
      badge: 'text-cyan-700 bg-cyan-50 border-cyan-200',
      accent: 'text-cyan-600'
    }
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <motion.div
      whileHover={{ translateY: -2 }}
      transition={{ duration: 0.15 }}
      className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            {title}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {value}
            </span>
            {pulse && (
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${style.accent} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${style.accent} bg-current`} />
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${style.iconBg} shadow-inner flex-shrink-0`}>
            <Icon className="w-5 h-5 stroke-[2.2]" />
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium truncate">
          {subtext}
        </span>
        {trend && (
          <span className={`px-2 py-0.5 rounded-full border font-bold text-[10px] ${style.badge}`}>
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  );
}
