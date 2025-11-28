import { supabase } from '../../lib/supabaseClient';
import type { StudentProfile } from '../../types/database';

export const studentService = {
    /**
     * Get all students (for admin/school view)
     * Note: This returns student_profiles, not filtering by school
     * You may need to add a school_students junction table if students belong to specific schools
     */
    async getStudents(): Promise<StudentProfile[]> {
        const { data, error } = await supabase
            .from('student_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching students:', error);
            throw error;
        }

        return data || [];
    },

    /**
     * Get student by ID
     */
    async getStudentById(userId: string): Promise<StudentProfile | null> {
        const { data, error } = await supabase
            .from('student_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('Error fetching student:', error);
            return null;
        }

        return data;
    },

    /**
     * Create new student profile
     * Note: This assumes the student user already exists in auth.users
     * You may need to create the auth user first via Supabase Auth Admin API
     */
    async createStudent(student: Omit<StudentProfile, 'user_id' | 'created_at' | 'updated_at'> & { user_id: string }) {
        const { data, error } = await supabase
            .from('student_profiles')
            .insert([student])
            .select()
            .single();

        if (error) {
            console.error('Error creating student:', error);
            throw error;
        }

        return data;
    },

    /**
     * Update student profile
     */
    async updateStudent(userId: string, updates: Partial<StudentProfile>) {
        const { data, error } = await supabase
            .from('student_profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating student:', error);
            throw error;
        }

        return data;
    },

    /**
     * Delete student profile
     */
    async deleteStudent(userId: string) {
        const { error } = await supabase
            .from('student_profiles')
            .delete()
            .eq('user_id', userId);

        if (error) {
            console.error('Error deleting student:', error);
            throw error;
        }
    },
};
