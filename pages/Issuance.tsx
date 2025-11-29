import React, { useState, useEffect } from 'react';
import { Send, FileCheck, Loader2, DollarSign, Hash, Link as LinkIcon, Hexagon, AlertTriangle, Check, FileText, Image as ImageIcon } from 'lucide-react';
import { studentService } from '../services/supabase/studentService';
import { templateService } from '../services/supabase/templateService';
import { useAuth } from '../contexts/AuthContext';
import { Language } from '../types';
import { useTranslation } from '../services/i18n';
import { useMinting } from '../hooks/useMinting';
import { WalletConnect } from '../components/WalletConnect';
import { useWallet } from '@meshsdk/react';

interface IssuanceProps {
  lang: Language;
}

const Issuance: React.FC<IssuanceProps> = ({ lang }) => {
  const t = useTranslation(lang);
  const { schoolProfile } = useAuth();
  const { connected } = useWallet();
  const { mint, isMinting, error, successTx } = useMinting();

  const [students, setStudents] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [step, setStep] = useState(1);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [useCustomImage, setUseCustomImage] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolProfile) {
      loadData();
    }
  }, [schoolProfile]);

  const loadData = async () => {
    try {
      if (!schoolProfile) return;

      const [studentsData, templatesData] = await Promise.all([
        studentService.getStudents(),
        templateService.getTemplates(schoolProfile.id)
      ]);

      setStudents(studentsData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStudent = (id: string) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setUseCustomImage(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIssue = async () => {
    if (!schoolProfile || !imageFile || selectedStudents.length === 0) {
      alert('Please ensure you have selected students and an image.');
      return;
    }

    if (!connected) {
      alert('Please connect your wallet first.');
      return;
    }

    // For simplicity, we mint one diploma for the first selected student.
    // Batch minting would require a loop and more complex transaction management.
    const studentToMint = students.find(s => s.id === selectedStudents[0]);

    if (!studentToMint) {
      alert('Selected student not found.');
      return;
    }

    const diplomaData = {
      studentName: studentToMint.fullName,
      studentId: studentToMint.studentId,
      courseName: studentToMint.faculty || 'General Studies',
      courseLevel: studentToMint.level,
      schoolName: schoolProfile.name,
      schoolId: schoolProfile.id,
    };

    await mint(diplomaData, imageFile);
  };

  const resetState = () => {
    setStep(1);
    setSelectedStudents([]);
    setSelectedTemplate('');
    setUseCustomImage(false);
    setUploadedImage(null);
    setImageFile(null);
  };

  // Fees calculation can be kept as is
  const fees = { ipfsFee: 0, networkFee: 0.50, total: 0.50 };
  const totalCost = fees.total * selectedStudents.length;

  if (successTx) {
    return (
      <div className="card bg-base-100 shadow-xl max-w-lg mx-auto mt-10 text-center p-8 border-t-8 border-success">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center text-success animate-bounce">
            <Hexagon size={48} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-bold">NFT Minted Successfully!</h2>
          <p className="opacity-70">
            The diploma has been permanently recorded on the blockchain.
          </p>

          <div className="w-full bg-base-200 rounded-lg p-4 mt-2 text-left space-y-3 font-mono text-sm">
            <div className="flex justify-between items-center">
              <span className="opacity-50 flex items-center gap-2"><Hash size={14} /> Transaction Hash:</span>
              <a href={`https://preprod.cardanoscan.io/transaction/${successTx}`} target="_blank" rel="noopener noreferrer" className="text-primary truncate max-w-[150px] hover:underline">{successTx}</a>
            </div>
          </div>

          <button className="btn btn-primary mt-6 w-full" onClick={resetState}>
            Issue Another Diploma
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">{t('issuance')}</h2>
        <div className="flex gap-4 items-center">
          <WalletConnect />
          {step === 3 && <div className="badge badge-accent badge-outline font-mono">Cardano Testnet</div>}
        </div>
      </div>

      <ul className="steps w-full">
        <li className={`step ${step >= 1 ? 'step-primary' : ''}`}>Select Recipient</li>
        <li className={`step ${step >= 2 ? 'step-primary' : ''}`}>Select Image</li>
        <li className={`step ${step >= 3 ? 'step-primary' : ''}`}>Mint NFT</li>
      </ul>

      {/* STEP 1: SELECT STUDENTS (Simplified to select one) */}
      {step === 1 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Select a Recipient</h3>
            <div className="overflow-x-auto h-96 border rounded-lg">
              <table className="table table-pin-rows">
                <thead className="bg-base-200">
                  <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Matricule</th>
                    <th>Faculty</th>
                    <th>Level</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className={selectedStudents.includes(s.id) ? 'bg-primary/10' : ''}>
                      <td>
                        <input type="radio" name="student-select" className="radio radio-primary"
                          checked={selectedStudents[0] === s.id}
                          onChange={() => setSelectedStudents([s.id])}
                        />
                      </td>
                      <td className="font-bold">{s.fullName}</td>
                      <td className="font-mono text-xs">{s.studentId}</td>
                      <td>{s.faculty}</td>
                      <td>{s.level}</td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-10 opacity-50">No students found. Please add students first.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="card-actions justify-end mt-4">
              <button
                className="btn btn-primary px-8"
                disabled={selectedStudents.length === 0}
                onClick={() => setStep(2)}
              >
                Next Step
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT IMAGE (Simplified from template/custom) */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="card bg-base-100 shadow-xl max-w-2xl mx-auto">
            <div className="card-body">
              <h3 className="card-title">Upload Diploma Image</h3>
              <p className="text-sm opacity-70">Upload the image to be minted as an NFT diploma.</p>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Select Image File</span>
                  <span className="label-text-alt">PNG, JPG, SVG</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="file-input file-input-bordered file-input-primary w-full"
                />
              </div>
              {uploadedImage && (
                <div className="mt-6">
                  <div className="label"><span className="label-text font-semibold">Preview</span></div>
                  <div className="border-4 border-primary rounded-lg p-4 bg-base-200">
                    <img src={uploadedImage} alt="Uploaded NFT" className="w-full h-auto max-h-96 object-contain rounded" />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between mt-8">
            <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
            <button className="btn btn-primary px-8" disabled={!uploadedImage} onClick={() => setStep(3)}>
              Next Step
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: MINT & PAY */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-1">
            <div className="card bg-base-100 shadow-xl">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white text-center">
                <h3 className="font-bold text-lg">NFT Asset Preview</h3>
              </div>
              {uploadedImage && (
                <div className="p-4 bg-base-200">
                  <img src={uploadedImage} alt="NFT Preview" className="w-full h-48 object-contain rounded-lg bg-white" />
                </div>
              )}
              <div className="card-body p-4 text-sm">
                <p>Recipient: <span className="font-bold">{students.find(s => s.id === selectedStudents[0])?.fullName}</span></p>
                <p>Blockchain: <span className="font-bold text-primary">Cardano Preprod</span></p>
              </div>
            </div>
          </div>
          <div className="col-span-1 lg:col-span-2 card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">Transaction Summary</h3>
              {isMinting ? (
                <div className="py-8 text-center">
                  <span className="loading loading-dots loading-lg text-primary"></span>
                  <p className="mt-4">Minting in progress... Please check your wallet to approve the transaction.</p>
                </div>
              ) : (
                <>
                  {error && <div className="alert alert-error"><AlertTriangle size={16} /><span>{error}</span></div>}
                  <div className="card-actions justify-end mt-4 gap-4">
                    <button className="btn btn-ghost" onClick={() => setStep(2)}>Cancel</button>
                    <button className="btn btn-primary gap-2" onClick={handleIssue} disabled={isMinting}>
                      <Hexagon size={18} /> Pay & Mint NFT
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Issuance;