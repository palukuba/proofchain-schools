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
     * Create a new student with Auth account
     * This creates both the auth user and the student profile
     */
    async createStudentWithAuth(studentData: {
        full_name: string;
        email: string;
        public_wallet?: string;
        password?: string;
    }) {
        try {
            // Generate a temporary password if not provided
            const tempPassword = studentData.password || Math.random().toString(36).slice(-12) + 'Aa1!';

            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: studentData.email,
                password: tempPassword,
                email_confirm: true, // Auto-confirm email
                user_metadata: {
                    full_name: studentData.full_name,
                    role: 'student'
                }
            });

            if (authError) {
                console.error('Error creating auth user:', authError);
                throw new Error(`Failed to create auth user: ${authError.message}`);
            }

            if (!authData.user) {
                throw new Error('No user returned from auth creation');
            }

            // Generate wallet if not provided
            const publicWallet = studentData.public_wallet || '0x' + Math.random().toString(16).substr(2, 40);

            // Create student profile
            const { data: profileData, error: profileError } = await supabase
                .from('student_profiles')
                .insert([{
                    user_id: authData.user.id,
                    full_name: studentData.full_name,
                    email: studentData.email,
                    public_wallet: publicWallet
                }])
                .select()
                .single();

            if (profileError) {
                console.error('Error creating student profile:', profileError);
                // Try to clean up the auth user if profile creation fails
                await supabase.auth.admin.deleteUser(authData.user.id);
                throw new Error(`Failed to create student profile: ${profileError.message}`);
            }

            return {
                user: authData.user,
                profile: profileData,
                tempPassword: tempPassword
            };
        } catch (error) {
            console.error('Error in createStudentWithAuth:', error);
            throw error;
        }
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
