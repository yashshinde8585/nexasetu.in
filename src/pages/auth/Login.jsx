import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthActions } from '../../context/AuthContext';
import { useSignIn } from '@clerk/clerk-react';
import Navbar from '../../components/layouts/Navbar';
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  ArrowLeft,
} from 'lucide-react';

const getReadableErrorMessage = (err) => {
  const raw =
    err?.response?.data?.message ||
    err?.errors?.[0]?.longMessage ||
    err?.errors?.[0]?.message ||
    err?.message;

  if (!raw || typeof raw !== 'string') {
    return 'Unable to sign in. Please check your credentials and try again.';
  }

  return raw;
};

const Login = () => {
  const { login } = useAuthActions();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOTP, setIsOTP] = useState(false);
  const [isSecondFactor, setIsSecondFactor] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const useClerk = import.meta.env.VITE_USE_CLERK_AUTH === 'true';

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Apply dark obsidian theme on auth page and restore user theme on unmount
  useEffect(() => {
    const root = document.documentElement;
    const originalClasses = Array.from(root.classList);

    root.classList.forEach((cls) => {
      if (cls.startsWith('theme-') || cls.startsWith('accent-')) {
        root.classList.remove(cls);
      }
    });

    root.classList.add('theme-obsidian');
    root.classList.add('accent-blue');
    root.style.colorScheme = 'dark';

    return () => {
      root.classList.forEach((cls) => {
        if (cls.startsWith('theme-') || cls.startsWith('accent-')) {
          root.classList.remove(cls);
        }
      });
      originalClasses.forEach((cls) => {
        if (cls.startsWith('theme-') || cls.startsWith('accent-')) {
          root.classList.add(cls);
        }
      });
      const originalTheme =
        originalClasses
          .find((c) => c.startsWith('theme-'))
          ?.replace('theme-', '') || 'obsidian';
      root.style.colorScheme = originalTheme === 'ghost' ? 'light' : 'dark';
    };
  }, []);

  const handleResetVerification = () => {
    setCodeSent(false);
    setIsSecondFactor(false);
    setCode('');
    setError('');
    setStatusMessage('');
  };

  const handleToggleOTP = () => {
    setIsOTP((prev) => !prev);
    setError('');
    setStatusMessage('');
    setCode('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || (useClerk && !isLoaded)) return;

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!codeSent && !isOTP && !formData.password) {
      setError('Please enter your password.');
      return;
    }

    if (codeSent && !code.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    setLoading(true);
    setError('');
    setStatusMessage('');

    try {
      if (useClerk) {
        if (isSecondFactor) {
          const result = await signIn.attemptSecondFactor({
            strategy: 'email_code',
            code: code.trim(),
          });

          if (result.status === 'complete') {
            await setActive({ session: result.createdSessionId });
            if (isMounted.current) navigate('/', { replace: true });
          } else {
            throw new Error('Verification failed. Please check your security code and try again.');
          }
        } else if (isOTP) {
          if (!codeSent) {
            const { supportedFirstFactors } = await signIn.create({
              identifier: trimmedEmail,
            });

            const emailCodeFactor = supportedFirstFactors?.find(
              (f) => f.strategy === 'email_code'
            );

            if (emailCodeFactor) {
              await signIn.prepareFirstFactor({
                strategy: 'email_code',
                emailAddressId: emailCodeFactor.emailAddressId,
              });
              if (isMounted.current) {
                setCodeSent(true);
                setStatusMessage(`We sent a 6-digit code to ${trimmedEmail}.`);
              }
            } else {
              throw new Error('Email code sign-in is not available for this account. Please use your password.');
            }
          } else {
            const result = await signIn.attemptFirstFactor({
              strategy: 'email_code',
              code: code.trim(),
            });

            if (result.status === 'complete') {
              await setActive({ session: result.createdSessionId });
              if (isMounted.current) navigate('/', { replace: true });
            } else {
              throw new Error('Verification failed. Please check the code and try again.');
            }
          }
        } else {
          const result = await signIn.create({
            identifier: trimmedEmail,
            password: formData.password,
          });

          if (result.status === 'complete') {
            await setActive({ session: result.createdSessionId });
            if (isMounted.current) navigate('/', { replace: true });
          } else if (result.status === 'needs_second_factor') {
            await signIn.prepareSecondFactor({ strategy: 'email_code' });
            if (isMounted.current) {
              setIsSecondFactor(true);
              setCodeSent(true);
              setStatusMessage(`Enter the security code sent to ${trimmedEmail}.`);
            }
          } else {
            setError('Additional verification is required to complete sign-in.');
          }
        }
      } else {
        await login(trimmedEmail, formData.password);
        if (isMounted.current) navigate('/', { replace: true });
      }
    } catch (err) {
      if (isMounted.current) {
        setError(getReadableErrorMessage(err));
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const getSubmitButtonLabel = () => {
    if (loading) {
      if (isOTP && !codeSent) return 'Sending code...';
      if (codeSent) return 'Verifying...';
      return 'Signing in...';
    }
    if (codeSent) return 'Verify & sign in';
    if (isOTP) return 'Send sign-in code';
    return 'Sign in';
  };

  return (
    <div className="auth-page-theme min-h-screen flex flex-col bg-background text-text">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-8 pt-20 sm:pt-24 font-sans">
        <div className="w-full max-w-md bg-card border border-border-subtle rounded-xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-text tracking-tight">
              {codeSent
                ? isSecondFactor
                  ? 'Two-step verification'
                  : 'Check your email'
                : 'Sign in'}
            </h1>
            <p className="text-xs sm:text-sm text-text-subtle leading-relaxed">
              {codeSent
                ? 'Enter the 6-digit code to finish signing in.'
                : 'Sign in to continue to your NexaSetu workspace.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold text-text-muted block"
              >
                Email address
              </label>
              <div className="relative flex items-center">
                <Mail
                  size={16}
                  aria-hidden="true"
                  className="absolute left-3.5 text-text-muted/60 pointer-events-none"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  disabled={codeSent || loading}
                  className="w-full h-11 bg-background border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary text-text rounded-lg pl-10 pr-4 outline-none transition-colors placeholder:text-text-muted/40 text-sm font-medium disabled:opacity-60"
                  placeholder="name@company.com"
                  required
                  maxLength={255}
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (error) setError('');
                  }}
                />
              </div>
            </div>

            {/* Verification Code or Password Input */}
            {codeSent ? (
              <div className="space-y-1.5">
                <label
                  htmlFor="verification-code"
                  className="text-xs font-semibold text-text-muted block"
                >
                  {isSecondFactor ? 'Security code' : 'Verification code'}
                </label>
                <div className="relative flex items-center">
                  <Shield
                    size={16}
                    aria-hidden="true"
                    className="absolute left-3.5 text-text-muted/60 pointer-events-none"
                  />
                  <input
                    id="verification-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="w-full h-11 bg-background border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary text-text rounded-lg pl-10 pr-4 outline-none transition-colors placeholder:text-text-muted/40 text-sm font-medium tracking-widest"
                    placeholder="000000"
                    required
                    autoFocus
                    maxLength={6}
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (error) setError('');
                    }}
                  />
                </div>
              </div>
            ) : !isOTP ? (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold text-text-muted block"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:text-primary-light hover:underline transition-colors font-semibold"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative flex items-center">
                  <Lock
                    size={16}
                    aria-hidden="true"
                    className="absolute left-3.5 text-text-muted/60 pointer-events-none"
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full h-11 bg-background border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary text-text rounded-lg pl-10 pr-10 outline-none transition-colors placeholder:text-text-muted/40 text-sm font-medium disabled:opacity-60"
                    placeholder="Enter your password"
                    required
                    maxLength={128}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        password: e.target.value,
                      });
                      if (error) setError('');
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-3 p-1 text-text-muted/60 hover:text-text transition-colors rounded focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff size={16} aria-hidden="true" />
                    ) : (
                      <Eye size={16} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Informational Status Banner */}
            {statusMessage && !error && (
              <div
                role="status"
                aria-live="polite"
                className="border border-primary/25 bg-primary/10 text-text text-xs font-medium py-2.5 px-3 text-center rounded-lg"
              >
                {statusMessage}
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="border border-red-500/25 bg-red-500/10 text-red-400 text-xs font-medium py-2.5 px-3 text-center rounded-lg"
              >
                {error}
              </div>
            )}

            <div className="space-y-3 pt-1">
              <button
                type="submit"
                disabled={loading || (useClerk && !isLoaded)}
                className="w-full h-11 bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-colors rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2
                      className="animate-spin text-white"
                      size={16}
                      aria-hidden="true"
                    />
                    <span>{getSubmitButtonLabel()}</span>
                  </>
                ) : (
                  <>
                    <span>{getSubmitButtonLabel()}</span>
                    <ArrowRight size={16} className="text-white" aria-hidden="true" />
                  </>
                )}
              </button>

              {codeSent && (
                <button
                  type="button"
                  onClick={handleResetVerification}
                  disabled={loading}
                  className="w-full py-1.5 text-center text-xs font-medium text-text-muted hover:text-text transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft size={13} aria-hidden="true" />
                  <span>Use a different email or password</span>
                </button>
              )}

              {useClerk && !codeSent && (
                <button
                  type="button"
                  onClick={handleToggleOTP}
                  disabled={loading}
                  className="w-full py-1.5 text-center text-xs font-medium text-text-muted hover:text-text transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isOTP
                    ? 'Use password instead'
                    : 'Sign in with an email code'}
                </button>
              )}
            </div>
          </form>

          <div className="pt-4 border-t border-border-subtle text-center">
            <p className="text-xs text-text-muted">
              New to NexaSetu?{' '}
              <Link
                to="/register"
                className="text-primary font-semibold hover:text-primary-light hover:underline transition-colors"
              >
                Create workspace
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
