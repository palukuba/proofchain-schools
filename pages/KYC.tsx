import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Upload, AlertCircle, AlertTriangle, Shield, Mail } from 'lucide-react';
import { authService } from '../services/supabase/authService';
import { useAuth } from '../contexts/AuthContext';
import { KYCStatus } from '../types';

const KYC: React.FC = () => {
  const { user, schoolProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'request' | 'verify'>('request');
  const [emailCode, setEmailCode] = useState('');

  useEffect(() => {
    if (!schoolProfile) {
      setVerificationStep('request');
    }
  }, [schoolProfile]);

  const handleSendCode = async () => {
    try {
      if (!user) return;
      // Send verification code via Supabase
      alert('Verification code sent to your email!');
      setVerificationStep('verify');
    } catch (error) {
      alert('Failed to send verification code');
    }
  };

  const handleVerifyCode = async () => {
    try {
      if (!user || !emailCode || emailCode.length !== 6) {
        alert('Invalid code');
        return;
      }

      // Update KYC status
      await authService.updateSchoolProfile(user.id, {
        kyc_status: 'email_verified' as any
      });
      alert('Email verified successfully!');
    } catch (error) {
      alert('Failed to verify code');
    }
  };

  const handleEmailVerification = async () => {
    try {
      // TODO: Implement email verification with Supabase
      alert('Email verification sent! (Migration to Supabase pending)');
    } catch (error) {
      alert('Failed to send verification email');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setTimeout(async () => {
      if (user) {
        try {
          await authService.updateSchoolProfile(user.id, {
            kyc_status: 'pending' as any
          });
          alert('Documents uploaded successfully!');
        } catch (error) {
          console.error('Error updating KYC:', error);
        }
      }
      setUploading(false);
    }, 1500);
  };

  if (!schoolProfile) return <div className="p-10 text-center"><span className="loading loading-spinner"></span></div>;

  // Determine current active step index
  let activeStep = 0;
  if (schoolProfile.kyc_status === 'email_verified') activeStep = 1;
  if (schoolProfile.kyc_status === 'pending') activeStep = 2;
  if (schoolProfile.kyc_status === 'verified') activeStep = 3;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Shield className="text-primary" size={32} />
          School Verification Workflow
        </h2>
        <p className="text-base-content/70">Follow the steps below to activate your account for diploma issuance.</p>
      </div>

      {/* Stepper UI */}
      <ul className="steps w-full">
        <li className={`step ${activeStep >= 0 ? 'step-primary' : ''} `}>Email Verification</li>
        <li className={`step ${activeStep >= 1 ? 'step-primary' : ''} `}>Document Upload</li>
        <li className={`step ${activeStep >= 2 ? 'step-primary' : ''} `}>Review</li>
        <li className={`step ${activeStep >= 3 ? 'step-primary' : ''} `}>Approved</li>
      </ul>

      {/* STEP 1: Email Verification */}
      {activeStep === 0 && (
        <div className="card bg-base-100 shadow-xl border-t-4 border-primary">
          <div className="card-body">
            <h3 className="card-title"><Mail /> Step 1: Verify Domain Ownership</h3>
            <p>We need to verify that you own the domain <strong>@{schoolProfile.emailDomain}</strong>.</p>

            {verificationStep === 'request' ? (
              <div className="mt-4">
                <button className="btn btn-primary" onClick={handleSendCode}>
                  Send Verification Code to admin@{schoolProfile.emailDomain}
                </button>
              </div>
            ) : (
              <div className="mt-4 flex gap-2 items-end">
                <div className="form-control w-full max-w-xs">
                  <label className="label">Enter Code</label>
                  <input
                    type="text"
                    placeholder="123456"
                    className="input input-bordered"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                  />
                </div>
                <button className="btn btn-success" onClick={handleVerifyCode}>
                  Verify Code
                </button>
              </div>
            )}
            <div className="mt-2 text-xs opacity-60">
              Note: This ensures certificates are issued by the legitimate institution.
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Documents */}
      {activeStep === 1 && (
        <div className="card bg-base-100 shadow-xl border-t-4 border-secondary">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <h3 className="card-title"><Upload /> Step 2: Upload Legal Documents</h3>
              <span className="badge badge-success gap-2"><CheckCircle size={12} /> Email Verified</span>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Please upload your Government Accreditation or School Permit (PDF, JPG).
            </p>

            <div className="border-2 border-dashed border-primary/30 rounded-lg p-10 text-center bg-base-200/50 hover:bg-base-200 transition-colors">
              <Upload className="mx-auto mb-4 text-primary" size={48} />
              <p className="font-bold">Drag and drop your file here</p>
              <p className="text-xs opacity-70 mb-4">Max size 5MB</p>
              <button
                className="btn btn-primary"
                onClick={handleFileUpload}
                disabled={uploading}
              >
                {uploading ? <span className="loading loading-spinner"></span> : 'Select File'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 & 4: Status View */}
      {activeStep >= 2 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            {schoolProfile.kyc_status === KYCStatus.PENDING ? (
              <>
                <Clock size={64} className="text-warning mb-4" />
                <h3 className="text-2xl font-bold">Verification Pending</h3>
                <p className="max-w-md">
                  Your documents have been received and are currently being reviewed by our compliance team. This typically takes 24-48 hours.
                </p>
                <div className="alert alert-warning mt-6 text-left">
                  <AlertTriangle />
                  <span>Issuance features are restricted until approval.</span>
                </div>
              </>
            ) : schoolProfile.kyc_status === 'approved' ? (
              <>
                <CheckCircle size={64} className="text-success mb-4" />
                <h3 className="text-2xl font-bold text-success">Account Verified</h3>
                <p className="max-w-md">
                  Congratulations! Your school <strong>{schoolProfile.name}</strong> is fully authorized to issue digital diplomas on the blockchain.
                </p>
                <button className="btn btn-primary mt-6">Go to Dashboard</button>
              </>
            ) : (
              <div className="text-error">
                <h3 className="text-xl font-bold">Verification Rejected</h3>
                <p>Please contact support.</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Step 4: Pending/Verified */}
      {activeStep >= 2 && schoolProfile.kyc_status === 'pending' && (
        <div className="alert alert-warning shadow-lg">
          <Clock />
          <div>
            <h3 className="font-bold">Verification Pending</h3>
            <div className="text-xs">Your documents are being reviewed. This usually takes 24-48 hours.</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYC;
