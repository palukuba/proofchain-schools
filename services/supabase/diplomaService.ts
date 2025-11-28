import { supabase } from '../../lib/supabaseClient';
import type { Diploma } from '../../types/database';

export const diplomaService = {
    /**
     * Get all diplomas for a school
     */
    async getDiplomas(schoolId: string): Promise<Diploma[]> {
        const { data, error } = await supabase
            .from('diplomas')
            .select('*')
            .eq('school_id', schoolId)
            .order('issued_at', { ascending: false });

        if (error) {
            console.error('Error fetching diplomas:', error);
            throw error;
        }

        return data || [];
    },

    /**
     * Get diplomas for a specific student
     */
    async getDiplomasByStudent(studentId: string): Promise<Diploma[]> {
        const { data, error } = await supabase
            .from('diplomas')
            .select('*')
            .eq('student_id', studentId)
            .order('issued_at', { ascending: false });

        if (error) {
            console.error('Error fetching student diplomas:', error);
            throw error;
        }

        return data || [];
    },

    /**
     * Create/Issue a new diploma
     */
    async createDiploma(diploma: Omit<Diploma, 'id' | 'issued_at'>) {
        const { data, error } = await supabase
            .from('diplomas')
            .insert([diploma])
            .select()
            .single();

        if (error) {
            console.error('Error creating diploma:', error);
            throw error;
        }

        return data;
    },

    /**
     * Update diploma IPFS hash
     */
    async updateDiplomaIPFS(diplomaId: string, ipfsHash: string) {
        const { data, error } = await supabase
            .from('diplomas')
            .update({ ipfs_hash: ipfsHash })
            .eq('id', diplomaId)
            .select()
            .single();

        if (error) {
            console.error('Error updating diploma IPFS:', error);
            throw error;
        }

        return data;
    },

    /**
     * Update diploma metadata
     */
    async updateDiplomaMetadata(diplomaId: string, metadata: Record<string, any>) {
        const { data, error } = await supabase
            .from('diplomas')
            .update({ metadata })
            .eq('id', diplomaId)
            .select()
            .single();

        if (error) {
            console.error('Error updating diploma metadata:', error);
            throw error;
        }

        return data;
    },

    /**
     * Get diploma by ID
     */
    async getDiplomaById(diplomaId: string): Promise<Diploma | null> {
        const { data, error } = await supabase
            .from('diplomas')
            .select('*')
            .eq('id', diplomaId)
            .single();

        if (error) {
            console.error('Error fetching diploma:', error);
            return null;
        }

        return data;
    },
};
