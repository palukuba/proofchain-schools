import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Loader2, Mail, Lock, Eye, EyeOff, Globe } from 'lucide-react';
import { Language } from '../types';
import { useTranslation } from '../services/i18n';

interface LoginProps {
    lang: Language;
    setLang: (lang: Language) => void;
}

const Login: React.FC<LoginProps> = ({ lang, setLang }) => {
    const t = useTranslation(lang);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
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

                    <h2 className="text-2xl font-bold text-center mb-6">{t('loginTitle')}</h2>

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

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">{t('password')}</span>
                                <Link to="/forgot-password" className="label-text-alt link link-hover link-primary">
                                    {t('forgotPassword')}
                                </Link>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="opacity-50" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="input input-bordered w-full pl-10 pr-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} className="opacity-50" /> : <Eye size={18} className="opacity-50" />}
                                </button>
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
                                    {t('signingIn')}
                                </>
                            ) : (
                                <>
                                    <LogIn size={20} className="mr-2" />
                                    {t('signIn')}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="divider">OR</div>

                    <p className="text-center text-sm opacity-70">
                        {t('noAccount')}{' '}
                        <Link to="/signup" className="link link-primary">
                            {t('createAccount')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;

