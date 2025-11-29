import { supabase } from '../../lib/supabaseClient';
import type { SchoolProfile } from '../../types/database';

export const authService = {
    /**
     * Sign up with email and password
     */
    async signUp(email: string, password: string, schoolName: string, walletData?: { address: string, encryptedMnemonic: string }) {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // Force redirect to production URL as requested
                emailRedirectTo: 'https://proofchain-schools.vercel.app/login',
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');

        // Create school profile
        try {
            await this.createSchoolProfile(authData.user.id, schoolName, email, walletData);
        } catch (profileError) {
            // If profile creation fails, we should ideally delete the auth user
            // but Supabase doesn't allow that from client side
            console.error('Failed to create school profile:', profileError);
            throw new Error('Failed to create school profile');
        }

        return authData;
    },

    /**
     * Sign in with email and password
     */
    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data;
    },

    /**
     * Sign out current user
     */
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    /**
     * Get current session (from local cache, no network request if valid)
     */
    async getSession() {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    },

    /**
     * Get current authenticated user
     */
    async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    },

    /**
     * Request password reset email
     */
    async resetPassword(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://proofchain-schools.vercel.app/reset-password',
        });

        if (error) throw error;
    },

    /**
     * Update password (used after reset)
     */
    async updatePassword(newPassword: string) {
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) throw error;
    },

    /**
     * Create school profile
     */
    async createSchoolProfile(userId: string, schoolName: string, email: string, walletData?: { address: string, encryptedMnemonic: string }): Promise<SchoolProfile> {
        // Use provided wallet or generate a placeholder (should not happen with new flow)
        const publicWallet = walletData?.address || '0x' + Math.random().toString(16).substr(2, 40);
        const encryptedMnemonic = walletData?.encryptedMnemonic || null;

        const { data, error } = await supabase
            .from('school_profiles')
            .insert([{
                user_id: userId,
                name: schoolName,
                email: email,
                public_wallet: publicWallet,
                encrypted_mnemonic: encryptedMnemonic,
                kyc_status: 'pending',
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get school profile for current user
     */
    async getSchoolProfile(userId: string): Promise<SchoolProfile | null> {
        const { data, error } = await supabase
            .from('school_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('Error fetching school profile:', error);
            return null;
        }

        return data;
    },

    /**
     * Update school profile
     */
    async updateSchoolProfile(userId: string, updates: Partial<SchoolProfile>) {
        const { data, error } = await supabase
            .from('school_profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Listen to auth state changes
     */
    onAuthStateChange(callback: (event: string, session: any) => void) {
        return supabase.auth.onAuthStateChange(callback);
    },
};

