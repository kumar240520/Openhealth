import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Landmark, Check, Plus, Trash2 } from 'lucide-react';

export default function SchemeFormModal({ isOpen, onClose, scheme, onSave, processing = false }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverageAmount, setCoverageAmount] = useState('5,00,000');
  const [incomeLimit, setIncomeLimit] = useState('2,50,000');
  const [rationCardType, setRationCardType] = useState('BPL / Antyodaya');
  const [isActive, setIsActive] = useState(true);
  const [treatments, setTreatments] = useState(['Cardiology', 'Oncology', 'Orthopedics', 'General Surgery']);
  const [newTreatment, setNewTreatment] = useState('');
  const [documents, setDocuments] = useState(['Aadhaar Card', 'Ration Card', 'Income Certificate']);
  const [newDocument, setNewDocument] = useState('');

  useEffect(() => {
    if (scheme) {
      setName(scheme.name || '');
      setDescription(scheme.description || '');
      setCoverageAmount(scheme.eligibility_rules?.coverage_amount || '5,00,000');
      setIncomeLimit(scheme.eligibility_rules?.income_limit || '2,50,000');
      setRationCardType(scheme.eligibility_rules?.ration_card || 'BPL / Antyodaya');
      setIsActive(scheme.is_active !== false);
      if (Array.isArray(scheme.covered_treatments)) {
        setTreatments(scheme.covered_treatments);
      }
      if (Array.isArray(scheme.required_documents)) {
        setDocuments(scheme.required_documents);
      }
    } else {
      setName('');
      setDescription('');
      setCoverageAmount('5,00,000');
      setIncomeLimit('2,50,000');
      setRationCardType('BPL / Antyodaya');
      setIsActive(true);
      setTreatments(['Cardiology', 'Oncology', 'Orthopedics', 'General Surgery']);
      setDocuments(['Aadhaar Card', 'Ration Card', 'Income Certificate']);
    }
  }, [scheme]);

  if (!isOpen) return null;

  const handleAddTreatment = () => {
    if (newTreatment.trim() && !treatments.includes(newTreatment.trim())) {
      setTreatments([...treatments, newTreatment.trim()]);
      setNewTreatment('');
    }
  };

  const handleRemoveTreatment = (t) => {
    setTreatments(treatments.filter(item => item !== t));
  };

  const handleAddDoc = () => {
    if (newDocument.trim() && !documents.includes(newDocument.trim())) {
      setDocuments([...documents, newDocument.trim()]);
      setNewDocument('');
    }
  };

  const handleRemoveDoc = (d) => {
    setDocuments(documents.filter(item => item !== d));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (onSave) {
      onSave({
        id: scheme?.id,
        name: name.trim(),
        description: description.trim(),
        is_active: isActive,
        eligibility_rules: {
          coverage_amount: coverageAmount,
          income_limit: incomeLimit,
          ration_card: rationCardType
        },
        covered_treatments: treatments,
        required_documents: documents
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden my-8 text-slate-900"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {scheme ? 'Edit Government Health Scheme' : 'Add New Government Health Scheme'}
              </h2>
              <p className="text-xs text-slate-500">Configure eligibility, annual coverage limits, and clinical documents</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs max-h-[72vh] overflow-y-auto custom-scrollbar">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Scheme Official Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ayushman Bharat - PM-JAY National Health Protection"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Description & Mandate</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Overview of beneficiaries, cashless coverage details, and participating hospital network..."
                rows={2}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Annual Coverage Cap (₹)</label>
              <input
                type="text"
                value={coverageAmount}
                onChange={(e) => setCoverageAmount(e.target.value)}
                placeholder="e.g. 5,00,000"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Family Income Ceiling (₹)</label>
              <input
                type="text"
                value={incomeLimit}
                onChange={(e) => setIncomeLimit(e.target.value)}
                placeholder="e.g. 2,50,000 / year"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Ration Card Category / Criteria</label>
              <input
                type="text"
                value={rationCardType}
                onChange={(e) => setRationCardType(e.target.value)}
                placeholder="e.g. BPL, Antyodaya Anna Yojana (AAY), State Priority Card"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Covered Treatments Tag Manager */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Covered Medical Specialties</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTreatment}
                onChange={(e) => setNewTreatment(e.target.value)}
                placeholder="Add specialty (e.g. Neurosurgery, Nephrology)"
                className="flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:border-blue-500"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTreatment(); } }}
              />
              <button
                type="button"
                onClick={handleAddTreatment}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {treatments.map((t) => (
                <span key={t} className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold flex items-center gap-1.5">
                  {t}
                  <button type="button" onClick={() => handleRemoveTreatment(t)} className="hover:text-blue-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Required Documents Tag Manager */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Required Patient Documents Checklist</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDocument}
                onChange={(e) => setNewDocument(e.target.value)}
                placeholder="Add required document (e.g. Disability Certificate, Doctor Referral)"
                className="flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:border-blue-500"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddDoc(); } }}
              />
              <button
                type="button"
                onClick={handleAddDoc}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {documents.map((d) => (
                <span key={d} className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold flex items-center gap-1.5">
                  {d}
                  <button type="button" onClick={() => handleRemoveDoc(d)} className="hover:text-emerald-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Active Status */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 block">Publish Scheme</span>
              <span className="text-[11px] text-slate-500">Available in Patient Scheme Eligibility Checker</span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-slate-200 text-slate-600 border border-slate-300'
              }`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </button>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer transition-colors"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{scheme ? 'Update Scheme' : 'Create Scheme'}</span>
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
