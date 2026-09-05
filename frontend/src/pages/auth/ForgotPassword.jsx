import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2, 
  KeyRound, 
  ShieldCheck, 
  RotateCcw 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BorderGlow from '../../components/ui/BorderGlow';
import SpecularButton from '../../components/ui/SpecularButton';

export default function ForgotPassword({ onNavigate }) {
  const navigate = useNavigate ? useNavigate() : null;
  const [step, setStep] = useState(1); // 1: Request, 2: OTP & New Password, 3: Success
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');

  // Timer countdown for resend OTP
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

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`forgot-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`forgot-otp-${index - 1}`);
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
      const targetInput = document.getElementById(`forgot-otp-${focusIndex}`);
      if (targetInput) targetInput.focus();
    }
  };

  const handleSendResetCode = (e) => {
    e.preventDefault();
    if (!identifier) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      setTimer(30);
      setCanResend(false);
    }, 1000);
  };

  const handleResendOtp = () => {
    if (!canResend) return;
    setTimer(30);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 1200);
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
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050814] flex items-center justify-end px-4 sm:px-8 md:px-14 lg:px-20 py-10 select-none">
      {/* Background Image — Left side is 100% crystal clear (Doctor & Wheelchair patient) */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <img
          src="/images/login.jpeg"
          alt="OpenHealth Care Corridor"
          className="w-full h-full object-cover object-center filter brightness-100 contrast-[1.02]"
        />
        {/* Localized dark shading ONLY behind the form on the right */}
        <div className="absolute inset-y-0 right-0 w-full sm:w-[65%] md:w-[52%] lg:w-[45%] bg-gradient-to-l from-black/85 via-black/45 to-transparent z-[1]" />
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

      {/* Right-Aligned Floating Frosted Glass Reset Card with BorderGlow */}
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
        className="relative z-10 w-full max-w-[440px] sm:max-w-[460px] p-6 sm:p-9 rounded-[28px] sm:rounded-[32px] backdrop-blur-2xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.75)] my-auto"
      >
        <AnimatePresence mode="wait">
          {/* STEP 1: Request Password Reset Identifier */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h1 className="text-2xl sm:text-[30px] font-extrabold text-white tracking-tight leading-tight">
                  Forgot your{' '}
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                    password?
                  </span>
                </h1>
                <p className="text-xs sm:text-[13px] text-slate-300/90 font-medium mt-1.5 leading-relaxed">
                  Enter your email or phone number and we'll send a 6-digit recovery code.
                </p>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-semibold text-center mb-3">
                  {error}
                </div>
              )}

              <form onSubmit={handleSendResetCode} className="flex flex-col gap-3.5">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 group-focus-within:drop-shadow-[0_0_8px_rgba(52,211,153,0.6)] transition-all">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Email or Phone Number"
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl input-focus-glow text-white placeholder-slate-400 text-xs sm:text-sm font-medium outline-none"
                  />
                </div>

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
                  className="w-full py-3.5 px-6 font-black tracking-wide shadow-[0_10px_25px_rgba(16,185,129,0.4)] hover:shadow-[0_15px_35px_rgba(16,185,129,0.6)] mt-1"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Send Verification Code</span>
                  )}
                </SpecularButton>

                <div className="text-center text-xs text-slate-300 mt-2 font-medium">
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={goToLogin}
                    className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline cursor-pointer transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* STEP 2: Enter OTP & Set New Password */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-5 text-center">
                <h1 className="text-2xl sm:text-[28px] font-extrabold text-white tracking-tight leading-tight">
                  Verify & Reset{' '}
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                    Password
                  </span>
                </h1>
                <p className="text-xs sm:text-[13px] text-slate-300/90 font-medium mt-1.5 leading-relaxed">
                  Enter the 6-digit code sent to <span className="text-emerald-400 font-bold">{identifier}</span>
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="flex flex-col gap-3.5">
                {/* 6-Digit OTP Boxes */}
                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2 text-center">
                    Enter Verification OTP
                  </div>
                  <div className="flex items-center justify-between gap-2" onPaste={handleOtpPaste}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`forgot-otp-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-11 h-12 text-center text-lg font-bold text-emerald-300 otp-input-glow rounded-xl outline-none shadow-inner"
                      />
                    ))}
                  </div>

                  {/* Resend OTP Timer */}
                  <div className="flex items-center justify-between mt-2 px-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      ← Change contact
                    </button>
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Resend OTP</span>
                      </button>
                    ) : (
                      <span className="text-slate-400 font-mono">Resend in {timer}s</span>
                    )}
                  </div>
                </div>

                {/* New Password */}
                <div className="relative group mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 group-focus-within:drop-shadow-[0_0_8px_rgba(52,211,153,0.6)] transition-all">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password (min. 8 characters)"
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

                {/* Confirm New Password */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 group-focus-within:drop-shadow-[0_0_8px_rgba(52,211,153,0.6)] transition-all">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl input-focus-glow text-white placeholder-slate-400 text-xs sm:text-sm font-medium outline-none"
                  />
                </div>

                {/* Submit Reset Button with SpecularButton */}
                <SpecularButton
                  type="submit"
                  disabled={loading || otp.some((d) => !d) || !newPassword}
                  size="md"
                  radius={16}
                  tint="#06b6d4"
                  tintOpacity={0.95}
                  textColor="#020617"
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
                    <span>Reset Password & Log In</span>
                  )}
                </SpecularButton>
              </form>
            </motion.div>
          )}

          {/* STEP 3: Reset Success Confirmation */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 flex flex-col items-center text-center gap-3"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Password Updated!</h3>
              <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                Your password has been successfully reset. You can now log into your OpenHealth account with your new credentials.
              </p>
              <SpecularButton
                onClick={goToLogin}
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
                className="mt-4 w-full py-3.5 font-extrabold shadow-lg shadow-emerald-500/30"
              >
                Proceed to Login
              </SpecularButton>
            </motion.div>
          )}
        </AnimatePresence>
      </BorderGlow>
    </div>
  );
}
