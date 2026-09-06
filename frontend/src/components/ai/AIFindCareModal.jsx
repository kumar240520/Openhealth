import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  MessageSquare, 
  Mic, 
  MicOff, 
  UploadCloud, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  Heart, 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight,
  RefreshCw, 
  FileText,
  Sparkles,
  Brain,
  Activity,
  Eye,
  ShieldAlert,
  AlertTriangle,
  Stethoscope,
  Star,
  Building2,
  UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import aiService from '../../services/aiService';
import reportService from '../../services/reportService';

export default function AIFindCareModal({ isOpen, onClose, initialMode = 'menu' }) {
  const navigate = useNavigate();

  // Navigation / View State: 'menu' | 'analysis' | 'dept_list' | 'upload_report'
  const [currentView, setCurrentView] = useState('menu');
  
  // Intake Inputs
  const [symptoms, setSymptoms] = useState('');
  const [voiceActive, setVoiceActive] = useState(false);
  const [attachedReport, setAttachedReport] = useState(null);
  
  // Reports Vault Data
  const [pastReports, setPastReports] = useState([]);

  // AI State
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiData, setAiData] = useState(null);

  // Web Speech API Ref
  const recognitionRef = useRef(null);
  const userWantsVoiceRef = useRef(false);
  const baseTextRef = useRef('');

  // Predefined Departments (Matching standard clinical specialties)
  const departments = [
    { name: 'Neurology', label: 'Neurology (Brain & Nerves)', desc: 'Headaches, migraines, neck nerve pain, stroke, seizures, dizziness', query: 'Neurology' },
    { name: 'Orthopedics', label: 'Orthopedics (Bones, Joints & Spine)', desc: 'Neck pain, joint stiffness, arthritis, bone fractures, knee swelling', query: 'Orthopedics' },
    { name: 'Cardiology', label: 'Cardiology (Heart & Chest)', desc: 'Heart conditions, chest pain, palpitations, shortness of breath', query: 'Cardiology' },
    { name: 'Gastroenterology', label: 'Gastroenterology (Stomach & Liver)', desc: 'Acid reflux, digestive issues, stomach ache, nausea, liver care', query: 'Gastroenterology' },
    { name: 'General Medicine', label: 'General Medicine (Physician)', desc: 'Fever, cough, viral infections, weakness, diabetes & vitals', query: 'General Medicine' },
    { name: 'Dermatology', label: 'Dermatology (Skin & Hair)', desc: 'Skin rashes, allergies, itching, acne, fungal conditions', query: 'Dermatology' },
    { name: 'Ophthalmology', label: 'Ophthalmology (Eye Care)', desc: 'Vision problems, cataract, eye strain, redness, dry eyes', query: 'Ophthalmology' },
    { name: 'ENT', label: 'ENT (Ear, Nose & Throat)', desc: 'Ear pain, throat soreness, sinus pressure, tonsillitis', query: 'ENT' },
    { name: 'Pediatrics', label: 'Pediatrics (Child Care)', desc: 'Infant care, childhood illnesses, vaccinations, growth', query: 'Pediatrics' },
    { name: 'Obstetrics & Gynecology', label: 'Obstetrics & Gynecology (Women Health)', desc: 'Pregnancy care, menstrual issues, pelvic pain, maternal health', query: 'Gynecology' }
  ];

  // Reset all state when opening fresh or closing
  const resetFormState = () => {
    setSymptoms('');
    setAiData(null);
    setAttachedReport(null);
    setLoadingAI(false);
    baseTextRef.current = '';
    userWantsVoiceRef.current = false;
  };

  const handleClose = () => {
    stopVoiceRecognition();
    resetFormState();
    onClose();
  };

  // Set initial view on open & reset state for a clean assessment
  useEffect(() => {
    if (isOpen) {
      resetFormState();
      loadVaultReports();
      if (initialMode === 'voice') {
        setCurrentView('analysis');
        startVoiceRecognition();
      } else if (initialMode === 'input') {
        setCurrentView('analysis');
      } else {
        setCurrentView('menu');
      }
    } else {
      stopVoiceRecognition();
      resetFormState();
    }
  }, [isOpen, initialMode]);

  // Load patient medical reports from vault
  const loadVaultReports = async () => {
    try {
      const repData = await reportService.getReportsDashboardData().catch(() => null);
      if (repData?.uploadedReports) {
        setPastReports(repData.uploadedReports);
      }
    } catch (err) {
      console.warn('Error loading reports in modal:', err);
    }
  };

  // Web Speech API Initialization
  const startVoiceRecognition = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Speech recognition is not supported in this browser. Please type your symptoms.');
        return;
      }

      baseTextRef.current = symptoms.trim();
      userWantsVoiceRef.current = true;

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onresult = (event) => {
        let sessionTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          sessionTranscript += event.results[i][0].transcript + ' ';
        }
        const trimmed = sessionTranscript.trim();
        const combined = baseTextRef.current ? `${baseTextRef.current} ${trimmed}` : trimmed;
        setSymptoms(combined);
      };

      recognition.onerror = (err) => {
        console.warn('Voice recognition notice:', err);
        if (err.error === 'not-allowed' || err.error === 'service-not-allowed') {
          userWantsVoiceRef.current = false;
          setVoiceActive(false);
        }
      };

      recognition.onend = () => {
        // If user is still speaking and has not clicked stop or submit, restart to avoid short silence cutoffs
        if (userWantsVoiceRef.current) {
          try {
            recognition.start();
          } catch (e) {
            setVoiceActive(false);
            userWantsVoiceRef.current = false;
          }
        } else {
          setVoiceActive(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setVoiceActive(true);
    } catch (e) {
      console.warn('Voice recognition initialization notice:', e);
      setVoiceActive(false);
      userWantsVoiceRef.current = false;
    }
  };

  const stopVoiceRecognition = () => {
    userWantsVoiceRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setVoiceActive(false);
  };

  const toggleVoice = () => {
    if (voiceActive) stopVoiceRecognition();
    else startVoiceRecognition();
  };

  // Central AI Analysis Execution (ONLY executed when user clicks Find Care button)
  const executeAnalysis = async (inputSymptoms = symptoms, report = attachedReport) => {
    if (!inputSymptoms && !report) return;

    try {
      setLoadingAI(true);
      if (voiceActive) stopVoiceRecognition();

      const res = await aiService.runRecommendation({
        symptoms: inputSymptoms || (report ? `Analyze diagnostic lab report: ${report.report_title || report.original_filename}` : 'Clinical assessment'),
        reportIds: report ? [report.id] : []
      });

      setAiData(res);
    } catch (err) {
      console.error('AI Care Analysis error:', err);
    } finally {
      setLoadingAI(false);
    }
  };

  // Derived Department & Specialty
  const recommendedSpecialty = useMemo(() => {
    if (aiData?.recommended_specialties?.[0]) {
      return aiData.recommended_specialties[0];
    }
    return '';
  }, [aiData]);

  const recommendedDepartment = useMemo(() => {
    if (!recommendedSpecialty) return 'Specialist Care Department';
    const spec = recommendedSpecialty.toLowerCase();
    if (spec.includes('neuro') || spec.includes('headache') || spec.includes('brain')) return 'Neurology (Brain, Nerves & Spine)';
    if (spec.includes('ortho') || spec.includes('bone') || spec.includes('joint') || spec.includes('knee') || spec.includes('neck')) return 'Orthopedics (Bones, Joints & Spine)';
    if (spec.includes('cardio') || spec.includes('heart')) return 'Cardiology (Heart & Vascular)';
    if (spec.includes('gastro') || spec.includes('stomach') || spec.includes('liver') || spec.includes('digest')) return 'Gastroenterology (Stomach & Liver)';
    if (spec.includes('derma') || spec.includes('skin')) return 'Dermatology (Skin & Hair)';
    if (spec.includes('ophthal') || spec.includes('eye') || spec.includes('vision')) return 'Ophthalmology (Eye Care)';
    if (spec.includes('ent') || spec.includes('ear') || spec.includes('throat')) return 'ENT (Ear, Nose & Throat)';
    if (spec.includes('pulmo') || spec.includes('chest') || spec.includes('lung')) return 'Pulmonology (Lungs & Respiratory)';
    if (spec.includes('pediatr') || spec.includes('child')) return 'Pediatrics (Child Care)';
    if (spec.includes('gynec') || spec.includes('obstet') || spec.includes('women')) return 'Obstetrics & Gynecology (Women Health)';
    if (spec.includes('emergency')) return 'Emergency Medicine (Urgent Care)';
    if (spec.includes('endocrin') || spec.includes('diabet')) return 'Endocrinology & Diabetology';
    return `${recommendedSpecialty} Department`;
  }, [recommendedSpecialty]);

  const recommendedDescription = useMemo(() => {
    if (aiData?.plain_explanation) return aiData.plain_explanation;
    if (recommendedDepartment.includes('Neuro')) return 'Specializes in headaches, migraines, cervical spine nerve pathways, dizziness, and nerve conditions.';
    if (recommendedDepartment.includes('Ortho')) return 'Specializes in cervical alignment, bones, joints, spine, arthritis, and musculoskeletal recovery.';
    if (recommendedDepartment.includes('Cardio')) return 'Specializes in heart, coronary circulation, blood pressure, and cardiovascular conditions.';
    if (recommendedDepartment.includes('Gastro')) return 'Specializes in digestion, acid reflux, stomach irritation, intestinal health, and liver care.';
    if (recommendedDepartment.includes('Derma')) return 'Specializes in skin inflammation, rashes, allergic reactions, and epidermal recovery.';
    if (recommendedDepartment.includes('Ophthal')) return 'Specializes in visual acuity, corneal health, eye strain, and refractive care.';
    return 'This department provides specialized clinical care for your diagnosed symptoms.';
  }, [aiData, recommendedDepartment]);

  // Dynamic Specialty Icon Helper
  const getDepartmentIcon = (specName) => {
    const s = (specName || '').toLowerCase();
    if (s.includes('neuro') || s.includes('headache') || s.includes('brain')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0 shadow-2xs">
          <Brain className="w-5 h-5" />
        </div>
      );
    }
    if (s.includes('ortho') || s.includes('bone') || s.includes('joint') || s.includes('knee') || s.includes('neck')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0 shadow-2xs">
          <Activity className="w-5 h-5" />
        </div>
      );
    }
    if (s.includes('cardio') || s.includes('heart')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 shadow-2xs">
          <Heart className="w-5 h-5 fill-rose-500" />
        </div>
      );
    }
    if (s.includes('gastro') || s.includes('stomach') || s.includes('liver') || s.includes('digest')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
          <ShieldAlert className="w-5 h-5" />
        </div>
      );
    }
    if (s.includes('derma') || s.includes('skin')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-700 border border-pink-200 flex items-center justify-center shrink-0 shadow-2xs">
          <Sparkles className="w-5 h-5" />
        </div>
      );
    }
    if (s.includes('ophthal') || s.includes('eye') || s.includes('vision')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-700 border border-cyan-200 flex items-center justify-center shrink-0 shadow-2xs">
          <Eye className="w-5 h-5" />
        </div>
      );
    }
    if (s.includes('emergency')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 border border-red-200 flex items-center justify-center shrink-0 shadow-2xs">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
        <Stethoscope className="w-5 h-5" />
      </div>
    );
  };

  // Redirect to Hospitals Marketplace with filtered specialty
  const handleRedirectToHospitals = (specialty) => {
    handleClose();
    const cleanSpec = (specialty || '').split('(')[0].trim();
    navigate(`/app/hospitals?specialty=${encodeURIComponent(cleanSpec)}&city=Indore`);
  };

  const handleRedirectToDoctors = (specialty, doctorName = '') => {
    handleClose();
    const cleanSpec = (specialty || '').split('(')[0].trim();
    if (doctorName) {
      navigate(`/app/doctors?search=${encodeURIComponent(doctorName)}`);
    } else {
      navigate(`/app/doctors?specialty=${encodeURIComponent(cleanSpec)}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in select-none">
      
      {/* Modal Container */}
      <div className="bg-white rounded-[28px] border border-slate-200/90 shadow-2xl max-w-[580px] w-full flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* =================================================================== */}
        {/* VIEW 1: "SEARCH YOUR DEPARTMENT" (EXACT MATCH REFERENCE IMAGE 2)    */}
        {/* =================================================================== */}
        {currentView === 'menu' && (
          <div className="p-6 sm:p-7 flex flex-col gap-5 overflow-y-auto">
            
            {/* Header with Search Icon & Close */}
            <div className="flex items-start justify-between relative">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100/80 shadow-2xs">
                <Search className="w-5 h-5 stroke-[2.5]" />
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer absolute right-0 top-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Search Your Department
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-1 max-w-md mx-auto">
                To help us show the right hospitals, doctors and services for you, please complete the steps below.
              </p>
            </div>

            {/* 4 Options List (Matching Reference Image 2 pixel-for-pixel) */}
            <div className="flex flex-col gap-2.5 pt-1">
              
              {/* Option 1: Search Your Department */}
              <div
                onClick={() => setCurrentView('dept_list')}
                className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 hover:border-blue-500 hover:bg-blue-50/20 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <Search className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-[13px] text-slate-900 group-hover:text-blue-600 transition-colors">
                      Search Your Department
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Find the right department for your health concern.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Option 2: Enter Your Symptoms */}
              <div
                onClick={() => setCurrentView('analysis')}
                className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <MessageSquare className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-[13px] text-slate-900 group-hover:text-emerald-600 transition-colors">
                      Enter Your Symptoms
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Type your symptoms to help us understand your issue.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Option 3: Tell Your Symptoms Through Voice */}
              <div
                onClick={() => {
                  setCurrentView('analysis');
                  startVoiceRecognition();
                }}
                className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 hover:border-purple-500 hover:bg-purple-50/20 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                    <Mic className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-[13px] text-slate-900 group-hover:text-purple-600 transition-colors">
                      Tell Your Symptoms Through Voice
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Use your voice to describe your symptoms.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Option 4: Upload Your Previous Report */}
              <div
                onClick={() => setCurrentView('upload_report')}
                className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 hover:border-amber-500 hover:bg-amber-50/20 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                    <UploadCloud className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-[13px] text-slate-900 group-hover:text-amber-600 transition-colors">
                      Upload Your Previous Report
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Upload your previous medical report for better assistance.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

            </div>

            {/* Footer Assurance */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400 pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Your information is secure and confidential.</span>
            </div>

          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 2: DEPARTMENT SELECTOR (OPTION 1)                              */}
        {/* =================================================================== */}
        {currentView === 'dept_list' && (
          <div className="p-6 flex flex-col gap-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <button 
                type="button" 
                onClick={() => setCurrentView('menu')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <h3 className="font-extrabold text-sm text-slate-900">Choose Medical Department</h3>
              <button type="button" onClick={handleClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {departments.map((dept, i) => (
                <div
                  key={i}
                  onClick={() => handleRedirectToHospitals(dept.query)}
                  className="p-3.5 rounded-2xl border border-slate-200/90 hover:border-blue-500 hover:bg-blue-50/20 transition-all flex flex-col gap-1 cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-slate-900 group-hover:text-blue-600 transition-colors">{dept.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium line-clamp-2">{dept.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 3: UPLOAD REPORT (OPTION 4)                                    */}
        {/* =================================================================== */}
        {currentView === 'upload_report' && (
          <div className="p-6 flex flex-col gap-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <button 
                type="button" 
                onClick={() => setCurrentView('menu')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <h3 className="font-extrabold text-sm text-slate-900">Select or Upload Medical Report</h3>
              <button type="button" onClick={handleClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reports on file */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-600">Select report from your medical vault:</span>
              <div className="flex flex-col gap-2">
                {pastReports.slice(0, 4).map(report => (
                  <div
                    key={report.id}
                    onClick={() => {
                      setAttachedReport(report);
                      setCurrentView('analysis');
                      executeAnalysis(`Analyze medical diagnostic report: ${report.report_title || report.original_filename}`, report);
                    }}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all flex items-center justify-between cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">{report.report_title || report.original_filename}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{report.category_tag || 'Laboratory'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Analyze Report →
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Local File Upload Drop Zone */}
            <label className="p-5 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl bg-slate-50 flex flex-col items-center justify-center cursor-pointer text-center transition-all">
              <input 
                type="file" 
                accept=".pdf,.png,.jpg" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const newRep = { id: `file-${Date.now()}`, report_title: file.name, category_tag: 'Uploaded Report' };
                    setAttachedReport(newRep);
                    setCurrentView('analysis');
                    executeAnalysis(`Analyze uploaded medical report: ${file.name}`, newRep);
                  }
                }}
              />
              <UploadCloud className="w-6 h-6 text-blue-600 mb-1" />
              <span className="text-xs font-bold text-slate-800">Upload new report file (PDF, JPG)</span>
              <span className="text-[10px] text-slate-400">Extracted & analyzed by Google Gemini 3.6</span>
            </label>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 4: "FIND CARE BASED ON YOUR SYMPTOMS" (EXACT MATCH IMAGE 1)     */}
        {/* =================================================================== */}
        {currentView === 'analysis' && (
          <div className="p-6 sm:p-7 flex flex-col gap-4 overflow-y-auto">
            
            {/* Header with Search Icon in Circle & Close Button */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentView('menu')}
                  title="Change Intake Method"
                  className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center shrink-0 cursor-pointer border border-blue-100/80 shadow-2xs"
                >
                  <Search className="w-5 h-5 stroke-[2.5]" />
                </button>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Find Care Based on Your Symptoms
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Tell us your symptoms and we'll guide you to the right department and best hospitals.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. "Describe Your Symptoms" Card (Matching Image 1 pixel-for-pixel) */}
            <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">
                  Describe Your Symptoms
                </span>
                <div className="flex items-center gap-2">
                  {symptoms && (
                    <button
                      type="button"
                      onClick={() => {
                        setSymptoms('');
                        baseTextRef.current = '';
                        setAiData(null);
                      }}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer underline transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  {voiceActive && (
                    <span className="text-[10px] font-black text-rose-600 animate-pulse flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>Listening to your voice...</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="relative flex items-center">
                <MessageSquare className="w-4 h-4 text-blue-500 absolute left-3 top-3.5" />
                
                <textarea
                  rows={2}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (symptoms.trim() || attachedReport) {
                        if (voiceActive) stopVoiceRecognition();
                        executeAnalysis(symptoms, attachedReport);
                      }
                    }
                  }}
                  placeholder="Type your symptoms here (e.g., severe chest pain, fever since 2 days)..."
                  className="w-full pl-9 pr-12 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />

                {/* Microphone Button on Right */}
                <button
                  type="button"
                  onClick={toggleVoice}
                  title={voiceActive ? 'Stop voice recording' : 'Speak symptoms'}
                  className={`absolute right-2.5 top-2.5 p-1.5 rounded-xl transition-all cursor-pointer ${
                    voiceActive 
                      ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-300' 
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  {voiceActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              {/* Dismissable Attached Report Pill */}
              {attachedReport && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                    <FileText className="w-3 h-3 text-emerald-600" />
                    <span>{attachedReport.report_title || 'Report Attached'}</span>
                    <X className="w-3 h-3 hover:text-emerald-950 cursor-pointer" onClick={() => setAttachedReport(null)} />
                  </span>
                </div>
              )}

              {/* Explicit Submit Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                <span className="text-[11px] font-semibold text-slate-500">
                  {voiceActive ? (
                    <span className="text-purple-700 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      Listening to speech... Speak all symptoms, then click Find Care
                    </span>
                  ) : (
                    'Type or speak, then click Find Care'
                  )}
                </span>

                <button
                  type="button"
                  disabled={loadingAI || (!symptoms.trim() && !attachedReport)}
                  onClick={() => {
                    if (voiceActive) stopVoiceRecognition();
                    executeAnalysis(symptoms, attachedReport);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm transition-all cursor-pointer hover:scale-102 active:scale-98"
                >
                  {loadingAI ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                      <span>Find Care →</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 2. Loading State Indicator */}
            {loadingAI && (
              <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 flex items-center gap-3 animate-pulse">
                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
                <span className="text-xs font-bold text-indigo-900">
                  Analyzing symptoms and matching the right department in Indore...
                </span>
              </div>
            )}

            {/* 3. Real Dynamic AI Diagnostic Recommendation Card */}
            {aiData && !loadingAI && (
              <div className="flex flex-col gap-3">
                {/* Main Department Recommendation Card */}
                <div 
                  className="p-4 sm:p-5 rounded-2xl border border-emerald-200/90 bg-emerald-50/50 hover:bg-emerald-50 transition-all flex flex-col gap-3 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[11px] font-extrabold text-emerald-800">
                            Based on your symptoms, you should consult:
                          </span>
                          {aiData.triage_level && (
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              aiData.triage_level === 'emergency' 
                                ? 'bg-red-100 text-red-700 border border-red-200' 
                                : aiData.triage_level === 'urgent' 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {aiData.triage_level} {aiData.triage_urgency_score ? `(${aiData.triage_urgency_score}/100)` : ''}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                          {recommendedDepartment}
                        </h3>
                        <p className="text-[11px] text-slate-600 font-medium mt-1 leading-relaxed">
                          {recommendedDescription}
                        </p>

                        {/* Suspected Conditions Pills */}
                        {Array.isArray(aiData.suspected_conditions) && aiData.suspected_conditions.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-2">
                            <span className="text-[10px] font-bold text-slate-500">Suspected:</span>
                            {aiData.suspected_conditions.slice(0, 2).map((sc, i) => (
                              <span key={i} className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                                {sc.condition} {sc.probability ? `(${sc.probability}%)` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dynamic Specialty Icon (Neurology = Brain, Ortho = Bone/Activity, Cardio = Heart, etc.) */}
                    {getDepartmentIcon(recommendedSpecialty)}
                  </div>
                </div>

                {/* Top Empanelled Specialists in Indore from Database */}
                {Array.isArray(aiData.matched_doctors) && aiData.matched_doctors.length > 0 && (
                  <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        <span>Empanelled Specialists for {recommendedSpecialty}:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRedirectToDoctors(recommendedSpecialty)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        View all →
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      {aiData.matched_doctors.slice(0, 2).map(doc => (
                        <div 
                          key={doc.id}
                          onClick={() => handleRedirectToDoctors(recommendedSpecialty, doc.name)}
                          className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/20 transition-all flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-100 shrink-0">
                              {doc.name.replace('Dr. ', '').charAt(0)}
                            </div>
                            <div className="truncate">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 block truncate">
                                {doc.name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium block truncate">
                                {doc.specialization} • {doc.hospitals?.name || 'Indore'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {doc.rating && (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                {Number(doc.rating).toFixed(1)}
                              </span>
                            )}
                            <span className="text-[10px] font-black text-blue-600 group-hover:underline">
                              Book →
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct Action Button */}
                <button
                  type="button"
                  onClick={() => handleRedirectToHospitals(recommendedSpecialty)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:scale-101 active:scale-99"
                >
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>Explore All {recommendedSpecialty || 'Indore'} Hospitals & Departments</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Footer Assurance */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400 pt-1 border-t border-slate-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Your information is secure and confidential.</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
