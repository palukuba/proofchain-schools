// Database types matching Supabase schema

export interface SchoolProfile {
    user_id: string;
    name: string;
    email: string;
    website?: string;
    logo_url?: string;
    address?: string;
    public_wallet: string;
    kyc_status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
}

export interface StudentProfile {
    user_id: string;
    full_name: string;
    email: string;
    public_wallet: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
}

export interface Diploma {
    id: string;
    school_id: string;
    student_id: string;
    student_name?: string;
    diploma_type?: 'certificat' | 'diplôme';
    template_id?: string;
    issued_at: string;
    ipfs_hash?: string;
    transaction_hash?: string;
    metadata: Record<string, any>;
}

export interface KYCRequest {
    id: string;
    school_id: string;
    status: 'pending' | 'approved' | 'rejected';
    submitted_at: string;
    reviewed_at?: string;
    reviewer_id?: string;
    justification?: string;
    documents: any[];
    updated_at: string;
}

export interface RevenueRecord {
    id: string;
    school_id: string;
    diploma_id?: string;
    kind: 'network_fee' | 'storage_fee';
    amount: number;
    created_at: string;
}

export interface PriceConfig {
    id: string;
    network_fee_percent: number;
    storage_free_limit: number;
    storage_price_per_1000: number;
    updated_at: string;
    updated_by?: string;
}

export interface AuditLog {
    id: string;
    actor_id: string;
    action: string;
    target_table?: string;
    target_id?: string;
    details: Record<string, any>;
    created_at: string;
}

// Dashboard statistics types
export interface DashboardStats {
    total_schools: number;
    validated_schools: number;
    total_students: number;
    total_diplomas: number;
    total_ipfs: number;
    total_revenue: number;
}
