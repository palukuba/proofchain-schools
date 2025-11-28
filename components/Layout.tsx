import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileBadge, Settings, CreditCard,
  ShieldCheck, Menu, GraduationCap, X, Sun, Moon, Globe
} from 'lucide-react';
import { Language, Theme } from '../types';
import { useTranslation } from '../services/i18n';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path || (path === '/issuance' && location.pathname.startsWith('/issuance')) ? 'bg-black text-white' : 'hover:bg-base-200';

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/issuance', icon: GraduationCap, label: t('issuance') },
    { path: '/students', icon: Users, label: t('students') },
    { path: '/templates', icon: FileBadge, label: t('templates') },
    { path: '/billing', icon: CreditCard, label: t('billing') },
    { path: '/kyc', icon: ShieldCheck, label: t('kyc') },
    { path: '/settings', icon: Settings, label: t('settings') },
  ];

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
            {/* Modern Language Selector */}
            <div className="flex gap-1 p-1 bg-base-200 rounded-lg shadow-inner">
              {[
                { code: Language.EN, label: 'EN', flag: '🇬🇧' },
                { code: Language.FR, label: 'FR', flag: '🇫🇷' },
                { code: Language.SW, label: 'SW', flag: '🇹🇿' },
                { code: Language.LI, label: 'LI', flag: '🇨🇩' }
              ].map(({ code, label, flag }) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className={`
                    relative px-3 py-1.5 rounded-md text-xs font-semibold
                    transition-all duration-300 ease-out flex items-center gap-1
                    ${lang === code
                      ? 'bg-black text-white shadow-lg scale-105'
                      : 'hover:bg-base-300 text-base-content/70 hover:text-base-content'
                    }
                  `}
                  style={{
                    transform: lang === code ? 'translateY(-1px)' : 'translateY(0)'
                  }}
                >
                  <span className="text-sm">{flag}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Modern Theme Toggle - Dropdown */}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
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

          <div className="mt-auto px-4 py-4 bg-base-200 rounded-lg text-xs opacity-70">
            <p>School ID: #883920</p>
            <p className="mt-1">Version 1.0.0</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Layout;