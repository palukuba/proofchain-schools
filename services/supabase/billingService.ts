import { supabase } from '../../lib/supabaseClient';
import type { RevenueRecord, PriceConfig } from '../../types/database';

// Transaction type
export interface Transaction {
    id: string;
    school_id: string;
    date: string;
    amount: number;
    description: string;
    status: 'paid' | 'pending' | 'failed';
    invoice_url?: string;
    created_at?: string;
}

export const billingService = {
    /**
     * Get all transactions for a school
     */
    async getTransactions(schoolId: string): Promise<Transaction[]> {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('school_id', schoolId)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching transactions:', error);
            // If table doesn't exist, return empty array
            if (error.code === '42P01') {
                console.warn('transactions table does not exist. Using fallback.');
                return [];
            }
            throw error;
        }

        return data || [];
    },

    /**
     * Create new transaction
     */
    async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('transactions')
            .insert([transaction])
            .select()
            .single();

        if (error) {
            console.error('Error creating transaction:', error);
            throw error;
        }

        return data;
    },

    /**
     * Get revenue records for a school
     */
    async getRevenueRecords(schoolId: string): Promise<RevenueRecord[]> {
        const { data, error } = await supabase
            .from('revenue_records')
            .select('*')
            .eq('school_id', schoolId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching revenue records:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Create revenue record
     */
    async createRevenueRecord(record: Omit<RevenueRecord, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('revenue_records')
            .insert([record])
            .select()
            .single();

        if (error) {
            console.error('Error creating revenue record:', error);
            throw error;
        }

        return data;
    },

    /**
     * Get current price configuration
     */
    async getPriceConfig(): Promise<PriceConfig | null> {
        const { data, error } = await supabase
            .from('price_config')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error('Error fetching price config:', error);
            return null;
        }

        return data;
    },

    /**
     * Calculate fees based on current pricing
     */
    async calculateFees(currentCount: number, batchSize: number) {
        const priceConfig = await this.getPriceConfig();

        if (!priceConfig) {
            // Default pricing if not configured
            return {
                ipfsFee: 0,
                networkFee: batchSize * 0.50, // $0.50 per diploma
                total: batchSize * 0.50,
                unitNetworkFee: 0.50,
            };
        }

        const networkFeePercent = priceConfig.network_fee_percent / 100;
        const storageFreeLimit = priceConfig.storage_free_limit;
        const storagePricePer1000 = priceConfig.storage_price_per_1000;

        // Assume base diploma price of $25
        const diplomaPrice = 25.00;
        const networkFeePerUnit = diplomaPrice * networkFeePercent;

        let totalIpfsFee = 0;

        for (let i = 0; i < batchSize; i++) {
            const diplomaIndex = currentCount + i + 1;
            if (diplomaIndex > storageFreeLimit) {
                // Calculate storage fee
                totalIpfsFee += storagePricePer1000 / 1000;
            }
        }

        const totalNetworkFee = networkFeePerUnit * batchSize;

        return {
            ipfsFee: totalIpfsFee,
            networkFee: totalNetworkFee,
            total: totalIpfsFee + totalNetworkFee,
            unitNetworkFee: networkFeePerUnit,
        };
    },
};
