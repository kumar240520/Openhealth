import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2, 
  KeyRound, 
  Smartphone,
  RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { getRoleDashboardPath } from '../../components/auth/ProtectedRoute';
import BorderGlow from '../../components/ui/BorderGlow';
import SpecularButton from '../../components/ui/SpecularButton';

export default function Login({ onNavigate }) {
  const navigate = useNavigate ? useNavigate() : null;
  const { signInWithEmail, signInWithGoogle, sendOtp, verifyOtp, checkEmailExists, getEmailByIdentifier } = useAuth();
  const [loginMode, setLoginMode] = useState('password'); // 'password' or 'otp'
  const [otpStep, setOtpStep] = useState(1); // 1: Enter phone, 2: Enter OTP
  
  // Password Mode Fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Mode Fields
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [resolvedEmail, setResolvedEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Helper to route to user's role-based dashboard
  const redirectToRoleDashboard = async (userId) => {
    let targetPath = '/dashboard/patient';
    if (userId) {
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('role, onboarding_completed')
          .eq('id', userId)
          .single();
        if (prof?.role) {
          targetPath = getRoleDashboardPath(prof.role, prof);
        }
      } catch (e) {
        console.warn('Could not fetch role, defaulting to patient dashboard');
      }
    }
    if (navigate) {
      navigate(targetPath);
    } else {
      goToHome();
    }
  };

  // OTP Countdown timer
  useEffect(() => {
    let interval;
    if (loginMode === 'otp' && otpStep === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [loginMode, otpStep, timer]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`login-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`login-otp-${index - 1}`);
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
      const targetInput = document.getElementById(`login-otp-${focusIndex}`);
      if (targetInput) targetInput.focus();
    }
  };

  // Password Login Handler with Supabase (Supports Email or Phone)
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const rawIdentifier = identifier.trim();
    let authEmail = rawIdentifier;

    // Look up email if user entered mobile number
    if (!rawIdentifier.includes('@')) {
      const foundEmail = await getEmailByIdentifier(rawIdentifier);
      if (!foundEmail) {
        setLoading(false);
        setError('No OpenHealth account found with this mobile number. Please sign up first.');
        return;
      }
      authEmail = foundEmail;
    } else {
      const exists = await checkEmailExists(rawIdentifier);
      if (!exists) {
        setLoading(false);
        setError('No OpenHealth account found with this email. Please sign up first.');
        return;
      }
    }

    const { data, error: authError } = await signInWithEmail({
      email: authEmail,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message || 'Invalid password. Please check your credentials.');
      return;
    }

    setSubmitted(true);
    setTimeout(() => {
      redirectToRoleDashboard(data?.user?.id);
    }, 1200);
  };

  // OTP Mode Step 1: Send Real Supabase OTP (Supports Email or Mobile)
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    const rawInput = phoneOrEmail.trim();
    if (!rawInput) {
      setError('Please enter your mobile number or email address.');
      return;
    }

    setLoading(true);

    let targetEmail = rawInput;
    if (!rawInput.includes('@')) {
      // Look up email linked to this mobile number
      const foundEmail = await getEmailByIdentifier(rawInput);
      if (!foundEmail) {
        setLoading(false);
        setError('No OpenHealth account found with this mobile number. Please sign up first.');
        return;
      }
      targetEmail = foundEmail;
    } else {
      // Verify email existence
      const exists = await checkEmailExists(rawInput);
      if (!exists) {
        setLoading(false);
        setError('No OpenHealth account found with this email. Please sign up first.');
        return;
      }
    }

    setResolvedEmail(targetEmail);

    // Dispatch OTP to user
    const { data, error: sendError } = await sendOtp({
      email: targetEmail,
      shouldCreateUser: false,
    });

    setLoading(false);

    if (sendError) {
      setError(sendError.message || 'Failed to send OTP code. Please check your email/mobile.');
      return;
    }

    setOtpStep(2);
    setTimer(45);
    setCanResend(false);
  };

  // OTP Mode Step 2: Verify Real Supabase OTP & Login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('').trim();
    if (enteredOtp.length < 6) return;
    setError('');
    setLoading(true);

    const emailToVerify = resolvedEmail || phoneOrEmail.trim();

    const { data, error: verifyError } = await verifyOtp({
      email: emailToVerify,
      token: enteredOtp,
      type: 'email',
    });

    setLoading(false);

    if (verifyError) {
      setError(verifyError.message || 'Invalid or expired OTP code. Please try again.');
      return;
    }

    setSubmitted(true);
    setTimeout(() => {
      redirectToRoleDashboard(data?.user?.id);
    }, 1200);
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setError('');
    setTimer(45);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);

    const emailToResend = resolvedEmail || phoneOrEmail.trim();

    const { error: resendError } = await sendOtp({
      email: emailToResend,
      shouldCreateUser: false,
    });

    if (resendError) {
      setError(resendError.message || 'Failed to resend OTP code.');
    }
  };

  const goToSignUp = () => {
    if (onNavigate) {
      onNavigate('signup');
    } else if (navigate) {
      navigate('/signup');
    }
  };

  const goToForgotPassword = () => {
    if (onNavigate) {
      onNavigate('forgot-password');
    } else if (navigate) {
      navigate('/forgot-password');
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

      {/* Right-Aligned Floating Frosted Glass Login Card with BorderGlow */}
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
        {/* Card Title & Subtitle (Centered) */}
        <div className="mb-5 text-center">
          <h1 className="text-3xl sm:text-[34px] font-extrabold text-white tracking-tight leading-tight">
            Welcome{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]">
              back!
            </span>
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-300/90 font-medium mt-1.5 leading-relaxed">
            Login to your{' '}
            <span className="text-emerald-400 font-semibold">OpenHealth</span> account
          </p>
        </div>

        {submitted ? (
          <div className="py-8 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Login Successful!</h3>
            <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
              Redirecting you to the OpenHealth platform...
            </p>
            <SpecularButton
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
              onClick={goToHome}
              className="mt-3 w-full font-bold shadow-lg shadow-emerald-500/30"
            >
              Go to Dashboard
            </SpecularButton>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Mode Switcher Tabs */}
            <div className="relative flex items-center p-1 rounded-2xl bg-black/55 border border-white/15">
              <button
                type="button"
                onClick={() => setLoginMode('password')}
                className={`relative flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer z-10 ${
                  loginMode === 'password'
                    ? 'text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {loginMode === 'password' && (
                  <motion.div
                    layoutId="loginTabHighlight"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-300 rounded-xl"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  Password Login
                </span>
              </button>

              <button
                type="button"
                onClick={() => setLoginMode('otp')}
                className={`relative flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer z-10 ${
                  loginMode === 'otp'
                    ? 'text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {loginMode === 'otp' && (
                  <motion.div
                    layoutId="loginTabHighlight"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-300 rounded-xl"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  OTP Login
                </span>
              </button>
            </div>

            {/* Error Feedback */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2.5 rounded-xl bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-semibold text-center"
              >
                {error}
              </motion.div>
            )}

            {/* MODE 1: Password Login */}
            {loginMode === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3.5">
                {/* Identifier Input */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 group-focus-within:drop-shadow-[0_0_8px_rgba(52,211,153,0.6)] transition-all">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Email or Mobile"
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
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

                {/* Forgot Password Link */}
                <div className="flex justify-end -mt-1">
                  <button
                    type="button"
                    onClick={goToForgotPassword}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Login Submit Button with SpecularButton */}
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
                    <span>Login</span>
                  )}
                </SpecularButton>
              </form>
            )}

            {/* MODE 2: OTP Login */}
            {loginMode === 'otp' && (
              <div>
                {otpStep === 1 ? (
                  <form onSubmit={handleSendOtp} className="flex flex-col gap-3.5">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 group-focus-within:drop-shadow-[0_0_8px_rgba(52,211,153,0.6)] transition-all">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={phoneOrEmail}
                        onChange={(e) => setPhoneOrEmail(e.target.value)}
                        placeholder="Enter your Email Address"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl input-focus-glow text-white placeholder-slate-400 text-xs sm:text-sm font-medium outline-none"
                      />
                    </div>

                    <SpecularButton
                      type="submit"
                      disabled={loading || !phoneOrEmail}
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
                        <span>Send Login OTP</span>
                      )}
                    </SpecularButton>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3.5">
                    <div className="text-xs text-slate-300 text-center font-medium">
                      Enter 6-digit OTP sent to <span className="text-emerald-400 font-bold">{phoneOrEmail}</span>
                    </div>

                    {/* 6-Digit OTP Boxes */}
                    <div className="flex items-center justify-between gap-2 my-1" onPaste={handleOtpPaste}>
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`login-otp-${idx}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-11 h-12 text-center text-lg font-bold text-emerald-300 otp-input-glow rounded-xl outline-none shadow-inner"
                        />
                      ))}
                    </div>

                    {/* Resend OTP Timer & Edit Number */}
                    <div className="flex items-center justify-between px-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setOtpStep(1)}
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        ← Change Number
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

                    <SpecularButton
                      type="submit"
                      disabled={loading || otp.some((d) => !d)}
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
                      className="w-full py-3.5 px-6 font-black tracking-wide shadow-[0_10px_25px_rgba(6,182,212,0.4)] hover:shadow-[0_15px_35px_rgba(6,182,212,0.6)] mt-1"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Verify & Login</span>
                      )}
                    </SpecularButton>
                  </form>
                )}
              </div>
            )}

            {/* Divider: — or — */}
            <div className="relative flex items-center justify-center my-0.5">
              <div className="flex-grow border-t border-white/10" />
              <span className="px-3 text-xs text-slate-400 font-medium">or</span>
              <div className="flex-grow border-t border-white/10" />
            </div>

            {/* Social OAuth: Google Button */}
            <button
              type="button"
              onClick={async () => {
                setError('');
                const { error: googleError } = await signInWithGoogle();
                if (googleError) {
                  setError(googleError.message || 'Google sign-in failed. Please try again.');
                }
              }}
              className="w-full py-2.5 px-4 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Social OAuth: Apple Button */}
            <button
              type="button"
              className="w-full py-2.5 px-4 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.66-7.74-11.88-14.1-6.19-9.35-11.05-19.8-14.59-31.33-3.53-11.53-5.3-22.37-5.3-32.51 0-14.15 3.63-26.06 10.9-35.73 7.27-9.67 16.39-14.65 27.35-14.93 4.47 0 9.49 1.15 15.06 3.45 5.57 2.3 9.48 3.51 11.73 3.64 1.83 0 5.86-1.3 12.09-3.9 6.23-2.6 11.88-3.73 16.95-3.4 12.7.67 22.84 5.37 30.41 14.1-11.08 6.74-16.51 15.82-16.29 27.23.22 9.03 3.69 16.73 10.4 23.11 6.72 6.38 14.85 9.94 24.39 10.7-2.3 6.97-5.17 14.4-8.62 22.29zm-38.33-104.9c-.11 3.59-1.2 7.15-3.26 10.68-2.06 3.53-4.8 6.64-8.22 9.33-3.26 2.5-6.88 4.31-10.87 5.43-.54-2.83-.65-5.83-.33-9 .65-6.3 3.1-12.18 7.35-17.64 4.25-5.46 9.5-9.3 15.75-11.52.22 4.24-.1 8.47-.42 12.72z" />
              </svg>
              <span>Continue with Apple</span>
            </button>

            {/* Footer Navigation Link */}
            <div className="text-center text-xs text-slate-300 mt-1 font-medium">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={goToSignUp}
                className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline cursor-pointer transition-colors"
              >
                Sign up
              </button>
            </div>
          </div>
        )}
      </BorderGlow>
    </div>
  );
}
