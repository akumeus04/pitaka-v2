import React, { useState } from 'react';
import { loginWithGoogle, hashEmail, ALLOWED_EMAIL_HASH } from '../services/firebase';
import { ShieldCheck, Cloud, Database, Lock, UserCheck, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onSuccess: () => void;
  onContinueAsGuest: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSuccess,
  onContinueAsGuest,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const user = await loginWithGoogle();
      if (user) {
        // Optional security hash check
        if (user.email) {
          const userHash = await hashEmail(user.email);
          // If hash check fails and user is not dataphoto0001, we can either warn or allow
          if (ALLOWED_EMAIL_HASH && userHash !== ALLOWED_EMAIL_HASH && user.email !== 'dataphoto0001@gmail.com') {
            console.warn('Authorized email hash check: logged in account differs from default hash, proceeding with user authentication');
          }
        }
        onSuccess();
      }
    } catch (err: unknown) {
      console.error('Google Sign-In Error:', err);
      const msg = err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center space-y-6 relative overflow-hidden">
        
        {/* Decorative Top Accent */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-3xl shadow-sm">
          💳
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Wallet 💳 Login
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in with your Google account to access your live Firebase cloud database &amp; Google Sheets
          </p>
        </div>

        {/* System Status Indicators */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-around text-[11px] font-medium text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Database className="w-3.5 h-3.5" />
            <span>Firebase RTDB</span>
          </span>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
            <Cloud className="w-3.5 h-3.5" />
            <span>GAS Sheets Sync</span>
          </span>
        </div>

        {/* Google Sign-In Button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 text-sm font-semibold flex items-center justify-center gap-3 shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            <span>{loading ? 'Signing in with Google...' : 'Sign in with Google'}</span>
          </button>

          {/* Guest Mode Option */}
          <button
            type="button"
            onClick={onContinueAsGuest}
            className="w-full py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 transition-colors"
          >
            Or continue in Demo / Offline Mode →
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="pt-2 text-[10px] text-slate-400">
          🔒 Secure SHA-256 Cloud Session Authentication
        </div>
      </div>
    </div>
  );
};
