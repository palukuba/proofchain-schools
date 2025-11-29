import { ForgeScript, deserializeAddress, NativeScript } from '@meshsdk/core';
import { supabase } from '../../lib/supabaseClient';

export const policyService = {
    /**
     * Create or retrieve a school's minting policy.
     * This ensures each school has a persistent, verifiable policy ID for all their diplomas.
     */
    async getOrCreateSchoolPolicy(schoolId: string, wallet: any): Promise<{ policyId: string; script: NativeScript }> {
        try {
            // 1. Check if policy already exists in the database
            const { data: existingPolicy, error: fetchError } = await supabase
                .from('minting_policies')
                .select('policy_id, script')
                .eq('school_id', schoolId)
                .single();

            if (existingPolicy && !fetchError) {
                return {
                    policyId: existingPolicy.policy_id,
                    script: JSON.parse(existingPolicy.script as string) as NativeScript
                };
            }

            // 2. If not, create a new policy
            const rewardAddresses = await wallet.getRewardAddresses();
            if (!rewardAddresses || rewardAddresses.length === 0) {
                throw new Error('Reward address not found. A reward address is required to create a minting policy.');
            }
            const address = rewardAddresses[0];

            // Securely derive the key hash from the wallet address
            const keyHash = deserializeAddress(address).payment_cred.hash;

            // Define the native script (policy)
            // This policy requires a signature from the key associated with the school's wallet.
            const nativeScript: NativeScript = {
                type: 'sig',
                keyHash: keyHash,
            };

            // Create the ForgeScript object from the native script
            const forgingScript = ForgeScript.fromNativeScript(nativeScript);

            // Correctly generate the policy ID by hashing the script
            const policyId = forgingScript.getPolicyId();

            // 3. Save the new policy to the database
            const { error: insertError } = await supabase
                .from('minting_policies')
                .insert({
                    school_id: schoolId,
                    policy_id: policyId,
                    script: JSON.stringify(nativeScript),
                    created_at: new Date().toISOString()
                });

            if (insertError) {
                console.error('Error saving new policy to database:', insertError);
                throw new Error(`Failed to save minting policy to the database: ${insertError.message}`);
            }

            return {
                policyId,
                script: nativeScript
            };

        } catch (error) {
            console.error('❌ Error in getOrCreateSchoolPolicy:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to get or create minting policy: ${errorMessage}`);
        }
    },

    /**
     * Verify if a diploma NFT belongs to a school's policy by checking against the database record.
     * Note: This is a database check, not a cryptographic on-chain verification.
     */
    async verifyDiploma(policyId: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('minting_policies')
                .select('policy_id')
                .eq('policy_id', policyId)
                .single();

            if (error || !data) {
                console.warn(`Verification failed: Policy ID ${policyId} not found in the database.`);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error verifying diploma policy:', error);
            return false;
        }
    }
};