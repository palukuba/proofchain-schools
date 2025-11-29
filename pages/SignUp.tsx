import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Loader2, Building2, Mail, Lock, Eye, EyeOff, Globe } from 'lucide-react';
import { authService } from '../services/supabase/authService';
import { walletManagementService } from '../services/cardano/walletManagementService';
import { Language } from '../types';
import { useTranslation } from '../services/i18n';

interface SignUpProps {
    lang: Language;
    setLang: (lang: Language) => void;
}

const SignUp: React.FC<SignUpProps> = ({ lang, setLang }) => {
    const t = useTranslation(lang);
    const [formData, setFormData] = useState({
        schoolName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const validateForm = () => {
        if (!formData.schoolName.trim()) {
            setError('School name is required');
            return false;
        }
        if (!formData.email.trim()) {
            setError('Email is required');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Generate Cardano Wallet
            const wallet = await walletManagementService.generateWallet();
            const encryptedMnemonic = walletManagementService.encryptMnemonic(wallet.mnemonic);

            await authService.signUp(
                formData.email,
                formData.password,
                formData.schoolName,
                {
                    address: wallet.address,
                    encryptedMnemonic: encryptedMnemonic
                }
            );

            // Show success message and redirect
            alert('Account created successfully! A Cardano wallet has been automatically generated for your school.');
            navigate('/login');
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
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

                    <h2 className="text-2xl font-bold text-center mb-2">{t('createSchoolAccount')}</h2>
                    <p className="text-center text-sm opacity-70 mb-6">
                        {t('joinNetwork')}
                    </p>

                    {error && (
                        <div className="alert alert-error mb-4">
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">{t('schoolName')}</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Building2 size={18} className="opacity-50" />
                                </div>
                                <input
                                    type="text"
                                    name="schoolName"
                                    placeholder="University of Example"
                                    className="input input-bordered w-full pl-10"
                                    value={formData.schoolName}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

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
                                    name="email"
                                    placeholder="admin@school.com"
                                    className="input input-bordered w-full pl-10"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">{t('password')}</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="opacity-50" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="••••••••"
                                    className="input input-bordered w-full pl-10 pr-10"
                                    value={formData.password}
                                    onChange={handleChange}
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
                                    name="confirmPassword"
                                    placeholder="••••••••"
                                    className="input input-bordered w-full pl-10 pr-10"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
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
                                    {t('creatingAccount')}
                                </>
                            ) : (
                                <>
                                    <UserPlus size={20} className="mr-2" />
                                    {t('createAccount')}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="divider">OR</div>

                    <p className="text-center text-sm opacity-70">
                        {t('alreadyHaveAccount')}{' '}
                        <Link to="/login" className="link link-primary">
                            {t('signIn')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
