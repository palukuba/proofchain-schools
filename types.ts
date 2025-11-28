
export enum Language {
  FR = 'fr',
  EN = 'en',
  SW = 'sw', // Swahili
  LI = 'li'  // Lingala
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  FOREST = 'forest'
}

export enum DiplomaStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PINNED_IPFS = 'PINNED_IPFS',
  REVOKED = 'REVOKED'
}

export enum KYCStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  MISSING = 'MISSING',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED' // Intermediate state
}

export interface Student {
  id: string;
  fullName: string;
  studentId: string; // Matricule
  email: string;
  year: string;
  level: string; // e.g., 'Licence 3'
  faculty: string;
  grade?: string; // Cote (e.g. 75%)
  documentType?: string; // e.g. Diplôme, Certificat
}

// New Flexible Template System
export type ElementType = 'text' | 'image' | 'qr' | 'variable';

export interface TemplateElement {
  id: string;
  type: ElementType;
  label: string; // For UI identification
  content: string; // Text content or Image URL or Variable placeholder
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  width?: number; // px
  height?: number; // px
  fontSize?: number; // px
  color?: string;
  fontFamily?: string;
  fontWeight?: string;
}

export interface DiplomaTemplate {
  id: string;
  name: string;
  layout: 'landscape' | 'portrait';
  width: number; // px
  height: number; // px
  elements: TemplateElement[];
  backgroundImage?: string;
}

export interface IssuedDiploma {
  id: string;
  studentId: string;
  studentName: string; // Denormalized for display
  templateId: string;
  status: DiplomaStatus;
  ipfsHash?: string;
  issueDate: string;
  networkFee: number;
  ipfsFee: number;
  transactionId?: string;
}

export interface SchoolProfile {
  id: string;
  name: string;
  emailDomain: string;
  contactEmail: string;
  kycStatus: KYCStatus;
  issuedCount: number; // Global counter for billing logic
  logoUrl: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl: string;
}

export interface AppSettings {
  schoolName: string;
  diplomaPrice: number; // Base price charged to student, used to calc 2% network fee
  ipfsGateway: string;
  stripePublicKey: string;
}

export interface BillingStats {
  totalIssued: number;
  freeTierLimit: number; // 100
  nextTierCost: number; // 1$ per 1000
  networkFeeRate: number; // 2%
  pendingBalance: number;
}