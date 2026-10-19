import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Icon } from './Icons';

const nav = [
  { to: '/', label: 'Dashboard', icon: 'grid', end: true },
  { to: '/questions', label: 'Question Bank', icon: 'book' },
  { to: '/subjects', label: 'Subjects & Topics', icon: 'layers' },
  { to: '/papers/new', label: 'Create Paper', icon: 'plus' },
];

function ThemeToggle({ compact = false }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  if (compact) {
    return (
      <button
        onClick={toggle}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        aria-label="Toggle theme"
        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10
                   text-slate-400 hover:text-white transition-all"
      >
        <Icon name={isDark ? 'sun' : 'moon'} className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl
                 bg-white/5 hover:bg-white/10 border border-white/10
                 text-slate-400 hover:text-white text-xs font-medium transition-all"
    >
      <Icon name={isDark ? 'sun' : 'moon'} className="w-4 h-4" />
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const nav2 = useNavigate();
  const [open, setOpen] = useState(false);

  const navItems = (
    <>
      <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Workspace</p>
      {nav.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
              ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-white border border-indigo-400/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <Icon name={n.icon} className="w-[18px] h-[18px]" />
          {n.label}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Mobile bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 dark:bg-slate-950 border-b border-slate-800 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white">
              <Icon name="sparkles" className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-white">QPaper</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <button onClick={() => setOpen(!open)} className="p-2 text-white">
              <Icon name={open ? 'x' : 'grid'} className="w-5 h-5" />
            </button>
          </div>
        </div>
        {open && <div className="bg-slate-900 dark:bg-slate-950 border-t border-slate-800 px-3 py-3 space-y-1">{navItems}</div>}
      </div>

      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-slate-950 dark:to-black flex-col fixed inset-y-0 left-0 border-r border-slate-800/50">
        <div className="px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Icon name="sparkles" className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <p className="font-display font-bold text-white text-lg leading-tight">QPaper</p>
              <p className="text-[11px] text-slate-400 tracking-wide">Paper Generation</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">{navItems}</nav>
        <div className="border-t border-white/5 p-4 space-y-2">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.username}</p>
              <p className="text-[11px] text-slate-500 uppercase tracking-wide">{user?.role}</p>
            </div>
            <ThemeToggle compact />
            <button
              onClick={() => { logout(); nav2('/login'); }}
              title="Logout"
              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <Icon name="logout" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        <div className="max-w-7xl mx-auto p-4 lg:p-8 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}