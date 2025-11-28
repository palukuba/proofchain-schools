import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { authService } from '../services/supabase/authService';
import type { SchoolProfile } from '../types/database';

interface AuthContextType {
    user: User | null;
    schoolProfile: SchoolProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check current session (faster than getUser)
        authService.getSession().then((session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                authService.getSchoolProfile(session.user.id).then(setSchoolProfile);
            }
            setLoading(false);
        }).catch(() => {
            setLoading(false);
        });

        // Listen to auth changes
        const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                const profile = await authService.getSchoolProfile(session.user.id);
                setSchoolProfile(profile);
            } else {
                setSchoolProfile(null);
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        const { user: signedInUser } = await authService.signIn(email, password);
        if (signedInUser) {
            const profile = await authService.getSchoolProfile(signedInUser.id);
            setSchoolProfile(profile);
        }
    };

    const signOut = async () => {
        await authService.signOut();
        setUser(null);
        setSchoolProfile(null);
    };

    const value = {
        user,
        schoolProfile,
        loading,
        signIn,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
