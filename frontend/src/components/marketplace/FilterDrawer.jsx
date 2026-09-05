import React from 'react';
import { X, Check, SlidersHorizontal, RotateCcw } from 'lucide-react';

export default function FilterDrawer({
  isOpen,
  onClose,
  filters,
  setFilters,
  onApply,
  onReset
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      
      {/* Slide-over Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col justify-between overflow-y-auto custom-scrollbar"
      >
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <SlidersHorizontal className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">Advanced Filters</h3>
              <p className="text-xs text-slate-400">Refine healthcare search criteria</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Filters Body */}
        <div className="p-6 flex-1 flex flex-col gap-6 text-xs">
          
          {/* 1. Live Bed Availability */}
          <div>
            <label className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider block mb-2.5">
              Live Bed Availability
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, icuOnly: !prev.icuOnly }))}
                className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer flex items-center justify-between ${
                  filters.icuOnly ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>ICU Available</span>
                {filters.icuOnly && <Check className="w-4 h-4 text-blue-600" />}
              </button>

              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, generalOnly: !prev.generalOnly }))}
                className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer flex items-center justify-between ${
                  filters.generalOnly ? 'bg-teal-50 border-teal-600 text-teal-700 shadow-sm' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>General Available</span>
                {filters.generalOnly && <Check className="w-4 h-4 text-teal-600" />}
              </button>
            </div>
          </div>

          {/* 2. Government & Cashless Schemes */}
          <div>
            <label className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider block mb-2.5">
              Government Schemes & Cashless
            </label>
            <div className="flex flex-col gap-2">
              {[
                { id: 'pmjay', label: 'Ayushman Bharat (PM-JAY) Empanelled' },
                { id: 'cghs', label: 'Central Government Health Scheme (CGHS)' },
                { id: 'esic', label: 'ESIC Cashless Coverage' },
                { id: 'cashless', label: 'Private Insurance Cashless TPA' }
              ].map(scheme => (
                <label 
                  key={scheme.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-700 font-medium"
                >
                  <input
                    type="checkbox"
                    checked={filters.schemes?.includes(scheme.id)}
                    onChange={(e) => {
                      const cur = filters.schemes || [];
                      setFilters(prev => ({
                        ...prev,
                        schemes: e.target.checked ? [...cur, scheme.id] : cur.filter(x => x !== scheme.id)
                      }));
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span>{scheme.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Transparency Score Filter */}
          <div>
            <label className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider block mb-2.5">
              Transparency Score
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 0, label: 'All Scores' },
                { val: 80, label: '80%+ High' },
                { val: 90, label: '90%+ Top' }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, minTransparency: opt.val }))}
                  className={`py-2.5 px-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    filters.minTransparency === opt.val ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Minimum Patient Rating */}
          <div>
            <label className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider block mb-2.5">
              Minimum Rating
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: 0, label: 'All' },
                { val: 4.0, label: '4.0+ ★' },
                { val: 4.3, label: '4.3+ ★' },
                { val: 4.5, label: '4.5+ ★' }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, minRating: opt.val }))}
                  className={`py-2.5 px-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    filters.minRating === opt.val ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. 24/7 Emergency Toggle */}
          <div className="p-4 rounded-2xl bg-red-50/50 border border-red-200/80 flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="font-bold text-xs text-red-950">24/7 Emergency Available</span>
              <span className="text-[11px] text-red-700">Only show hospitals with active emergency trauma care</span>
            </div>
            <input
              type="checkbox"
              checked={filters.emergencyOnly}
              onChange={(e) => setFilters(prev => ({ ...prev, emergencyOnly: e.target.checked }))}
              className="w-5 h-5 text-red-600 rounded border-red-300 focus:ring-red-500 cursor-pointer"
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-100 transition-colors cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={onApply}
            className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all text-center cursor-pointer"
          >
            Apply Filters
          </button>
        </div>

      </div>

    </div>
  );
}
