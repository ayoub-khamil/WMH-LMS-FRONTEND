import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { IconLogout, IconSun, IconMoon } from '../common/Icons';

export function TopNav({ title, breadcrumbs = [], actions = null }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-24 pt-4 pb-3 flex-shrink-0 bg-[#F7F8ED] dark:bg-zinc-950 flex items-center justify-between px-10 border-b border-zinc-100 dark:border-zinc-900 gap-4">
      {/* Title & Breadcrumbs */}
      <div className="flex flex-col space-y-1.5 pt-1 min-w-0">
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {crumb.onClick ? (
                  <button
                    onClick={crumb.onClick}
                    className="hover:text-watermelon-green-600 dark:hover:text-watermelon-green-400 transition-colors cursor-pointer"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className={idx === breadcrumbs.length - 1 ? 'text-zinc-800 dark:text-zinc-200 font-bold' : ''}>
                    {crumb.label}
                  </span>
                )}
                {idx < breadcrumbs.length - 1 && <span className="text-zinc-300 dark:text-zinc-700">/</span>}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
          {title}
        </h1>
      </div>

      {/* Right Actions & Manager User Controls */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {actions && (
          <div className="flex items-center space-x-3 mr-2">
            {actions}
          </div>
        )}

        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[180px] sm:max-w-none">
          {user?.name || user?.email}
        </span>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#F7F8ED] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:text-watermelon-red-600 dark:hover:text-watermelon-red-400 hover:border-watermelon-red-200 dark:hover:border-watermelon-red-900/60 transition-colors cursor-pointer shadow-sm flex-shrink-0"
          title="Sign Out"
        >
          <IconLogout className="w-4 h-4" />
          <span className="hidden md:inline">Sign Out</span>
        </button>

        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-1.5 rounded-full bg-[#F7F8ED] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer shadow-sm flex-shrink-0"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <IconSun className="w-4 h-4" /> : <IconMoon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
