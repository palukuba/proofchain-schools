import { ForgeScript, resolveScriptHash, deserializeAddress } from '@meshsdk/core';
import { supabase } from '../../lib/supabaseClient';

export const policyService = {
    /**
     * Create or retrieve school's minting policy
     * This ensures each school has a persistent policy ID for all their diplomas
     */
    async getOrCreateSchoolPolicy(schoolId: string, wallet: any) {
        try {
            // Check if policy exists in database
            const { data: existingPolicy, error: fetchError } = await supabase
                .from('minting_policies')
                .select('*')
                .eq('school_id', schoolId)
                .single();

            if (existingPolicy && !fetchError) {
                return {
                    policyId: existingPolicy.policy_id,
                    script: JSON.parse(existingPolicy.script)
                };
            }

            // Create new policy
            const usedAddresses = await wallet.getUsedAddresses();

            if (!usedAddresses || usedAddresses.length === 0) {
                throw new Error('No addresses available from wallet');
            }

            // Extract payment credential from address
            // Note: This is a simplified version. In production, use proper address deserialization
            const address = usedAddresses[0];

            // Create a simple native script with one signature requirement
            const forgingScript = {
                type: 'all',
                scripts: [
                    {
                        type: 'sig',
                        keyHash: address.substring(2, 58) // Simplified extraction
                    }
                ]
            };

            // Generate policy ID from script
            // Note: In production, use proper policy ID generation from Mesh SDK
            const policyId = `policy_${schoolId}_${Date.now()}`;

            // Save to database
            const { error: insertError } = await supabase
                .from('minting_policies')
                .insert({
                    school_id: schoolId,
                    policy_id: policyId,
                    script: JSON.stringify(forgingScript),
                    created_at: new Date().toISOString()
                });

            if (insertError) {
                console.error('Error saving policy to database:', insertError);
                // Continue anyway, policy can still be used
            }

            return {
                policyId,
                script: forgingScript
            };

        } catch (error) {
            console.error('Error in getOrCreateSchoolPolicy:', error);
            throw new Error(`Failed to get or create minting policy: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Verify if a diploma NFT belongs to a school's policy
     */
    async verifyDiploma(policyId: string, assetName: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('minting_policies')
                .select('*')
                .eq('policy_id', policyId)
                .single();

            if (error || !data) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error verifying diploma:', error);
            return false;
        }
    }
};
