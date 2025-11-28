import { supabase } from '../../lib/supabaseClient';
import type { PriceConfig } from '../../types/database';

export const settingsService = {
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
     * Update price configuration (admin only)
     */
    async updatePriceConfig(userId: string, updates: Partial<PriceConfig>) {
        const { data, error } = await supabase
            .from('price_config')
            .insert([{
                ...updates,
                updated_by: userId,
                updated_at: new Date().toISOString(),
            }])
            .select()
            .single();

        if (error) {
            console.error('Error updating price config:', error);
            throw error;
        }

        return data;
    },

    /**
     * Get app settings (general configuration)
     */
    async getAppSettings() {
        // This could be extended to fetch from a settings table
        // For now, return default settings
        return {
            diplomaPrice: 25.00,
            ipfsGateway: 'https://ipfs.io/ipfs/',
        };
    },
};
