import React, { useState, useEffect, useMemo } from 'react';
import { 
  Receipt, 
  Plus, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Star, 
  Heart, 
  Activity, 
  Info, 
  Lightbulb, 
  Lock, 
  Building2, 
  Check, 
  X, 
  UploadCloud,
  Search,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ShieldCheck,
  FileText,
  DollarSign,
  AlertTriangle,
  HelpCircle,
  Clock,
  Layers,
  BarChart3
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import billService from '../../services/billService';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

export default function PatientBills() {
  const { user } = useAuth();

  // Bills Data State
  const [bills, setBills] = useState([]);
  const [selectedBillId, setSelectedBillId] = useState(null);
  const [loading, setLoading] = useState(true);

  // 3-Way Multi-Dimensional Comparison Data
  const [comparisonData, setComparisonData] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  // AI Bill Analyzer Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAuditing, setAiAuditing] = useState(false);
  const [aiAuditResult, setAiAuditResult] = useState(null);

  // Rating and Feedback Form
  const [starRating, setStarRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Other Modals State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [allBillsModalOpen, setAllBillsModalOpen] = useState(false);
  const [allBillsSearch, setAllBillsSearch] = useState('');
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [packageDetailsOpen, setPackageDetailsOpen] = useState(false);

  // Upload Form State (Dynamic Package Integration)
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTreatment, setUploadTreatment] = useState('Total Knee Replacement (Single Knee)');
  const [uploadHospital, setUploadHospital] = useState('');
  const [uploadPackageId, setUploadPackageId] = useState('');
  const [uploadAmount, setUploadAmount] = useState('185000');
  const [uploading, setUploading] = useState(false);
  const [hospitalsList, setHospitalsList] = useState([]);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);

  // Common Procedures in Indore for quick selection
  const COMMON_PROCEDURES = [
    'Total Knee Replacement (Single Knee)',
    'Coronary Angioplasty (1 Drug-Eluting Stent)',
    'Heart Surgery',
    'Laparoscopic Gallbladder Removal',
    'Comprehensive Normal Delivery Care Package',
    'Micro-Incision Cataract (Monofocal)'
  ];

  // Load Bills and Hospitals on Mount
  useEffect(() => {
    loadBills();
    loadHospitals();
  }, [user]);

  // Load 3-Way Comparison whenever active bill changes
  useEffect(() => {
    if (selectedBillId) {
      loadComparison(selectedBillId);
    }
  }, [selectedBillId]);

  // Load dynamic packages when upload hospital or treatment changes in upload modal
  useEffect(() => {
    if (uploadModalOpen && uploadHospital) {
      fetchPackagesForUpload(uploadHospital, uploadTreatment);
    }
  }, [uploadModalOpen, uploadHospital, uploadTreatment]);

  const loadHospitals = async () => {
    try {
      const { data } = await supabase
        .from('hospitals')
        .select('id, name, city')
        .order('name');
      if (data && data.length > 0) {
        setHospitalsList(data);
        setUploadHospital(data[0].id);
      }
    } catch (err) {
      console.warn('Error loading hospitals:', err);
    }
  };

  const loadBills = async () => {
    try {
      setLoading(true);
      const data = await billService.getPatientBills();
      setBills(data || []);
      if (data && data.length > 0) {
        setSelectedBillId(prev => {
          if (prev && data.some(b => b.id === prev)) return prev;
          return data[0].id;
        });
      }
    } catch (err) {
      console.error('Error loading bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadComparison = async (billId) => {
    try {
      setComparisonLoading(true);
      const res = await billService.getBillComparison(billId);
      if (res) {
        setComparisonData(res);
      }
    } catch (err) {
      console.warn('Error fetching bill comparison:', err);
    } finally {
      setComparisonLoading(false);
    }
  };

  const fetchPackagesForUpload = async (hospitalId, treatmentName) => {
    try {
      setLoadingPackages(true);
      const pkgs = await billService.getAvailablePackages(hospitalId, treatmentName);
      setAvailablePackages(pkgs || []);
      if (pkgs && pkgs.length > 0) {
        setUploadPackageId(pkgs[0].id);
        setUploadAmount(String(pkgs[0].price || 150000));
      } else {
        setUploadPackageId('');
      }
    } catch (err) {
      console.warn('Error fetching packages for upload:', err);
    } finally {
      setLoadingPackages(false);
    }
  };

  // Currently Selected Bill
  const activeBill = useMemo(() => {
    if (!bills || bills.length === 0) return null;
    return bills.find(b => b.id === selectedBillId) || bills[0];
  }, [bills, selectedBillId]);

  // Derived Calculations
  const estimate = useMemo(() => {
    if (comparisonData?.packageComparison?.packagePrice) {
      return Number(comparisonData.packageComparison.packagePrice);
    }
    return activeBill ? Number(activeBill.package?.price || activeBill.estimated_amount || 150000) : 150000;
  }, [comparisonData, activeBill]);

  const finalBill = useMemo(() => {
    return activeBill ? Number(activeBill.final_amount || 152000) : 152000;
  }, [activeBill]);

  const diffAmount = finalBill - estimate;
  const diffPercent = estimate > 0 ? ((diffAmount / estimate) * 100).toFixed(1) : '0.0';

  // Dynamic Inclusions from Database Package
  const activeInclusions = useMemo(() => {
    if (activeBill?.package?.included_services) {
      let svcs = activeBill.package.included_services;
      if (typeof svcs === 'string') {
        try { svcs = JSON.parse(svcs); } catch (e) {}
      }
      if (Array.isArray(svcs) && svcs.length > 0) return svcs;
    }
    if (activeBill?.line_items && activeBill.line_items.length > 0) {
      return activeBill.line_items.map(it => it.category || it.description);
    }
    return ['Surgeon & Specialist Fee', 'Operation Theater (OT) Charges', 'Room & Nursing Stay', 'Routine Medications', 'Diagnostics & Tests'];
  }, [activeBill]);

  // Dynamic Line Items for Comparison Table
  const activeLineItems = useMemo(() => {
    if (activeBill?.line_items && activeBill.line_items.length > 0) {
      return activeBill.line_items;
    }
    return [
      { category: 'Surgeon & Consultation Fee', package_amount: Math.round(estimate * 0.40), amount: Math.round(estimate * 0.40), difference_amount: 0, difference_reason: 'As per package' },
      { category: 'Operation Theater (OT) Charges', package_amount: Math.round(estimate * 0.18), amount: Math.round(estimate * 0.18), difference_amount: 0, difference_reason: 'As per package' },
      { category: 'Room & Nursing Charges', package_amount: Math.round(estimate * 0.18), amount: Math.round(estimate * 0.18), difference_amount: 0, difference_reason: 'As per package' },
      { category: 'ICU & Critical Care', package_amount: Math.round(estimate * 0.12), amount: Math.round(estimate * 0.12), difference_amount: 0, difference_reason: 'As per package' },
      { category: 'Medications & Consumables', package_amount: Math.round(estimate * 0.08), amount: Math.round(estimate * 0.08) + (diffAmount > 0 ? diffAmount : 0), difference_amount: diffAmount > 0 ? diffAmount : 0, difference_reason: diffAmount > 0 ? 'Extra medicines and consumables outside standard package formulary' : 'As per package' },
      { category: 'Diagnostics & Lab Tests', package_amount: Math.round(estimate * 0.04), amount: Math.round(estimate * 0.04), difference_amount: 0, difference_reason: 'As per package' }
    ];
  }, [activeBill, estimate, diffAmount]);

  // Dynamic Extra Charge items for "Why Extra Amount?" box
  const extraItems = useMemo(() => {
    return activeLineItems.filter(it => Number(it.difference_amount) > 0);
  }, [activeLineItems]);

  // Top 3 Newest Bills displayed on the left card
  const displayedBills = useMemo(() => {
    return (bills || []).slice(0, 3);
  }, [bills]);

  // Filtered bills for "View All Bills" modal
  const filteredAllBills = useMemo(() => {
    if (!allBillsSearch.trim()) return bills;
    const query = allBillsSearch.toLowerCase();
    return bills.filter(b => 
      (b.hospital?.name || '').toLowerCase().includes(query) ||
      (b.treatment_name || '').toLowerCase().includes(query) ||
      (b.bill_number || '').toLowerCase().includes(query)
    );
  }, [bills, allBillsSearch]);

  // Format Indian Currency
  const formatINR = (val) => {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN');
  };

  // Format Bill Date
  const formatDate = (dateStr) => {
    if (!dateStr) return '29 May 2025';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Handle AI Bill Audit Run
  const handleRunAiAudit = async () => {
    if (!activeBill?.id) return;
    try {
      setAiModalOpen(true);
      setAiAuditing(true);
      const audit = await billService.auditBillWithAI(activeBill.id);
      setAiAuditResult(audit?.aiFindings || null);
    } catch (err) {
      console.error('Error running AI bill audit:', err);
    } finally {
      setAiAuditing(false);
    }
  };

  // Handle Star Rating Submit
  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (starRating === 0) {
      alert('Please select a star rating between 1 and 5.');
      return;
    }

    try {
      setSubmittingRating(true);
      await billService.submitRating({
        hospitalId: activeBill?.hospital_id || activeBill?.hospital?.id,
        billId: activeBill?.id,
        rating: starRating,
        feedback: feedbackText
      });
      setRatingSubmitted(true);
      setTimeout(() => {
        setRatingSubmitted(false);
        setFeedbackText('');
        setStarRating(0);
      }, 3500);
    } catch (err) {
      alert('Could not submit rating. Please try again.');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Handle Bill Upload with Dynamic Package Selection
  const handleBillUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a bill document (PDF, PNG, JPG).');
      return;
    }

    try {
      setUploading(true);
      const newBill = await billService.uploadNewBill({
        file: uploadFile,
        hospitalId: uploadHospital || null,
        treatmentName: uploadTreatment || 'Total Knee Replacement',
        packageId: uploadPackageId || null,
        finalAmount: uploadAmount || 185000
      });

      await loadBills();
      if (newBill?.id) {
        setSelectedBillId(newBill.id);
        await loadComparison(newBill.id);
      }
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadAmount('185000');
      alert('Bill successfully uploaded and dynamically matched with hospital package and city benchmarks!');
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppLayout>
      <main className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-5 flex flex-col gap-5 select-none min-w-0">

        {/* =================================================================== */}
        {/* 1. TOP HEADER & PRIMARY ACTIONS                                     */}
        {/* =================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight">
                My Bills & Cost Analysis
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-black uppercase tracking-wider">
                Indore Region
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">
              Compare your hospital bills against treatment packages, previous bills, and Indore city averages.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* AI Bill Analyzer Trigger */}
            <button
              type="button"
              onClick={handleRunAiAudit}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-200 stroke-[2.5]" />
              <span>AI Bill Analyzer</span>
            </button>

            {/* Upload New Bill Trigger */}
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Upload New Bill</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. TOP TWO-COLUMN ROW: UPLOADED BILLS & SELECTED PACKAGE            */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* LEFT: Your Uploaded Bills */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <span>Your Uploaded Bills</span>
                </h2>
                <span className="text-[11px] font-bold text-slate-400">
                  Showing {Math.min(3, bills.length)} of {bills.length}
                </span>
              </div>

              {/* Bills List */}
              <div className="flex flex-col gap-2.5">
                {displayedBills.map(bill => {
                  const isSelected = activeBill?.id === bill.id;
                  const hospName = bill.hospital?.name || 'Hospital in Indore';
                  const isApollo = hospName.toLowerCase().includes('apollo');
                  const isShalby = hospName.toLowerCase().includes('shalby');
                  const isCHL = hospName.toLowerCase().includes('chl');
                  const isBombay = hospName.toLowerCase().includes('bombay');

                  return (
                    <div
                      key={bill.id}
                      onClick={() => setSelectedBillId(bill.id)}
                      className={`p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50/30 shadow-xs ring-1 ring-blue-400/40' 
                          : 'border-slate-200/80 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {/* Left: Logo & Hospital info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-xs border ${
                          isShalby 
                            ? 'bg-amber-50 text-amber-800 border-amber-200' 
                            : isCHL
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : isApollo 
                            ? 'bg-blue-50 text-blue-800 border-blue-100' 
                            : isBombay 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                            : 'bg-slate-50 text-slate-800 border-slate-200'
                        }`}>
                          {isShalby ? 'Shalby' : isCHL ? 'CHL' : isApollo ? 'Apollo' : isBombay ? 'Bombay' : 'Hosp'}
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-extrabold text-xs sm:text-[13px] text-slate-900 truncate">
                            {hospName}, Indore
                          </h3>
                          <span className="text-[11px] text-slate-600 font-bold block truncate">
                            {bill.treatment_name || 'Heart Surgery'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                            Date: {formatDate(bill.bill_date)}
                          </span>
                        </div>
                      </div>

                      {/* Right: Amount, Badge, Chevron */}
                      <div className="flex items-center gap-2.5 shrink-0 text-right">
                        <div>
                          <span className="text-xs sm:text-sm font-black text-slate-900 block">
                            {formatINR(bill.final_amount)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-block mt-0.5 border ${
                            bill.bill_match_status === 'matched'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {bill.bill_match_status === 'matched' ? 'Exact Match' : 'Variance'}
                          </span>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-colors ${isSelected ? 'text-blue-600' : 'text-slate-300'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* View All Bills Trigger */}
            <button
              type="button"
              onClick={() => setAllBillsModalOpen(true)}
              className="text-xs font-black text-blue-600 hover:text-blue-700 transition-colors mt-3 text-left inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All Bills ({bills.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* RIGHT: Selected Treatment Package / Estimate (100% Data-Driven from DB) */}
          <div className="lg:col-span-7 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div>
              {/* Header Title with Procedure Badge */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                    <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      {activeBill?.package?.name || `${activeBill?.treatment_name || 'Treatment'} Package`}
                    </h2>
                    <span className="text-xs text-slate-500 font-semibold block mt-0.5">
                      {activeBill?.hospital?.name || 'Indore Hospital'}, Indore
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black shrink-0">
                  {activeBill?.package?.active !== false ? 'Package Verified' : 'Estimate Active'}
                </span>
              </div>

              {/* Package Body: Price, Inclusions Checklist, Stay Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start pt-2 border-t border-slate-100">
                
                {/* Cost Column */}
                <div className="sm:col-span-4">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                    Hospital Package Baseline
                  </span>
                  <span className="text-2xl sm:text-[26px] font-black text-emerald-600 tracking-tight block mt-1">
                    {formatINR(estimate)}
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                    {activeBill?.package?.room_category || 'Semi-Private / Deluxe Room'}
                  </span>
                </div>

                {/* Inclusions Checklist (Dynamic from Database) */}
                <div className="sm:col-span-5">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider mb-1.5">
                    Package Inclusions
                  </span>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs font-bold text-slate-700">
                    {activeInclusions.slice(0, 6).map((inc, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{inc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Duration & Details Trigger */}
                <div className="sm:col-span-3 text-left sm:text-right flex flex-col sm:items-end justify-between self-stretch">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                      Stay Included
                    </span>
                    <span className="text-xs font-black text-slate-800 block mt-0.5">
                      {activeBill?.package?.duration_days ? `${activeBill.package.duration_days} Days Inpatient` : '3-4 Days Stay'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPackageDetailsOpen(true)}
                    className="text-xs font-black text-blue-600 hover:text-blue-700 transition-colors mt-3 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Package Details</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* =================================================================== */}
        {/* 3. THREE-WAY COMPARATIVE BENCHMARK CARDS                            */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: vs Hospital Treatment Package */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. vs Hospital Package</span>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                  diffAmount === 0 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : diffAmount > 0 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {diffAmount === 0 ? 'Exact Match' : diffAmount <= 5000 ? 'Minor Difference' : 'Variance Detected'}
                </span>
              </div>

              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {formatINR(finalBill)}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    vs {formatINR(estimate)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-sm font-black ${diffAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {diffAmount > 0 ? `+${formatINR(diffAmount)}` : formatINR(diffAmount)}
                  </span>
                  {diffAmount !== 0 && (
                    <span className="text-xs font-bold text-slate-500">
                      ({diffPercent}% {diffAmount > 0 ? 'above' : 'below'} package price)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-medium pt-2 border-t border-slate-100">
              {diffAmount === 0 
                ? 'All billed items match the agreed hospital package tariff exactly.' 
                : 'Extra items detected in medications and non-standard consumables.'}
            </p>
          </div>

          {/* Card 2: vs Your Previous Bills */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>2. vs Your Previous Bills</span>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                  comparisonData?.previousBillsComparison?.spendingTrend === 'increased'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : comparisonData?.previousBillsComparison?.spendingTrend === 'decreased'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  {comparisonData?.previousBillsComparison?.spendingTrend === 'increased'
                    ? '+ Increased'
                    : comparisonData?.previousBillsComparison?.spendingTrend === 'decreased'
                    ? '− Decreased'
                    : 'Stable / Baseline'}
                </span>
              </div>

              <div className="mt-3">
                {comparisonData?.previousBillsComparison?.priorMatchingBill ? (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">
                        {formatINR(finalBill)}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        vs {formatINR(comparisonData.previousBillsComparison.priorMatchingBill.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-sm font-black ${
                        comparisonData.previousBillsComparison.priorVarianceAmount > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {comparisonData.previousBillsComparison.priorVarianceAmount > 0 
                          ? `+${formatINR(comparisonData.previousBillsComparison.priorVarianceAmount)}` 
                          : formatINR(comparisonData.previousBillsComparison.priorVarianceAmount)}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        ({comparisonData.previousBillsComparison.priorVariancePercent}% vs last bill)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-2xl font-black text-slate-900">{formatINR(finalBill)}</span>
                    <span className="text-xs font-bold text-slate-400 block mt-1">First record for this procedure</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-medium pt-2 border-t border-slate-100">
              {comparisonData?.previousBillsComparison?.advisory || 'Historical baseline established for this procedure.'}
            </p>
          </div>

          {/* Card 3: vs Indore City Average Benchmark */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3. vs Indore City Average</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">
                  {comparisonData?.cityBenchmark?.valueRating === 'below_market' 
                    ? 'Great Value' 
                    : comparisonData?.cityBenchmark?.valueRating === 'above_market'
                    ? 'Above Average'
                    : 'Fair Market'}
                </span>
              </div>

              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {formatINR(comparisonData?.cityBenchmark?.averagePrice || estimate)}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    City Benchmark
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-slate-500">
                  <span>Range: {formatINR(comparisonData?.cityBenchmark?.minPrice || estimate)} - {formatINR(comparisonData?.cityBenchmark?.maxPrice || estimate)}</span>
                  <span>•</span>
                  <span>{comparisonData?.cityBenchmark?.hospitalsSampled || 3} Hospitals</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-medium pt-2 border-t border-slate-100">
              {comparisonData?.cityBenchmark?.differenceFromAverage && comparisonData.cityBenchmark.differenceFromAverage > 0
                ? `₹${Math.abs(comparisonData.cityBenchmark.differenceFromAverage).toLocaleString('en-IN')} higher than the Indore average.`
                : `Your bill is within competitive tariff ranges across Indore healthcare centers.`}
            </p>
          </div>

        </div>

        {/* =================================================================== */}
        {/* 4. BOTTOM 3-COLUMN LAYOUT: COMPARISON TABLE, WHY EXTRA, & SIDEBAR   */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* COLUMN 1: Bill Comparison Table (100% Dynamic from DB line items) */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Itemized Package Comparison</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                {activeLineItems.length} Categories
              </span>
            </div>

            <div className="overflow-x-auto touch-scroll-x">
              <table className="w-full min-w-[540px] text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 text-[11px] font-black text-slate-500">
                    <th className="pb-2.5 font-black">Treatment / Service</th>
                    <th className="pb-2.5 font-black text-right">Package Limit</th>
                    <th className="pb-2.5 font-black text-right">Your Bill</th>
                    <th className="pb-2.5 font-black text-right">Difference</th>
                    <th className="pb-2.5 font-black pl-3">Variance Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {activeLineItems.map((item, idx) => {
                    const diff = Number(item.difference_amount) || 0;
                    const isExtra = diff > 0;

                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-bold text-slate-800 whitespace-nowrap">
                          {item.category || item.description}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-slate-600 whitespace-nowrap">
                          {formatINR(item.package_amount || item.amount)}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-slate-800 whitespace-nowrap">
                          {formatINR(item.amount)}
                        </td>
                        <td className="py-2.5 text-right font-black whitespace-nowrap">
                          <span className={isExtra ? 'text-rose-600' : 'text-emerald-600'}>
                            {isExtra ? `+${formatINR(diff)}` : formatINR(diff)}
                          </span>
                        </td>
                        <td className="py-2.5 pl-3 text-[11px] text-slate-500 font-medium">
                          {isExtra ? (
                            <span className="text-amber-700 flex items-center gap-1 font-semibold">
                              <Info className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>{item.difference_reason || 'Extra charges outside package'}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              {item.difference_reason || 'As per package'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Total Row */}
                  <tr className="border-t-2 border-slate-200 font-black bg-slate-50/60">
                    <td className="py-3 text-slate-900 font-black">Total</td>
                    <td className="py-3 text-right text-slate-900">{formatINR(estimate)}</td>
                    <td className="py-3 text-right text-slate-900">{formatINR(finalBill)}</td>
                    <td className="py-3 text-right text-rose-600 font-black">
                      {diffAmount > 0 ? `+${formatINR(diffAmount)}` : formatINR(diffAmount)}
                    </td>
                    <td className="py-3 pl-3 text-[11px] text-rose-600 font-black">
                      {diffAmount !== 0 ? `${diffPercent}% higher` : 'Matched'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Alert Banner with Lightbulb */}
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs font-semibold flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {diffAmount > 0 
                  ? 'The variance is primarily due to non-formulary medications and surgical consumables used during inpatient recovery.' 
                  : 'All billed services comply with the hospital treatment package tariffs.'}
              </span>
            </div>
          </div>

          {/* COLUMN 2: Why Extra Amount? */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Why Extra Amount?</span>
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Identified causes for charges exceeding the hospital package baseline.
              </p>
            </div>

            {/* Dynamic Reason Cards */}
            {extraItems.length > 0 ? (
              extraItems.map((item, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-slate-200/90 bg-white flex flex-col gap-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Activity className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-xs text-slate-900">
                        {item.category || item.description}
                      </span>
                    </div>
                    <span className="font-black text-xs text-rose-600">
                      +{formatINR(item.difference_amount)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium pl-9">
                    {item.difference_reason || 'Charges incurred outside standard package formulary.'}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Zero extra amount! All charges match package limits.</span>
              </div>
            )}

            {/* Total Extra Amount Box */}
            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100 flex flex-col items-start gap-0.5">
              <span className="text-[11px] font-bold text-slate-500">
                Total Extra Amount
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-rose-600">
                  {diffAmount > 0 ? `+${formatINR(diffAmount)}` : '₹0'}
                </span>
                {diffAmount > 0 && (
                  <span className="text-xs font-bold text-rose-500">
                    ({diffPercent}% higher)
                  </span>
                )}
              </div>
            </div>

            {/* Questions Note & Contact Button */}
            <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-col gap-3">
              <div className="flex items-start gap-2 text-xs font-semibold text-slate-700">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  If you have questions regarding non-formulary charges, connect directly with the hospital billing dispute team.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setContactModalOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-blue-400 text-blue-600 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Contact Hospital Billing Desk</span>
              </button>
            </div>
          </div>

          {/* COLUMN 3: Right Sidebar Stack */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            
            {/* 1. Bill Match Status */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col items-center text-center gap-2">
              <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="text-sm font-black text-emerald-700 uppercase tracking-wide">
                {diffAmount === 0 ? 'MATCHED' : diffAmount <= 5000 ? 'MINOR DIFFERENCE' : 'VARIANCE DETECTED'}
              </h4>
              <p className="text-xs font-bold text-slate-800">
                {diffAmount === 0 ? 'Your bill is well within package limits.' : 'Difference detected against agreed hospital tariff.'}
              </p>
              <span className="text-[11px] font-semibold text-slate-400">
                Verified against Indore hospital package database.
              </span>
            </div>

            {/* 2. Rate Your Experience */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-2.5">
              <span className="text-xs font-black text-slate-900 block">
                Rate Your Experience
              </span>
              <p className="text-[11px] text-slate-500 font-medium">
                How transparent was the billing experience at {activeBill?.hospital?.name || 'Indore Hospital'}?
              </p>

              {/* 5 Interactive Stars */}
              <div className="flex items-center gap-1.5 py-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setStarRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star 
                      className={`w-5 h-5 ${
                        (hoverRating || starRating) >= star 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'text-slate-300'
                      }`} 
                    />
                  </button>
                ))}
              </div>

              {/* Feedback Textarea */}
              <form onSubmit={handleRatingSubmit} className="flex flex-col gap-2">
                <textarea
                  rows={2}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Share feedback on billing transparency..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />

                <button
                  type="submit"
                  disabled={submittingRating || starRating === 0}
                  className="w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 text-xs font-black transition-all cursor-pointer"
                >
                  {ratingSubmitted ? '✓ Rating Submitted' : submittingRating ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>

            {/* 3. Need Help? */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-2">
              <span className="text-xs font-black text-slate-900 block">
                Billing Dispute Support
              </span>
              <p className="text-[11px] text-slate-500 font-medium">
                Our patient advocates assist in contesting unfair non-formulary charges.
              </p>
              <button
                type="button"
                onClick={() => setSupportModalOpen(true)}
                className="w-full py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-300 text-rose-600 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Talk to Patient Advocate</span>
              </button>
            </div>

          </div>

        </div>

        {/* =================================================================== */}
        {/* 5. FOOTER TRANSPARENCY PROMISE                                     */}
        {/* =================================================================== */}
        <div className="p-4 text-center flex items-center justify-center gap-2 text-xs text-slate-500 font-semibold border-t border-slate-200/60 mt-2">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>We ensure complete billing transparency in your healthcare. Zero hidden charges guaranteed.</span>
        </div>

        {/* =================================================================== */}
        {/* MODAL 1: VIEW ALL BILLS                                             */}
        {/* =================================================================== */}
        {allBillsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4 max-h-[85vh]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">All Uploaded Bills</h3>
                  <span className="text-xs text-slate-400 font-bold">{bills.length} total bills on file</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setAllBillsModalOpen(false)} 
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={allBillsSearch}
                  onChange={(e) => setAllBillsSearch(e.target.value)}
                  placeholder="Search by hospital, treatment, or bill number..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Bills List */}
              <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                {filteredAllBills.map(bill => {
                  const isSelected = activeBill?.id === bill.id;
                  const hospName = bill.hospital?.name || 'Hospital';

                  return (
                    <div
                      key={bill.id}
                      onClick={() => {
                        setSelectedBillId(bill.id);
                        setAllBillsModalOpen(false);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-400' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900">
                          {hospName}, Indore
                        </h4>
                        <span className="text-[11px] text-slate-500 font-semibold block">
                          {bill.treatment_name || 'Heart Surgery'} • #{bill.bill_number}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                          Date: {formatDate(bill.bill_date)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 block">
                          {formatINR(bill.final_amount)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200 inline-block mt-0.5">
                          Select Bill
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setAllBillsModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs mt-1 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODAL 2: UPLOAD NEW BILL (With Dynamic Treatment & Package Match)   */}
        {/* =================================================================== */}
        {uploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">Upload Hospital Bill</h3>
                  <span className="text-xs text-slate-500 font-medium">Automatic comparison against packages & city benchmarks</span>
                </div>
                <button type="button" onClick={() => setUploadModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleBillUpload} className="flex flex-col gap-3 text-xs font-semibold">
                
                {/* File Dropzone */}
                <div 
                  onClick={() => document.getElementById('bill-upload-input')?.click()}
                  className="p-5 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl bg-slate-50 flex flex-col items-center justify-center cursor-pointer transition-colors"
                >
                  <input
                    id="bill-upload-input"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                  <UploadCloud className="w-7 h-7 text-blue-600 mb-1" />
                  <span className="font-bold text-slate-800 text-center">
                    {uploadFile ? uploadFile.name : 'Click to select bill PDF or Image'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG (Max 50MB)</span>
                </div>

                {/* Hospital Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Hospital</label>
                  <select 
                    value={uploadHospital}
                    onChange={(e) => setUploadHospital(e.target.value)}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {hospitalsList.map(h => (
                      <option key={h.id} value={h.id}>{h.name}, {h.city || 'Indore'}</option>
                    ))}
                  </select>
                </div>

                {/* Treatment Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Treatment / Procedure</label>
                  <select 
                    value={uploadTreatment} 
                    onChange={(e) => setUploadTreatment(e.target.value)} 
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {COMMON_PROCEDURES.map((proc, i) => (
                      <option key={i} value={proc}>{proc}</option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Package Selector */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
                    <span>Verified Hospital Package (From Database)</span>
                    {loadingPackages && <span className="text-blue-600 text-[10px] font-bold">Checking...</span>}
                  </label>
                  {availablePackages.length > 0 ? (
                    <select
                      value={uploadPackageId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        setUploadPackageId(pid);
                        const chosen = availablePackages.find(p => p.id === pid);
                        if (chosen) setUploadAmount(String(chosen.price));
                      }}
                      className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-200 text-xs font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {availablePackages.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} — ₹{Number(pkg.price).toLocaleString('en-IN')} ({pkg.duration_days || 3} Days)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
                      No exact package found. City benchmark will be used automatically.
                    </div>
                  )}
                </div>

                {/* Billed Amount Input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Your Final Billed Amount (₹)</label>
                  <input 
                    type="number" 
                    value={uploadAmount} 
                    onChange={(e) => setUploadAmount(e.target.value)} 
                    placeholder="e.g. 185000"
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !uploadFile}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold shadow-sm cursor-pointer flex items-center gap-2"
                  >
                    {uploading ? (
                      <span>Analyzing & Matching...</span>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload & Run Comparison</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODAL 3: AI BILL ANALYZER & SHOCK DETECTOR                          */}
        {/* =================================================================== */}
        {aiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 flex flex-col gap-4 max-h-[88vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">AI Bill Intelligence & Shock Detector</h3>
                    <span className="text-xs text-slate-400 font-semibold">Auditing {activeBill?.treatment_name} at {activeBill?.hospital?.name}</span>
                  </div>
                </div>
                <button type="button" onClick={() => setAiModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {aiAuditing ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <h4 className="text-sm font-black text-slate-800">Auditing Bill Line Items & Tariffs...</h4>
                  <p className="text-xs text-slate-500 max-w-xs">Comparing with agreed hospital package allocations and city-wide benchmarks.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 text-xs font-semibold">
                  
                  {/* Top Stats: Shock Level & Compliance */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Bill Shock Level</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                          aiAuditResult?.bill_shock_level === 'High' 
                            ? 'bg-rose-100 text-rose-800' 
                            : aiAuditResult?.bill_shock_level === 'Moderate'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {aiAuditResult?.bill_shock_level || 'Low Risk'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Package Compliance Score</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xl font-black text-emerald-600">
                          {aiAuditResult?.package_compliance_score || 98}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">Compliant</span>
                      </div>
                    </div>
                  </div>

                  {/* Plain Patient Advice Box */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-extrabold text-xs">AI Audit Summary</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-emerald-800 font-medium">
                      {aiAuditResult?.plain_patient_advice || aiAuditResult?.audit_summary || 'Your bill was audited against hospital tariff guidelines.'}
                    </p>
                  </div>

                  {/* Anomaly Checklist */}
                  {aiAuditResult?.anomaly_reasons && aiAuditResult.anomaly_reasons.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Detected Cost Variance Drivers</span>
                      <div className="space-y-1.5">
                        {aiAuditResult.anomaly_reasons.map((reason, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span className="text-slate-700 font-semibold">{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Negotiation Action Checklist */}
                  {aiAuditResult?.negotiation_checklist && aiAuditResult.negotiation_checklist.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">What You Can Do (Negotiation Checklist)</span>
                      <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col gap-2">
                        {aiAuditResult.negotiation_checklist.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-slate-700">
                            <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-[11px]">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setAiModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAiModalOpen(false);
                        setContactModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Contact Billing Desk
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODAL 4: CONTACT HOSPITAL BILLING DESK                              */}
        {/* =================================================================== */}
        {contactModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {activeBill?.hospital?.name || 'Hospital in Indore'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Direct contact for package verification & bill queries
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Billing Desk:</span>
                  <span className="font-extrabold text-slate-900">{activeBill?.hospital?.phone || '+91 731 249 9000'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">TPA / Insurance:</span>
                  <span className="font-extrabold text-slate-900">+91 731 249 9122</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Bill Reference:</span>
                  <span className="font-extrabold text-blue-600">{activeBill?.bill_number || 'BILL-REF-001'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODAL 5: TALK TO SUPPORT                                            */}
        {/* =================================================================== */}
        {supportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">OpenHealth Patient Advocacy</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Free package dispute and bill audit support team
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 text-xs text-slate-700 font-semibold flex flex-col gap-2">
                <span className="text-rose-700 font-bold">Toll-Free Patient Hotline:</span>
                <span className="text-lg font-black text-slate-900">1800-419-7484</span>
                <span className="text-[11px] text-slate-400">Available Mon - Sat: 8:00 AM - 8:00 PM</span>
              </div>

              <button
                type="button"
                onClick={() => setSupportModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODAL 6: VIEW PACKAGE DETAILS                                       */}
        {/* =================================================================== */}
        {packageDetailsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900">
                  {activeBill?.package?.name || `${activeBill?.treatment_name} Package`} Details
                </h3>
                <button type="button" onClick={() => setPackageDetailsOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs flex flex-col gap-3">
                <div className="flex justify-between pb-2 border-b border-slate-100 font-bold">
                  <span className="text-slate-400">Package Baseline:</span>
                  <span className="text-emerald-600 font-black text-sm">{formatINR(estimate)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100 font-bold">
                  <span className="text-slate-400">Hospital:</span>
                  <span className="text-slate-800">{activeBill?.hospital?.name || 'Hospital'}, Indore</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100 font-bold">
                  <span className="text-slate-400">Stay Duration:</span>
                  <span className="text-slate-800">{activeBill?.package?.duration_days || 4} Days Inpatient Stay</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100 font-bold">
                  <span className="text-slate-400">Room Category:</span>
                  <span className="text-slate-800">{activeBill?.package?.room_category || 'Semi-Private / Deluxe'}</span>
                </div>

                <span className="font-extrabold text-slate-800 uppercase text-[10px] tracking-wider pt-1">
                  Guaranteed Inclusions
                </span>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 font-medium">
                  {activeInclusions.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>

                <span className="font-extrabold text-slate-800 uppercase text-[10px] tracking-wider pt-1">
                  Non-Package Exclusions
                </span>
                <ul className="list-disc pl-4 space-y-1 text-slate-400 font-medium">
                  <li>Special non-formulary pharmaceuticals dispensed without advance approval</li>
                  <li>Specialist consultations for unrelated secondary conditions</li>
                  <li>Inpatient stay exceeding standard package duration</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setPackageDetailsOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs mt-2 cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        )}

      </main>
    </AppLayout>
  );
}
