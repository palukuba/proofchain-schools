import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileBadge, CreditCard,
  ShieldCheck, Menu, GraduationCap, X, Sun, Moon, LogOut, ChevronDown
} from 'lucide-react';
import { Language, Theme } from '../types';
import { useTranslation } from '../services/i18n';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  lang: Language;
  setLang: (l: Language) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, lang, setLang, theme, setTheme }) => {
  const t = useTranslation(lang);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path || (path === '/issuance' && location.pathname.startsWith('/issuance')) ? 'bg-black text-white' : 'hover:bg-base-200';

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/issuance', icon: GraduationCap, label: t('issuance') },
    { path: '/students', icon: Users, label: t('students') },
    { path: '/templates', icon: FileBadge, label: t('templates') },
    { path: '/billing', icon: CreditCard, label: t('billing') },
    { path: '/kyc', icon: ShieldCheck, label: t('kyc') },
  ];

  const languages = [
    { code: Language.EN, label: 'English', flag: '🇬🇧' },
    { code: Language.FR, label: 'Français', flag: '🇫🇷' },
    { code: Language.SW, label: 'Kiswahili', flag: '🇹🇿' },
    { code: Language.LI, label: 'Lingala', flag: '🇨🇩' }
  ];

  const currentLang = languages.find(l => l.code === lang) || languages[0];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="drawer lg:drawer-open min-h-screen bg-base-200 font-sans">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" checked={sidebarOpen} onChange={(e) => setSidebarOpen(e.target.checked)} />

      <div className="drawer-content flex flex-col">
        {/* Navbar */}
        <div className="w-full navbar bg-base-100 shadow-sm border-b border-base-300 px-4">
          <div className="flex-none lg:hidden">
            <label htmlFor="my-drawer-2" className="btn btn-square btn-ghost">
              <Menu className="h-5 w-5" />
            </label>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              PROOFCHAIN
            </h1>
          </div>
          <div className="flex-none gap-3 flex items-center">
            {/* Language Selector - Dropdown */}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-2 font-normal">
                <span className="text-lg">{currentLang.flag}</span>
                <span className="hidden sm:inline">{currentLang.label}</span>
                <ChevronDown size={14} className="opacity-50" />
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40 mt-4">
                {languages.map(({ code, label, flag }) => (
                  <li key={code}>
                    <button
                      onClick={() => setLang(code)}
                      className={lang === code ? 'active' : ''}
                    >
                      <span className="text-lg">{flag}</span> {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Theme Toggle - Dropdown */}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle btn-sm">
                {theme === Theme.LIGHT ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-indigo-500" />}
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-32 mt-4">
                <li>
                  <button onClick={() => setTheme(Theme.LIGHT)} className={theme === Theme.LIGHT ? 'active' : ''}>
                    <Sun size={16} /> Light
                  </button>
                </li>
                <li>
                  <button onClick={() => setTheme(Theme.DARK)} className={theme === Theme.DARK ? 'active' : ''}>
                    <Moon size={16} /> Dark
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Sidebar */}
      <div className="drawer-side z-20">
        <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label>
        <aside className="bg-base-100 w-64 h-full flex flex-col border-r border-base-300">
          {/* Menu */}
          <ul className="menu p-4 flex-1 text-base-content">
            <div className="mb-6 px-4 flex justify-end items-center lg:hidden">
              <button className="btn btn-sm btn-ghost" onClick={() => setSidebarOpen(false)}>
                <X size={20} />
              </button>
            </div>
            {menuItems.map((item) => (
              <li key={item.path} className="mb-1">
                <Link
                  to={item.path}
                  className={`${isActive(item.path)} flex gap-3 py-3`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="p-4 border-t border-base-200">
            <button
              onClick={handleLogout}
              className="btn btn-ghost w-full justify-start gap-3 text-error hover:bg-error/10"
            >
              <LogOut size={20} />
              {t('logout') || 'Logout'}
            </button>

            <div className="mt-4 px-2 text-xs opacity-50 text-center">
              <p>Version 1.0.0</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Layout;