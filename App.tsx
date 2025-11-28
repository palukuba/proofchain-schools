
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Issuance from './pages/Issuance';
import Templates from './pages/Templates';
import KYC from './pages/KYC';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { Language, Theme } from './types';

function App() {
  const [lang, setLang] = useState<Language>(Language.EN);
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout lang={lang} setLang={setLang} theme={theme} setTheme={setTheme}>
                  <Routes>
                    <Route path="/" element={<Dashboard lang={lang} />} />
                    <Route path="/students" element={<Students lang={lang} />} />
                    <Route path="/issuance" element={<Issuance lang={lang} />} />
                    <Route path="/templates" element={<Templates />} />
                    <Route path="/kyc" element={<KYC />} />
                    <Route path="/billing" element={<Billing lang={lang} />} />
                    <Route path="/settings" element={<Settings lang={lang} />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
