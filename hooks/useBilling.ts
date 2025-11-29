import { useState, useEffect, useCallback } from 'react';
import { billingService } from '../services/supabase/billingService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

export const useBilling = () => {
    const { schoolProfile } = useAuth();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadBillingData = useCallback(async () => {
        if (!schoolProfile) return;

        setLoading(true);
        setError(null);

        try {
            // Fetch the school's current balance from the profile
            const { data: profile, error: profileError } = await supabase
                .from('school_profiles')
                .select('balance')
                .eq('id', schoolProfile.id)
                .single();

            if (profileError) throw profileError;

            const currentBalance = profile?.balance || 0;

            const txs = await billingService.getTransactions(schoolProfile.id);
            setTransactions(txs);

            // The balance is now directly from the profile, no mock calculation needed.
            setBalance(currentBalance);

        } catch (err: any) {
            console.error('Error loading billing data:', err);
            setError('Failed to load billing data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [schoolProfile]);

    useEffect(() => {
        loadBillingData();
    }, [loadBillingData]);

    const calculateFees = (quantity: number) => {
        return billingService.calculateFees(quantity);
    };

    return {
        transactions,
        balance,
        loading,
        error,
        calculateFees,
        refresh: loadBillingData,
    };
};