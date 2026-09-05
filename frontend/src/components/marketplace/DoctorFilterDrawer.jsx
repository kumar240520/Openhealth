import React from 'react';
import { X, RotateCcw, Check, Sparkles, Building2, User } from 'lucide-react';

export default function DoctorFilterDrawer({
  isOpen,
  onClose,
  filters,
  setFilters,
  onApply,
  onReset
}) {
  if (!isOpen) return null;

  const hospitalsList = [
    'CityCare Hospital',
    'Medilife Hospital',
    'Shalby Hospital',
    'CHL Hospitals',
    'Apollo Hospitals',
    'Bombay Hospital',
    'CareWell Hospital',
    'Vedant Hospital'
  ];

  const languagesList = ['English', 'Hindi', 'Marathi', 'Gujarati', 'Punjabi'];

  const toggleLanguage = (lang) => {
    const current = filters.languages || [];
    if (current.includes(lang)) {
      setFilters(prev => ({ ...prev, languages: current.filter(l => l !== lang) }));
    } else {
      setFilters(prev => ({ ...prev, languages: [...current, lang] }));
    }
  };

  const toggleHospital = (hosp) => {
    const current = filters.hospitals || [];
    if (current.includes(hosp)) {
      setFilters(prev => ({ ...prev, hospitals: current.filter(h => h !== hosp) }));
    } else {
      setFilters(prev => ({ ...prev, hospitals: [...current, hosp] }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200/90 flex flex-col justify-between">
          
          {/* 1. Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 text-lg">Filter Doctors</span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Advanced
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 2. Scrollable Body */}
          <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 text-xs custom-scrollbar">
            
            {/* Consultation Fee Range */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-bold text-slate-800">Max Consultation Fee</label>
                <span className="font-black text-blue-600 text-sm">
                  {filters.maxFee ? `₹${filters.maxFee}` : 'Any Fee'}
                </span>
              </div>
              <input 
                type="range"
                min="300"
                max="2500"
                step="100"
                value={filters.maxFee || 2500}
                onChange={(e) => setFilters(prev => ({ ...prev, maxFee: parseInt(e.target.value) }))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                <span>₹300</span>
                <span>₹1,500</span>
                <span>₹2,500+</span>
              </div>
            </div>

            {/* Minimum Experience */}
            <div>
              <label className="font-bold text-slate-800 block mb-2">Years of Experience</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Any', val: 0 },
                  { label: '5+ yrs', val: 5 },
                  { label: '10+ yrs', val: 10 },
                  { label: '15+ yrs', val: 15 }
                ].map(exp => (
                  <button
                    key={exp.val}
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, minExperience: exp.val }))}
                    className={`py-2 px-1 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      (filters.minExperience || 0) === exp.val
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {exp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Doctor Gender */}
            <div>
              <label className="font-bold text-slate-800 block mb-2">Doctor Gender</label>
              <div className="grid grid-cols-3 gap-2">
                {['All', 'Female', 'Male'].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, gender: g.toLowerCase() }))}
                    className={`py-2 px-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      (filters.gender || 'all') === g.toLowerCase()
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Consultation Available Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-xs">Video Teleconsultation</span>
                <span className="text-[11px] text-slate-500">Only doctors offering online video slots</span>
              </div>
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, videoOnly: !prev.videoOnly }))}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  filters.videoOnly ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span 
                  className={`w-4.5 h-4.5 rounded-full bg-white absolute top-0.75 left-0.75 transition-transform ${
                    filters.videoOnly ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Languages Spoken */}
            <div>
              <label className="font-bold text-slate-800 block mb-2">Languages Spoken</label>
              <div className="flex flex-wrap gap-1.5">
                {languagesList.map(lang => {
                  const isSelected = (filters.languages || []).includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-blue-600" />}
                      <span>{lang}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hospital Affiliations */}
            <div>
              <label className="font-bold text-slate-800 block mb-2">Affiliated Hospital</label>
              <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                {hospitalsList.map(hosp => {
                  const isSelected = (filters.hospitals || []).includes(hosp);
                  return (
                    <button
                      key={hosp}
                      type="button"
                      onClick={() => toggleHospital(hosp)}
                      className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                          : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{hosp}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* 3. Footer Action Buttons */}
          <div className="p-6 border-t border-slate-100 flex items-center gap-3">
            <button
              type="button"
              onClick={onReset}
              className="flex-1 py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
            <button
              type="button"
              onClick={onApply}
              className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer text-center"
            >
              Apply Filters
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
