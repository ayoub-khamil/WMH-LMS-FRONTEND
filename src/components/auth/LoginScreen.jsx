import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';
import { 
  IconSun, 
  IconMoon, 
  IconLock, 
  IconMail, 
  IconEye,
  IconEyeSlash
} from '../common/Icons';
import lightLogoSrc from '/assets/newTransparentLogo.png';
import darkLogoSrc from '/assets/darkModeLogo.png';
import loginBgSrc from '/assets/wmh lms login screen background.png';

export function LoginScreen({ onLoginSuccess }) {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login(email.trim(), password);
      if (onLoginSuccess) {
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#F7F8ED]/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 relative px-4 py-8 overflow-hidden">

      {/* ── Full-bleed background image ────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBgSrc})` }}
      />

      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2 rounded-full bg-[#F7F8ED] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <IconSun className="w-4 h-4" /> : <IconMoon className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Main Centered Container ──────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg w-full mx-auto my-auto">
        
        {/* Card */}
        <div className="w-full bg-[#F7F8ED] dark:bg-zinc-900 border border-[#E2E5CB] dark:border-zinc-800 rounded-2xl px-[27px] py-[22px] sm:px-[35px] sm:py-[30px]">
          
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src={theme === 'dark' ? darkLogoSrc : lightLogoSrc}
              alt="WatermelonHub"
              className="h-[88px] w-auto object-contain"
            />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-[26px] font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Sign In to WMH Academy
            </h1>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-xl border border-watermelon-red-200 dark:border-watermelon-red-900/60 bg-watermelon-red-50 dark:bg-watermelon-red-950/40 text-watermelon-red-900 dark:text-watermelon-red-200 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <IconMail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="firstname.lastname@watermelon-hub.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#F7F8ED] dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <IconLock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-[#F7F8ED] dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <IconEyeSlash className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full py-3.5 mt-2 font-black flex items-center justify-center"
              disabled={loading}
            >
              <span className="text-lg font-black tracking-wide">{loading ? 'Authenticating...' : 'Sign In'}</span>
            </Button>
          </form>
        </div>

      </div>

    </div>
  );
}
