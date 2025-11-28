import { supabase } from '../../lib/supabaseClient';
import type { Diploma, RevenueRecord } from '../../types/database';

export const dashboardService = {
    /**
     * Get school-specific statistics
     */
    async getSchoolStats(schoolId: string) {
        // Get total diplomas issued by this school
        const { count: totalDiplomas } = await supabase
            .from('diplomas')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', schoolId);

        // Get diplomas with IPFS hash
        const { count: ipfsStored } = await supabase
            .from('diplomas')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', schoolId)
            .not('ipfs_hash', 'is', null);

        // Get total revenue for this school
        const { data: revenueData } = await supabase
            .from('revenue_records')
            .select('amount')
            .eq('school_id', schoolId);

        const totalRevenue = revenueData?.reduce((sum, record) => sum + Number(record.amount), 0) || 0;

        // Get total students (all students in the system)
        const { count: totalStudents } = await supabase
            .from('student_profiles')
            .select('*', { count: 'exact', head: true });

        return {
            totalIssued: totalDiplomas || 0,
            ipfsStored: ipfsStored || 0,
            totalRevenue,
            totalStudents: totalStudents || 0,
        };
    },

    /**
     * Get recent diplomas for activity feed
     */
    async getRecentDiplomas(schoolId: string, limit: number = 5): Promise<Diploma[]> {
        const { data, error } = await supabase
            .from('diplomas')
            .select('*')
            .eq('school_id', schoolId)
            .order('issued_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching recent diplomas:', error);
            return [];
        }

        return data || [];
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
     * Get monthly issuance data for charts
     */
    async getMonthlyIssuance(schoolId: string, months: number = 7) {
        const { data, error } = await supabase
            .from('diplomas')
            .select('issued_at')
            .eq('school_id', schoolId)
            .gte('issued_at', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString());

        if (error) {
            console.error('Error fetching monthly issuance:', error);
            return [];
        }

        // Group by month
        const monthlyData: Record<string, number> = {};
        data?.forEach((diploma) => {
            const month = new Date(diploma.issued_at).toLocaleDateString('en-US', { month: 'short' });
            monthlyData[month] = (monthlyData[month] || 0) + 1;
        });

        return Object.entries(monthlyData).map(([name, docs]) => ({ name, docs }));
    },
};
