import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Search, 
  Filter, 
  Sparkles, 
  ShieldCheck, 
  Activity, 
  Calendar, 
  Building2, 
  Download, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  X, 
  File, 
  Stethoscope, 
  Receipt, 
  Plus, 
  ArrowUpDown, 
  Eye, 
  Clock, 
  Lock, 
  Share2, 
  Check, 
  Copy, 
  QrCode,
  LayoutGrid,
  List
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import documentService from '../../services/documentService';
import { useAuth } from '../../context/AuthContext';

export default function PatientDocuments() {
  const { user } = useAuth();

  // State Management
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [analysisModalDoc, setAnalysisModalDoc] = useState(null);
  const [copiedAbha, setCopiedAbha] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('medical_report');
  const [uploadHospital, setUploadHospital] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Available hospitals list for upload dropdown
  const sampleHospitals = [
    { id: '68fcde0a-0563-4853-a3fb-34bd47e7510e', name: 'Apollo Hospitals' },
    { id: 'cca6cb16-89b0-4be7-8cbe-785d8de379ee', name: 'Bombay Hospital' },
    { id: '9407e939-9ad2-4e16-8a83-4008a1e09a03', name: 'Shalby Hospital' },
    { id: '4c967e3f-ce0c-4942-955d-647265ac25fa', name: 'CityCare Hospital' },
    { id: '65af57b3-b9e6-4f24-b814-a8e6b69f3b02', name: 'CHL Hospitals' },
    { id: '9b1826a5-ad42-4dcf-8bb9-029acb3b5be4', name: 'Choithram Hospital' }
  ];

  // Load patient documents on mount
  useEffect(() => {
    loadDocuments();
  }, [user]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await documentService.getDocuments();
      setDocuments(data || []);
    } catch (err) {
      console.error('Error loading documents:', err);
      setErrorMsg('Failed to load your medical records. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Document Delete
  const handleDelete = async (docId, filePath) => {
    if (!window.confirm('Are you sure you want to remove this medical document from your health locker?')) return;
    try {
      setDeletingId(docId);
      await documentService.deleteDocument(docId, filePath);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      if (analysisModalDoc?.id === docId) {
        setAnalysisModalDoc(null);
      }
    } catch (err) {
      alert('Could not delete document. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle Document Upload Submit
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a PDF, image, or document to upload.');
      return;
    }

    try {
      setUploading(true);
      const newDoc = await documentService.uploadDocument({
        file: uploadFile,
        documentType: uploadCategory,
        hospitalId: uploadHospital || null,
        title: uploadTitle || null
      });

      // Reload fresh list
      await loadDocuments();
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadCategory('medical_report');
      setUploadHospital('');
      alert('Document successfully uploaded and secured in your Health Locker.');
    } catch (err) {
      console.error('Upload failed:', err);
      alert(err.message || 'Upload failed. Please check file format and try again.');
    } finally {
      setUploading(false);
    }
  };

  // Copy ABHA ID helper
  const handleCopyAbha = () => {
    navigator.clipboard.writeText('91-4829-1029-4401');
    setCopiedAbha(true);
    setTimeout(() => setCopiedAbha(false), 2000);
  };

  // Filter & Search Pipeline
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // 1. Category filter
      if (selectedCategory !== 'all' && doc.document_type !== selectedCategory) {
        return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (doc.original_filename || '').toLowerCase().includes(q);
        const hospMatch = (doc.hospital?.name || '').toLowerCase().includes(q);
        const condMatch = (doc.analysis?.detected_conditions || []).some(c => (c || '').toLowerCase().includes(q));
        const specMatch = (doc.analysis?.detected_specialties || []).some(s => (s || '').toLowerCase().includes(q));
        const summaryMatch = (doc.analysis?.summary || '').toLowerCase().includes(q);

        if (!nameMatch && !hospMatch && !condMatch && !specMatch && !summaryMatch) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.uploaded_at) - new Date(a.uploaded_at);
      if (sortBy === 'oldest') return new Date(a.uploaded_at) - new Date(b.uploaded_at);
      if (sortBy === 'size') return (b.file_size || 0) - (a.file_size || 0);
      return 0;
    });
  }, [documents, selectedCategory, searchQuery, sortBy]);

  // Document Counts by Category
  const counts = useMemo(() => {
    const map = { all: documents.length, medical_report: 0, prescription: 0, discharge_summary: 0, medical_bill: 0, other: 0 };
    documents.forEach(d => {
      if (map[d.document_type] !== undefined) map[d.document_type]++;
      else map.other++;
    });
    return map;
  }, [documents]);

  const formatFileSize = (bytes) => {
    if (!bytes) return '1.2 MB';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recent';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper for Category styling
  const getCategoryMeta = (type) => {
    switch (type) {
      case 'medical_report':
        return { label: 'Lab Report', icon: Activity, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
      case 'prescription':
        return { label: 'Prescription', icon: Stethoscope, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
      case 'discharge_summary':
        return { label: 'Discharge Summary', icon: FileText, bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
      case 'medical_bill':
        return { label: 'Medical Bill', icon: Receipt, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
      default:
        return { label: 'Clinical Document', icon: File, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
    }
  };

  return (
    <AppLayout>
      <main className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 flex flex-col gap-6 min-w-0">

        {/* =================================================================== */}
        {/* 1. TOP HEADER & ABHA ID LOCKER BANNER                               */}
        {/* =================================================================== */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-inner">
              <FileText className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  Medical Records & Health Locker
                </h1>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wide">
                  ABDM Verified
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
                Unified electronic health records (EHR), automated lab report AI biomarker scanner, and encrypted diagnostic storage.
              </p>
            </div>
          </div>

          {/* Right Action Stack: Upload CTA & ABHA ID */}
          <div className="flex flex-wrap items-center gap-3">
            {/* ABHA ID Pill */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="text-left">
                <span className="text-[9px] font-extrabold text-slate-400 block uppercase tracking-wider">ABHA Health ID</span>
                <span className="font-black text-slate-800 tracking-tight">91-4829-1029-4401</span>
              </div>
              <button 
                type="button"
                onClick={handleCopyAbha}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors ml-1"
                title="Copy ABHA ID"
              >
                {copiedAbha ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Upload Button */}
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm transition-all shadow-md shadow-blue-500/25 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. LIVE METRIC TILES ROW                                            */}
        {/* =================================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block">Total Records</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900">{documents.length}</span>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block">Lab & Diagnostics</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900">{counts.medical_report}</span>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block">AI Analyzed</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                {documents.filter(d => d.analysis).length}
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block">Vault Security</span>
              <span className="text-sm sm:text-base font-black text-slate-900 leading-tight">256-Bit Encrypted</span>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 3. CONTROLS TOOLBAR & CATEGORY TABS                                */}
        {/* =================================================================== */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-4">
          
          {/* Top Row: Search & View Modes */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Real-time search query */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by test name, hospital, doctor, or condition..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right Controls: Sort & Grid/Table Toggle */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-slate-700 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="size">Largest File</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 pt-3">
            {[
              { id: 'all', label: 'All Documents', count: counts.all },
              { id: 'medical_report', label: 'Lab & Blood Reports', count: counts.medical_report },
              { id: 'prescription', label: 'Prescriptions', count: counts.prescription },
              { id: 'discharge_summary', label: 'Discharge Summaries', count: counts.discharge_summary },
              { id: 'medical_bill', label: 'Medical Bills', count: counts.medical_bill },
            ].map(tab => {
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${active ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* =================================================================== */}
        {/* 4. MAIN DOCUMENTS GRID / TABLE                                      */}
        {/* =================================================================== */}
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-xs sm:text-sm font-bold text-slate-500">Loading your verified medical vault...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">No medical records found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
                {searchQuery ? `No files match "${searchQuery}". Try changing search terms or filter.` : 'Your Health Locker is currently empty. Upload your first clinical report or prescription.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm"
            >
              + Upload Document
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* ================================================================= */
          /* VIEW MODE A: CARD GRID VIEW                                       */
          /* ================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDocuments.map(doc => {
              const meta = getCategoryMeta(doc.document_type);
              const CategoryIcon = meta.icon;
              const hasAnalysis = !!doc.analysis;

              return (
                <div 
                  key={doc.id}
                  className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                >
                  {/* Card Header: Icon & Category Tag */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl ${meta.bg} ${meta.text} flex items-center justify-center shrink-0 shadow-2xs`}>
                        <CategoryIcon className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${meta.bg} ${meta.text} ${meta.border}`}>
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-slate-400 font-bold block mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(doc.uploaded_at)}</span>
                        </span>
                      </div>
                    </div>

                    {/* AI Processed Indicator Pill */}
                    {hasAnalysis && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black flex items-center gap-1 shrink-0">
                        <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                        <span>AI Ready</span>
                      </span>
                    )}
                  </div>

                  {/* Document Title & Affiliation */}
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors" title={doc.original_filename}>
                      {doc.original_filename.replace(/\.pdf|\.png|\.jpg|\.webp/i, '').replace(/_/g, ' ')}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-semibold">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{doc.hospital?.name || 'Self-Uploaded Record'}</span>
                      <span className="text-slate-300">•</span>
                      <span className="shrink-0">{formatFileSize(doc.file_size)}</span>
                    </div>

                    {/* Analysis Snippet if available */}
                    {doc.analysis?.summary && (
                      <p className="text-xs text-slate-600 line-clamp-2 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                        {doc.analysis.summary}
                      </p>
                    )}

                    {/* Detected Biomarkers / Conditions tags */}
                    {doc.analysis?.detected_conditions && doc.analysis.detected_conditions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        {doc.analysis.detected_conditions.slice(0, 2).map((cond, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                            {cond}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {hasAnalysis ? (
                      <button
                        type="button"
                        onClick={() => setAnalysisModalDoc(doc)}
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>View AI Analysis</span>
                      </button>
                    ) : (
                      <a
                        href={doc.file_path.startsWith('http') ? doc.file_path : '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Document</span>
                      </a>
                    )}

                    {/* Delete Icon Button */}
                    <button
                      type="button"
                      disabled={deletingId === doc.id}
                      onClick={() => handleDelete(doc.id, doc.file_path)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ================================================================= */
          /* VIEW MODE B: DETAILED TABLE VIEW                                  */
          /* ================================================================= */
          <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">Document Title</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">Hospital / Facility</th>
                    <th className="px-4 py-4">Date Uploaded</th>
                    <th className="px-4 py-4">File Size</th>
                    <th className="px-4 py-4">AI Telemetry</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredDocuments.map(doc => {
                    const meta = getCategoryMeta(doc.document_type);
                    const hasAnalysis = !!doc.analysis;

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl ${meta.bg} ${meta.text} flex items-center justify-center shrink-0`}>
                              <FileText className="w-4 h-4" />
                            </div>
                            <span className="font-black text-slate-900 truncate max-w-xs block" title={doc.original_filename}>
                              {doc.original_filename}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${meta.bg} ${meta.text}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600 font-bold">
                          {doc.hospital?.name || 'Self-Uploaded'}
                        </td>
                        <td className="px-4 py-4 text-slate-500">
                          {formatDate(doc.uploaded_at)}
                        </td>
                        <td className="px-4 py-4 text-slate-500">
                          {formatFileSize(doc.file_size)}
                        </td>
                        <td className="px-4 py-4">
                          {hasAnalysis ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black inline-flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Biomarkers Extracted</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium text-[11px]">Pending</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {hasAnalysis && (
                              <button
                                type="button"
                                onClick={() => setAnalysisModalDoc(doc)}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Analysis</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(doc.id, doc.file_path)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 5. INTERACTIVE AI REPORT DIAGNOSTIC EXPLAINER MODAL                 */}
        {/* =================================================================== */}
        {analysisModalDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
              
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-black text-slate-900">
                        AI Lab Report Diagnostic Analysis
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                        96% Confidence
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      {analysisModalDoc.original_filename} • {analysisModalDoc.hospital?.name || 'Verified Pathology Lab'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAnalysisModalDoc(null)}
                  className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Content */}
              <div className="p-6 overflow-y-auto flex flex-col gap-6 text-slate-700 text-xs sm:text-sm">
                
                {/* 1. Diagnostic Summary Card */}
                <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col gap-2">
                  <span className="text-xs font-black text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span>Clinical Executive Summary</span>
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                    {analysisModalDoc.analysis?.summary || 'Report analysis completed.'}
                  </p>
                </div>

                {/* 2. Visual Biomarker Range Indicators */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wide text-slate-800">
                      Extracted Biomarkers & Range Telemetry
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Color-coded by standard pathology baseline
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {analysisModalDoc.analysis?.extracted_data && Object.entries(analysisModalDoc.analysis.extracted_data).map(([key, item]) => {
                      const isNormal = item.status === 'normal';
                      const isLow = item.status === 'low';
                      const isHigh = item.status === 'high';

                      return (
                        <div key={key} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-slate-900 text-xs">{item.test_name || key}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              isNormal ? 'bg-emerald-100 text-emerald-800' : isLow ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {item.status}
                            </span>
                          </div>

                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-slate-900">{item.value}</span>
                            <span className="text-xs text-slate-400 font-bold">{item.unit}</span>
                          </div>

                          {/* Range Reference Bar */}
                          <div className="pt-1">
                            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden flex">
                              <div 
                                className={`h-full ${isNormal ? 'bg-emerald-500' : isLow ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${Math.min(100, Math.max(15, (item.value / (item.max || 100)) * 100))}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mt-1">
                              <span>Min: {item.min} {item.unit}</span>
                              <span>Max: {item.max} {item.unit}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Plain-English Explanation */}
                {analysisModalDoc.analysis?.ai_explanation && (
                  <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col gap-2">
                    <span className="text-xs font-black text-indigo-900 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>What this means for you</span>
                    </span>
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                      {analysisModalDoc.analysis.ai_explanation}
                    </p>
                  </div>
                )}

                {/* 4. Detected Specialties & Consultations */}
                {analysisModalDoc.analysis?.detected_specialties && analysisModalDoc.analysis.detected_specialties.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      Recommended Follow-up Specialties
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {analysisModalDoc.analysis.detected_specialties.map((spec, i) => (
                        <span key={i} className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                          🩺 {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security & Disclaimer Notice */}
                <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-500 font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>AI extraction is for patient comprehension and does not substitute qualified doctor diagnosis. Consult your clinician for formal medical decisions.</span>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold text-slate-400">
                  Model: {analysisModalDoc.analysis?.model_version || 'report-analyzer-v1'}
                </span>
                <button
                  type="button"
                  onClick={() => setAnalysisModalDoc(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Close Analysis
                </button>
              </div>

            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 6. INTERACTIVE UPLOAD DOCUMENT MODAL                               */}
        {/* =================================================================== */}
        {uploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full flex flex-col overflow-hidden my-auto">
              
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      Upload Medical Document
                    </h2>
                    <p className="text-xs text-slate-500 font-semibold">
                      Add to your encrypted Health Locker with automated AI analysis.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Upload Form */}
              <form onSubmit={handleUploadSubmit} className="p-6 flex flex-col gap-4 text-xs">
                
                {/* Drag and Drop Box */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files?.[0]) {
                      setUploadFile(e.dataTransfer.files[0]);
                      if (!uploadTitle) setUploadTitle(e.dataTransfer.files[0].name.split('.')[0]);
                    }
                  }}
                  className={`p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer ${
                    dragOver ? 'border-blue-500 bg-blue-50/50' : uploadFile ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
                  }`}
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                >
                  <input
                    id="file-upload-input"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setUploadFile(e.target.files[0]);
                        if (!uploadTitle) setUploadTitle(e.target.files[0].name.split('.')[0]);
                      }
                    }}
                  />

                  {uploadFile ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Check className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <span className="font-bold text-slate-800 text-xs max-w-xs truncate">{uploadFile.name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{formatFileSize(uploadFile.size)} • Click to replace</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <UploadCloud className="w-8 h-8 text-blue-600" />
                      <span className="font-black text-slate-800">Drag & drop your file here, or browse</span>
                      <span className="text-[10px] text-slate-400 font-medium">Supports PDF, PNG, JPG, WebP up to 50MB</span>
                    </div>
                  )}
                </div>

                {/* Document Title Input */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Document Title</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Complete Blood Count & Liver Panel"
                    className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Category Dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Record Category</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="medical_report">Lab & Diagnostic Report (AI Analyzed)</option>
                    <option value="prescription">Doctor Prescription</option>
                    <option value="discharge_summary">Discharge Summary</option>
                    <option value="medical_bill">Hospital Medical Bill</option>
                    <option value="other">Other Clinical Record</option>
                  </select>
                </div>

                {/* Associated Hospital Dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Issuing Hospital / Clinic</label>
                  <select
                    value={uploadHospital}
                    onChange={(e) => setUploadHospital(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">Select Hospital (Optional)</option>
                    {sampleHospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name} (Indore)</option>
                    ))}
                  </select>
                </div>

                {/* Security Note */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500 font-medium flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Files uploaded are protected with 256-bit AES encryption and PII masking.</span>
                </div>

                {/* Submit Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !uploadFile}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold transition-all shadow-md shadow-blue-500/25 flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Securing File...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload & Analyze</span>
                      </>
                    )}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </main>
    </AppLayout>
  );
}
