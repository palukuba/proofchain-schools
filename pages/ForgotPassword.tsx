import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, CheckCircle, Globe } from 'lucide-react';
import { authService } from '../services/supabase/authService';
import { Language } from '../types';
import { useTranslation } from '../services/i18n';

interface ForgotPasswordProps {
    lang: Language;
    setLang: (lang: Language) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ lang, setLang }) => {
    const t = useTranslation(lang);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Email is required');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            await authService.resetPassword(email);

            setEmailSent(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    const toggleLanguage = () => {
        const langs = Object.values(Language);
        const currentIndex = langs.indexOf(lang);
        const nextIndex = (currentIndex + 1) % langs.length;
        setLang(langs[nextIndex]);
    };

    if (emailSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200 relative">
                <button
                    onClick={toggleLanguage}
                    className="absolute top-4 right-4 btn btn-ghost btn-sm gap-2"
                >
                    <Globe size={16} />
                    {lang.toUpperCase()}
                </button>
                <div className="card w-full max-w-md bg-base-100 shadow-xl">
                    <div className="card-body text-center">
                        <div className="flex justify-center mb-4">
                            <CheckCircle size={64} className="text-success" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{t('checkEmail')}</h2>
                        <p className="text-sm opacity-70 mb-6">
                            {t('resetLinkSent')} <strong>{email}</strong>
                        </p>
                        <p className="text-sm opacity-70 mb-6">
                            {t('clickLink')}
                        </p>
                        <Link to="/login" className="btn btn-primary">
                            <ArrowLeft size={18} className="mr-2" />
                            {t('backToLogin')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 relative">
            <button
                onClick={toggleLanguage}
                className="absolute top-4 right-4 btn btn-ghost btn-sm gap-2"
            >
                <Globe size={16} />
                {lang.toUpperCase()}
            </button>
            <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="flex items-center justify-center mb-6">
                        <img src="/logo.svg" alt="PROOFCHAIN Logo" className="w-16 h-16 mr-3" />
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                            PROOFCHAIN
                        </h1>
                    </div>

                    <h2 className="text-2xl font-bold text-center mb-2">{t('forgotPassword')}</h2>
                    <p className="text-center text-sm opacity-70 mb-6">
                        {t('enterEmail')}
                    </p>

                    {error && (
                        <div className="alert alert-error mb-4">
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">{t('email')}</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="opacity-50" />
                                </div>
                                <input
                                    type="email"
                                    placeholder="school@example.com"
                                    className="input input-bordered w-full pl-10"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={20} />
                                    {t('sending')}
                                </>
                            ) : (
                                <>
                                    <Mail size={20} className="mr-2" />
                                    {t('sendResetLink')}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="divider">OR</div>

                    <Link to="/login" className="btn btn-ghost btn-sm w-full">
                        <ArrowLeft size={18} className="mr-2" />
                        {t('backToLogin')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
