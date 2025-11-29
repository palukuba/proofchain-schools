import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { authService } from '../services/supabase/authService';

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError(t('passwordMinLength'));
            return;
        }

        if (password !== confirmPassword) {
            setError(t('passwordsDoNotMatch'));
            return;
        }

        setLoading(true);

        try {
            await authService.updatePassword(password);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || t('failedToUpdatePassword'));
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

    if (success) {
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
                        <h2 className="text-2xl font-bold mb-2">{t('passwordUpdated')}</h2>
                        <p className="text-sm opacity-70 mb-6">
                            {t('passwordUpdatedDesc')}
                        </p>
                        <Link to="/login" className="btn btn-primary">
                            <ArrowLeft size={18} className="mr-2" />
                            {t('loginNow')}
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

                    <h2 className="text-2xl font-bold text-center mb-2">{t('resetPassword')}</h2>
                    <p className="text-center text-sm opacity-70 mb-6">
                        {t('enterNewPassword')}
                    </p>

                    {error && (
                        <div className="alert alert-error mb-4">
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">{t('newPassword')}</span>
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

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">{t('confirmPassword')}</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="opacity-50" />
                                </div>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="input input-bordered w-full pl-10 pr-10"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} className="opacity-50" /> : <Eye size={18} className="opacity-50" />}
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
                                    {t('updating')}
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} className="mr-2" />
                                    {t('updatePassword')}
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
