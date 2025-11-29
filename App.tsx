
import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MeshProvider } from '@meshsdk/react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { Language, Theme } from './types';

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Students = React.lazy(() => import('./pages/Students'));
const Issuance = React.lazy(() => import('./pages/Issuance'));
const Templates = React.lazy(() => import('./pages/Templates'));
const KYC = React.lazy(() => import('./pages/KYC'));
const Billing = React.lazy(() => import('./pages/Billing'));
const Login = React.lazy(() => import('./pages/Login'));
const SignUp = React.lazy(() => import('./pages/SignUp'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));

function App() {
  const [lang, setLang] = useState<Language>(Language.EN);
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const PageLoader = () => (
    <div className="flex items-center justify-center min-h-screen">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );

  return (
    <MeshProvider>
      <AuthProvider>
        <HashRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login lang={lang} setLang={setLang} />} />
              <Route path="/signup" element={<SignUp lang={lang} setLang={setLang} />} />
              <Route path="/forgot-password" element={<ForgotPassword lang={lang} setLang={setLang} />} />
              <Route path="/reset-password" element={<ResetPassword lang={lang} setLang={setLang} />} />

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
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </HashRouter>
      </AuthProvider>
    </MeshProvider>
  );
}

export default App;
