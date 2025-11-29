import React, { useState, useEffect } from 'react';
import { Send, FileCheck, Loader2, DollarSign, Hash, Link as LinkIcon, Hexagon, AlertTriangle, Check, FileText, Image as ImageIcon } from 'lucide-react';
import { studentService } from '../services/supabase/studentService';
import { useAuth } from '../contexts/AuthContext';
import { Language } from '../types';
import { useTranslation } from '../services/i18n';
import { useMinting } from '../hooks/useMinting';
import { WalletConnect } from '../components/WalletConnect';
import { useWallet } from '@meshsdk/react';
import { billingService } from '../services/supabase/billingService';

interface IssuanceProps {
  lang: Language;
}

const Issuance: React.FC<IssuanceProps> = ({ lang }) => {
  const t = useTranslation(lang);
  const { schoolProfile } = useAuth();
  const { connected } = useWallet();
  const { mint, isMinting, error, successTx } = useMinting();

  const [students, setStudents] = useState<any[]>([]);
  const [step, setStep] = useState(1);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
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
      const studentsData = await studentService.getStudents();
      setStudents(studentsData);
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
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleIssue = async () => {
    if (!schoolProfile || !imageFile || selectedStudents.length === 0) {
      alert('Please select students and an image.');
      return;
    }
    if (!connected) {
      alert('Please connect your wallet.');
      return;
    }

    const studentsToMint = students.filter(s => selectedStudents.includes(s.id));
    const diplomaData = studentsToMint.map(student => ({
      studentName: student.fullName,
      studentId: student.studentId,
      courseName: student.faculty || 'General Studies',
      courseLevel: student.level,
      schoolName: schoolProfile.name,
      schoolId: schoolProfile.id,
    }));

    await mint(diplomaData, imageFile);
  };

  const resetState = () => {
    setStep(1);
    setSelectedStudents([]);
    setUploadedImage(null);
    setImageFile(null);
  };

  const fees = billingService.calculateFees(selectedStudents.length);

  if (successTx) {
    return (
      <div className="card bg-base-100 shadow-xl max-w-lg mx-auto mt-10 text-center p-8 border-t-8 border-success">
        <h2 className="text-3xl font-bold">NFTs Minted Successfully!</h2>
        <a href={`https://preprod.cardanoscan.io/transaction/${successTx}`} target="_blank" rel="noopener noreferrer">View Transaction</a>
        <button className="btn btn-primary mt-6 w-full" onClick={resetState}>Issue Another Batch</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">{t('issuance')}</h2>
        <WalletConnect />
      </div>

      <ul className="steps w-full">
        <li className={`step ${step >= 1 ? 'step-primary' : ''}`}>Select Recipients</li>
        <li className={`step ${step >= 2 ? 'step-primary' : ''}`}>Select Image</li>
        <li className={`step ${step >= 3 ? 'step-primary' : ''}`}>Mint NFTs</li>
      </ul>

      {step === 1 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Select Recipients</h3>
            <div className="overflow-x-auto h-96 border rounded-lg">
              <table className="table table-pin-rows">
                <thead className="bg-base-200">
                  <tr>
                    <th><input type="checkbox" onChange={(e) => setSelectedStudents(e.target.checked ? students.map(s => s.id) : [])} /></th>
                    <th>Name</th>
                    <th>Matricule</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id}>
                      <td><input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => handleToggleStudent(s.id)} /></td>
                      <td>{s.fullName}</td>
                      <td>{s.studentId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card-actions justify-end mt-4">
              <button className="btn btn-primary px-8" disabled={selectedStudents.length === 0} onClick={() => setStep(2)}>Next</button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
             <h3 className="card-title">Upload Diploma Image</h3>
             <input type="file" accept="image/*" onChange={handleImageUpload} className="file-input file-input-bordered file-input-primary w-full" />
             {uploadedImage && <img src={uploadedImage} alt="Preview" className="w-full h-auto max-h-96 object-contain rounded" />}
             <div className="flex justify-between mt-8">
                <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
                <button className="btn btn-primary px-8" disabled={!uploadedImage} onClick={() => setStep(3)}>Next</button>
             </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Transaction Summary</h3>
            <div className="overflow-x-auto my-4">
              <table className="table">
                <tbody>
                  <tr>
                    <td>Network Gas Fee (2%)</td>
                    <td className="text-right font-mono">${fees.networkFee.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>IPFS Pinning Service</td>
                    <td className="text-right font-mono">${fees.ipfsFee.toFixed(3)}</td>
                  </tr>
                  <tr className="font-bold text-lg">
                    <td>Total Estimated Cost</td>
                    <td className="text-right text-primary">${fees.total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {isMinting ? (
              <p>Minting in progress...</p>
            ) : (
              <>
                {error && <p className="text-red-500">{error}</p>}
                <button className="btn btn-primary" onClick={handleIssue} disabled={isMinting}>Pay & Mint NFTs</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Issuance;
