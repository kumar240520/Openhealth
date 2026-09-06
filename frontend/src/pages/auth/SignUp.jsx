import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Building2, 
  ShieldCheck, 
  ArrowLeft,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import { supabase } from '../../lib/supabaseClient';
import { getRoleDashboardPath } from '../../components/auth/ProtectedRoute';
import SpecularButton from '../../components/ui/SpecularButton';
import BorderGlow from '../../components/ui/BorderGlow';

const accountTypes = [
  { id: 'patient', label: 'Patient', icon: User },
  { id: 'hospital', label: 'Hospital', icon: Building2 },
  { id: 'provider', label: 'Provider', icon: ShieldCheck },
];

export default function SignUp({ onNavigate }) {
  const navigate = useNavigate ? useNavigate() : null;
  const { signUpWithEmail, sendOtp, verifyOtp, checkEmailExists, checkPhoneExists, checkOrgNameConflict, refreshProfile } = useAuth();
  const hospitalContext = useHospital();
  const refreshHospital = hospitalContext?.refreshHospital;
  const [step, setStep] = useState(1); // 1: Form details, 2: OTP Verification, 3: Success
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState('patient');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    hospitalName: '',
    providerName: '',
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`signup-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`signup-otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      const focusIndex = Math.min(pastedData.length, 5);
      const targetInput = document.getElementById(`signup-otp-${focusIndex}`);
      if (targetInput) targetInput.focus();
    }
  };

  // Step 1 Submit -> Validates & Creates account via Supabase Auth
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Full Name Check
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }

    // 2. Email Validation
    const email = formData.email.trim();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    // 3. Mobile Number Validation
    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    // 4. Organization / Hospital Name Check
    if (accountType === 'hospital' && !formData.hospitalName.trim()) {
      setError('Please enter your Hospital or Clinic name.');
      return;
    }
    if (accountType === 'provider' && !formData.providerName.trim()) {
      setError('Please enter your Organization or Fleet name.');
      return;
    }

    // 5. Password Length Check
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      // 6. Organization & Hospital Duplicate/Similarity Check
      const orgNameToCheck = accountType === 'hospital' ? formData.hospitalName : accountType === 'provider' ? formData.providerName : null;
      if (orgNameToCheck) {
        const orgConflict = await checkOrgNameConflict(accountType, orgNameToCheck);
        if (orgConflict?.exists) {
          setLoading(false);
          setError(`A ${orgConflict.conflict_type || 'healthcare organization'} with the exact name ("${orgConflict.conflict_name}") is already registered. Please enter a unique name.`);
          return;
        }
      }

      // 7. Database Check: Email Duplication
      const emailRegistered = await checkEmailExists(email);
      if (emailRegistered) {
        setLoading(false);
        setError('This email is already registered in OpenHealth. Please log in instead.');
        return;
      }

      // 8. Database Check: Mobile Number Duplication
      const phoneRegistered = await checkPhoneExists(formData.phone);
      if (phoneRegistered) {
        setLoading(false);
        setError('This mobile number is already linked to an existing account. Please log in or use another number.');
        return;
      }

      // 9. Proceed with registration
      const roleMapping = {
        patient: 'patient',
        hospital: 'hospital_admin',
        provider: 'insurance_user',
      };

      const { data, error: signUpError } = await signUpWithEmail({
        email: email,
        password: formData.password,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        role: roleMapping[accountType] || 'patient',
        hospitalName: formData.hospitalName.trim(),
        providerName: formData.providerName.trim(),
      });

      setLoading(false);

      if (signUpError) {
        setError(signUpError.message || 'Failed to create account. Please try again.');
        return;
      }

      // Check if user already exists (identities is empty in Supabase)
      if (data?.user?.identities && data.user.identities.length === 0) {
        setError('This email is already registered in OpenHealth. Please log in instead.');
        return;
      }

      // If user is auto-confirmed with a session
      if (data?.session) {
        if (accountType === 'hospital' && formData.hospitalName) {
          try {
            const { data: provHosp } = await supabase.rpc('provision_hospital_account', {
              p_hospital_name: formData.hospitalName.trim(),
              p_city: 'Indore',
              p_phone: formData.phone.trim() || null
            });
            if (provHosp?.id) {
              localStorage.setItem('openhealth_active_hospital_id', provHosp.id);
            }
          } catch (provErr) {
            console.warn('Immediate provision warning:', provErr);
          }
        }
        try {
          if (refreshProfile) await refreshProfile();
          if (refreshHospital) await refreshHospital();
        } catch (refErr) {
          console.warn('Post-signup refresh warning:', refErr);
        }
        setStep(3);
      } else {
        // Confirmation required -> Transition directly to Step 2 OTP Verification
        setStep(2);
        setTimer(60);
        setCanResend(false);
      }
    } catch (err) {
      setLoading(false);
      setError(err?.message || 'An unexpected error occurred during signup. Please try again.');
    }
  };

  // Step 2 Submit -> Verifies OTP & Completes Registration
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('').trim();
    if (enteredOtp.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // Primary attempt: type 'signup' (token sent on email signup)
      const { data, error: verifyError } = await verifyOtp({
        email: formData.email.trim(),
        token: enteredOtp,
        type: 'signup',
      });

      if (verifyError) {
        // Fallback attempt: type 'email' (magic code OTP)
        const { data: fbData, error: fbError } = await verifyOtp({
          email: formData.email.trim(),
          token: enteredOtp,
          type: 'email',
        });
        setLoading(false);
        if (fbError) {
          const rawMsg = (verifyError?.message || fbError?.message || '').toLowerCase();
          if (rawMsg.includes('confirming user') || rawMsg.includes('invalid') || rawMsg.includes('expired')) {
            setError('Invalid or expired verification code. Please check your email or click "Resend Code".');
          } else {
            setError(verifyError?.message || fbError?.message || 'Invalid verification code. Please try again.');
          }
          return;
        }
      } else {
        setLoading(false);
      }

      // Provision hospital facility immediately upon verification
      if (accountType === 'hospital' && formData.hospitalName) {
        try {
          const { data: provHosp } = await supabase.rpc('provision_hospital_account', {
            p_hospital_name: formData.hospitalName.trim(),
            p_city: 'Indore',
            p_phone: formData.phone.trim() || null
          });
          if (provHosp?.id) {
            localStorage.setItem('openhealth_active_hospital_id', provHosp.id);
          }
        } catch (provErr) {
          console.warn('Post-verification provision warning:', provErr);
        }
      }

      try {
        if (refreshProfile) await refreshProfile();
        if (refreshHospital) await refreshHospital();
      } catch (refErr) {
        console.warn('Post-verification refresh warning:', refErr);
      }

      setStep(3);
    } catch (err) {
      setLoading(false);
      setError(err?.message || 'Failed to verify code. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setError('');
    setTimer(60);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email.trim(),
      });

      if (resendError) {
        // Fallback to signInWithOtp
        const { error: otpError } = await sendOtp({
          email: formData.email.trim(),
          shouldCreateUser: false,
        });
        if (otpError) {
          setError(resendError.message || otpError.message || 'Failed to resend verification code.');
        }
      }
    } catch (err) {
      setError(err?.message || 'Failed to resend verification code.');
    }
  };

  const goToDashboard = async () => {
    try {
      if (refreshProfile) await refreshProfile();
      if (refreshHospital) await refreshHospital();
    } catch (refErr) {
      console.warn('Pre-navigation refresh warning:', refErr);
    }

    const targetPath =
      accountType === 'hospital'
        ? '/hospital/onboarding'
        : accountType === 'provider'
        ? '/dashboard/provider'
        : '/patient/onboarding';

    if (navigate) {
      navigate(targetPath);
    } else if (onNavigate) {
      onNavigate('home');
    }
  };

  const goToLogin = () => {
    if (onNavigate) {
      onNavigate('login');
    } else if (navigate) {
      navigate('/login');
    }
  };

  const goToHome = () => {
    if (onNavigate) {
      onNavigate('home');
    } else if (navigate) {
      navigate('/');
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050814] flex items-center justify-center sm:justify-start px-4 sm:px-8 md:px-14 lg:px-20 py-10 select-none">
      {/* Background Image — Right side is 100% crystal clear */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <img
          src="/images/signup.jpeg"
          alt="OpenHealth Hospital Arrival"
          className="w-full h-full object-cover object-center filter brightness-100 contrast-[1.02]"
        />
        {/* Localized dark shading ONLY behind the form on the left */}
        <div className="absolute inset-y-0 left-0 w-full sm:w-[65%] md:w-[52%] lg:w-[45%] bg-gradient-to-r from-black/85 via-black/45 to-transparent z-[1]" />
      </div>

      {/* Top Floating Brand & Back to Home */}
      <header className="absolute top-6 left-6 sm:left-10 z-20 flex items-center gap-4">
        <button
          onClick={goToHome}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/55 hover:bg-black/80 border border-white/20 text-slate-200 hover:text-white text-xs font-semibold backdrop-blur-xl transition-all cursor-pointer shadow-lg hover:scale-105"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
          <span>Back to Home</span>
        </button>
      </header>

      {/* Left-Aligned Floating Frosted Glass Sign Up Card with BorderGlow */}
      <BorderGlow
        edgeSensitivity={32}
        glowColor="160 84 55"
        backgroundColor="rgba(8, 15, 30, 0.88)"
        borderRadius={30}
        glowRadius={42}
        glowIntensity={1.2}
        coneSpread={28}
        animated={true}
        colors={['#10b981', '#14b8a6', '#06b6d4']}
        className="relative z-10 w-full max-w-[440px] sm:max-w-[460px] p-6 sm:p-8 rounded-[28px] sm:rounded-[32px] backdrop-blur-2xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.75)] my-auto"
      >
        {/* STEP 1: Main Signup Form with Horizontal Tab Bar */}
        {step === 1 && (
          <div className="flex flex-col">
            {/* Card Title & Subtitle */}
            <div className="mb-5">
              <h1 className="text-2xl sm:text-[32px] font-extrabold text-white tracking-tight leading-tight">
                Create your{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]">
                  OpenHealth
                </span>{' '}
                account
              </h1>
              <p className="text-xs sm:text-[13px] text-slate-300/90 font-medium mt-1.5 leading-relaxed">
                Join us and take the first step towards better, transparent healthcare.
              </p>
            </div>

            {/* Error Feedback */}
            {error && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-semibold text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-3.5">
              {/* Horizontal Sliding Tab Bar for Account Type */}
              <div className="relative p-1 rounded-2xl bg-black/50 border border-white/15 flex items-center justify-between gap-1 mb-1">
                {accountTypes.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = accountType === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAccountType(tab.id)}
                      className={`relative flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 z-10 cursor-pointer ${
                        isActive
                          ? 'text-white bg-gradient-to-r from-emerald-500/40 via-teal-500/40 to-cyan-500/40 border border-emerald-400/60 shadow-[0_0_15px_rgba(52,211,153,0.35)]'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 relative z-10 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Full Name Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 group-focus-within:drop-shadow-[0_0_8px_rgba(52,211,153,0.6)] transition-all">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Full Name"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl input-focus-glow text-white placeholder-slate-400 text-xs sm:text-sm font-medium outline-none"
                />
              </div>

              {/* Email Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 group-focus-within:drop-shadow-[0_0_8px_rgba(52,211,153,0.6)] transition-all">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl input-focus-glow text-white placeholder-slate-400 text-xs sm:text-sm font-medium outline-none"
                />
              </div>

              {/* Phone Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 group-focus-within:drop-shadow-[0_0_8px_rgba(52,211,153,0.6)] transition-all">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Phone"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl input-focus-glow text-white placeholder-slate-400 text-xs sm:text-sm font-medium outline-none"
                />
              </div>

              {/* Password Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 group-focus-within:drop-shadow-[0_0_8px_rgba(52,211,153,0.6)] transition-all">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  className="w-full pl-10 pr-11 py-3 rounded-2xl input-focus-glow text-white placeholder-slate-400 text-xs sm:text-sm font-medium outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Dynamic Field for Hospital / Provider */}
              {accountType === 'hospital' && (
                <div className="flex flex-col gap-2 pt-0.5">
                  <input
                    type="text"
                    name="hospitalName"
                    required
                    value={formData.hospitalName}
                    onChange={handleInputChange}
                    placeholder="Hospital / Clinic Name"
                    className="w-full px-4 py-2.5 rounded-2xl input-focus-glow text-white placeholder-slate-400 text-xs font-medium outline-none"
                  />
                </div>
              )}

              {accountType === 'provider' && (
                <div className="flex flex-col gap-2 pt-0.5">
                  <input
                    type="text"
                    name="providerName"
                    required
                    value={formData.providerName}
                    onChange={handleInputChange}
                    placeholder="Fleet or Organization Name"
                    className="w-full px-4 py-2.5 rounded-2xl input-focus-glow text-white placeholder-slate-400 text-xs font-medium outline-none"
                  />
                </div>
              )}

              {/* Policy / Terms Agreement Box */}
              <div className="p-3 rounded-2xl bg-black/40 border border-white/10 policy-box-glow flex items-start gap-2.5 my-0.5">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  required
                  defaultChecked
                  className="mt-0.5 w-4 h-4 rounded border-white/20 text-emerald-500 focus:ring-emerald-400 focus:ring-offset-0 bg-black/60 cursor-pointer accent-emerald-500"
                />
                <label htmlFor="agreeTerms" className="text-[11px] text-slate-300 leading-snug cursor-pointer select-none">
                  I agree to OpenHealth's{' '}
                  <a href="#terms" className="text-emerald-400 font-bold hover:underline">Terms of Service</a>{' '}
                  and{' '}
                  <a href="#privacy" className="text-emerald-400 font-bold hover:underline">Privacy Policy</a>.
                </label>
              </div>

              {/* Submit Button with Specular Glow */}
              <SpecularButton
                type="submit"
                disabled={loading}
                size="md"
                radius={16}
                tint="#10b981"
                tintOpacity={0.95}
                textColor="#020617"
                lineColor="#6ee7b7"
                baseColor="#059669"
                intensity={1.2}
                shineSize={12}
                shineFade={45}
                thickness={1.5}
                followMouse
                proximity={200}
                className="w-full mt-1.5 py-3.5 px-6 font-black tracking-wide shadow-[0_10px_25px_rgba(16,185,129,0.4)] hover:shadow-[0_15px_35px_rgba(16,185,129,0.6)]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Create Account</span>
                )}
              </SpecularButton>

              {/* Footer Navigation Link */}
              <div className="text-center text-xs text-slate-300 mt-1 font-medium">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={goToLogin}
                  className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline cursor-pointer transition-colors"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: Required OTP Verification Step */}
        {step === 2 && (
          <div className="flex flex-col">
            <div className="mb-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-[28px] font-extrabold text-white tracking-tight leading-tight">
                Verify your{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                  Account
                </span>
              </h1>
              <p className="text-xs sm:text-[13px] text-slate-300/90 font-medium mt-1.5 leading-relaxed">
                We've sent a 6-digit verification OTP code to{' '}
                <span className="text-emerald-400 font-bold">{formData.email}</span>
              </p>
            </div>

            {/* Error Feedback inside Step 2 */}
            {error && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-semibold text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOtpSubmit} className="flex flex-col gap-4">
              {/* 6-Digit OTP Boxes */}
              <div>
                <div className="flex items-center justify-between gap-1.5 sm:gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`signup-otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-9 h-11 sm:w-11 sm:h-12 text-center text-base sm:text-lg font-bold text-emerald-300 otp-input-glow rounded-xl outline-none shadow-inner"
                    />
                  ))}
                </div>

                {/* Resend OTP & Edit Details Controls */}
                <div className="flex items-center justify-between mt-3 px-1 text-xs">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(''); }}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    ← Edit details
                  </button>
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Resend Code</span>
                    </button>
                  ) : (
                    <span className="text-slate-400 font-mono">Resend in {timer}s</span>
                  )}
                </div>
              </div>

              {/* Submit Verification Button with Specular Glow */}
              <SpecularButton
                type="submit"
                disabled={loading || otp.some((d) => !d)}
                size="md"
                radius={16}
                tint="#06b6d4"
                tintOpacity={0.95}
                textColor="#ffffff"
                lineColor="#67e8f9"
                baseColor="#0891b2"
                intensity={1.2}
                shineSize={12}
                shineFade={45}
                thickness={1.5}
                followMouse
                proximity={200}
                className="w-full mt-2 py-3.5 px-6 font-black tracking-wide shadow-[0_10px_25px_rgba(6,182,212,0.4)] hover:shadow-[0_15px_35px_rgba(6,182,212,0.6)]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Verify & Complete Registration</span>
                )}
              </SpecularButton>
            </form>
          </div>
        )}

        {/* STEP 3: Successful Account Creation */}
        {step === 3 && (
          <div className="py-6 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Account Verified & Ready!</h3>
            <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
              Welcome to OpenHealth! Your {accountType} account has been verified. You can now access your medical records, bed reservations, and AI features.
            </p>
            <SpecularButton
              onClick={goToDashboard}
              size="md"
              radius={16}
              tint="#10b981"
              tintOpacity={0.95}
              textColor="#020617"
              lineColor="#a7f3d0"
              baseColor="#059669"
              intensity={1.2}
              followMouse
              proximity={200}
              className="mt-4 w-full py-3.5 font-extrabold shadow-lg shadow-emerald-500/30 cursor-pointer"
            >
              Enter {accountType === 'hospital' ? 'Hospital Operations' : accountType === 'provider' ? 'Provider Hub' : 'Patient Portal'}
            </SpecularButton>
            <button
              onClick={goToLogin}
              className="mt-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Or proceed to Login
            </button>
          </div>
        )}
      </BorderGlow>
    </div>
  );
}
