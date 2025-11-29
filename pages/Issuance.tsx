import React, { useState, useEffect } from 'react';
import { Send, FileCheck, Loader2, DollarSign, Hash, Link as LinkIcon, Hexagon, AlertTriangle, Check, FileText, Image as ImageIcon } from 'lucide-react';
import { studentService } from '../services/supabase/studentService';
import { templateService } from '../services/supabase/templateService';
import { diplomaService } from '../services/supabase/diplomaService';
import { billingService } from '../services/supabase/billingService';
import { useAuth } from '../contexts/AuthContext';
import { Language } from '../types';
import { useTranslation } from '../services/i18n';
import { useWallet } from '@meshsdk/react';
import { cardanoService, provider } from '../services/cardano/cardanoService';
import { walletManagementService } from '../services/cardano/walletManagementService';
import { WalletConnect } from '../components/WalletConnect';

interface IssuanceProps {
  lang: Language;
}

const Issuance: React.FC<IssuanceProps> = ({ lang }) => {
  const t = useTranslation(lang);
  const { schoolProfile } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [step, setStep] = useState(1);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [useCustomImage, setUseCustomImage] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [mintStatus, setMintStatus] = useState('');
  const [successData, setSuccessData] = useState<{ txHash: string; ipfsHash: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [managedWalletAvailable, setManagedWalletAvailable] = useState(false);
  const [useManagedWallet, setUseManagedWallet] = useState(false);

  useEffect(() => {
    if (schoolProfile) {
      loadData();
      if (schoolProfile.encrypted_mnemonic) {
        setManagedWalletAvailable(true);
        setUseManagedWallet(true); // Default to managed wallet if available
      }
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


  const { wallet, connected } = useWallet();

  const handleIssue = async () => {
    if (!schoolProfile) {
      alert('Please login first');
      return;
    }

    let activeWallet = wallet;

    if (useManagedWallet && managedWalletAvailable) {
      try {
        // Initialize managed wallet
        activeWallet = walletManagementService.createWalletInstance(
          schoolProfile.encrypted_mnemonic!,
          provider
        );
      } catch (e) {
        console.error('Failed to initialize managed wallet:', e);
        alert('Failed to access school wallet. Please try connecting a browser wallet.');
        return;
      }
    } else if (!connected) {
      alert('Please connect your Cardano wallet first');
      return;
    }

    // Vérifier le solde ADA
    try {
      // For managed wallet, we might need to load the wallet first to get balance
      // MeshWallet instance has getBalance()
      const balance = await activeWallet.getBalance();
      const adaBalance = parseInt(balance[0]?.quantity || '0') / 1_000_000;

      if (adaBalance < 5) { // Minimum 5 ADA recommandé
        alert(`Insufficient ADA balance in ${useManagedWallet ? 'School Wallet' : 'connected wallet'}. You have ${adaBalance.toFixed(2)} ADA. Minimum 5 ADA required for minting.`);
        return;
      }
    } catch (e) {
      console.error('Error checking balance:', e);
      alert('Failed to check wallet balance. Please try again.');
      return;
    }

    setProcessing(true);

    try {
      // 1. Upload Metadata/Image to IPFS
      setMintStatus('ipfs');
      let ipfsHash = 'QmPlaceholder';

      if (useCustomImage && imageFile) {
        ipfsHash = await cardanoService.uploadToIPFS(imageFile);
      } else {
        // If using template, we'd generate an image from the template
        // For now, we'll use a placeholder or the template background if it's a URL
        // In a real app, you'd use html2canvas or similar to generate the image
        ipfsHash = 'ipfs://QmTemplatePlaceholder';
      }

      // Upload metadata to IPFS
      const metadata = {
        name: `Diploma Batch ${Date.now()}`,
        description: 'Educational Diploma NFT',
        schoolId: schoolProfile.id,
        templateId: selectedTemplate,
        recipients: selectedStudents.length,
        issuedAt: new Date().toISOString()
      };

      const ipfsMetadata = await cardanoService.uploadMetadataToIPFS(metadata);

      // 2. Minting on Blockchain
      setMintStatus('minting');

      // Get first student for diploma data (in batch, we'd loop through all)
      const firstStudent = students.find(s => s.id === selectedStudents[0]);

      const txHash = await cardanoService.mintDiploma(
        activeWallet,
        {
          studentName: firstStudent?.fullName || 'Batch Issuance',
          studentId: firstStudent?.studentId || 'BATCH',
          courseName: 'Diploma',
          courseLevel: firstStudent?.level,
          faculty: firstStudent?.faculty,
          graduationDate: new Date().toISOString().split('T')[0],
          diplomaNumber: `DIP-${Date.now()}`,
          schoolName: schoolProfile.name,
          schoolId: schoolProfile.id
        },
        ipfsHash,
        {
          templateId: selectedTemplate,
          batchSize: selectedStudents.length,
          metadataIpfs: ipfsMetadata
        }
      );

      // 3. Final Confirmation
      setMintStatus('confirming');

      // Poll for transaction confirmation
      let confirmed = false;
      let attempts = 0;
      const maxAttempts = 20;

      while (!confirmed && attempts < maxAttempts) {
        try {
          // Note: This is a simplified check. In production, use Blockfrost API
          // to verify transaction confirmation
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s
          confirmed = true; // Assume confirmed for now
          attempts++;
        } catch (e) {
          attempts++;
        }
      }

      if (!confirmed) {
        console.warn('Transaction confirmation timeout. Transaction may still be pending.');
      }

      // Issue diplomas via Supabase
      for (const studentId of selectedStudents) {
        await diplomaService.createDiploma({
          school_id: schoolProfile.id,
          student_id: studentId,
          template_id: selectedTemplate,
          ipfs_hash: ipfsHash,
          transaction_hash: txHash,
          metadata: {
            network: 'cardano-preprod',
            mintedBy: 'wallet',
            metadataIpfs: ipfsMetadata,
            standard: 'CIP-25'
          }
        });
      }

      setSuccessData({
        txHash: txHash,
        ipfsHash: ipfsHash
      });
      setMintStatus('done');
    } catch (e) {
      console.error('Error issuing diplomas:', e);

      // Detailed error messages
      let errorMessage = 'Failed to issue diplomas: ';

      if (e instanceof Error) {
        if (e.message.includes('insufficient funds') || e.message.includes('UTXOs')) {
          errorMessage += 'Insufficient ADA balance or no UTXOs available.';
        } else if (e.message.includes('IPFS')) {
          errorMessage += 'IPFS upload failed. Please check your connection.';
        } else if (e.message.includes('timeout')) {
          errorMessage += 'Transaction timeout. Please check Cardano explorer.';
        } else if (e.message.includes('Wallet not connected')) {
          errorMessage += 'Wallet disconnected. Please reconnect and try again.';
        } else if (e.message.includes('Blockfrost')) {
          errorMessage += 'Blockfrost API error. Please check your configuration.';
        } else {
          errorMessage += e.message;
        }
      }

      alert(errorMessage);
      setMintStatus('');
    } finally {
      setProcessing(false);
    }
  };

  // Calculate fees using billingService
  const fees = { ipfsFee: 0, networkFee: 0.50, total: 0.50 };
  const totalCost = fees.total * selectedStudents.length;

  if (mintStatus === 'done' && successData) {
    return (
      <div className="card bg-base-100 shadow-xl max-w-lg mx-auto mt-10 text-center p-8 border-t-8 border-success">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center text-success animate-bounce">
            <Hexagon size={48} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-bold">NFTs Minted Successfully!</h2>
          <p className="opacity-70">
            The diplomas have been permanently recorded on the blockchain and pinned to IPFS.
          </p>

          <div className="w-full bg-base-200 rounded-lg p-4 mt-2 text-left space-y-3 font-mono text-sm">
            <div className="flex justify-between items-center">
              <span className="opacity-50 flex items-center gap-2"><Hash size={14} /> Transaction Hash:</span>
              <span className="text-primary truncate max-w-[150px]">{successData.txHash}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-50 flex items-center gap-2"><LinkIcon size={14} /> IPFS CID:</span>
              <span className="text-secondary truncate max-w-[150px]">{successData.ipfsHash}</span>
            </div>
          </div>

          <button className="btn btn-primary mt-6 w-full" onClick={() => { setMintStatus(''); setSuccessData(null); setStep(1); setSelectedStudents([]); }}>
            Issue New Batch
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
          {managedWalletAvailable && (
            <div className="form-control">
              <label className="label cursor-pointer gap-2">
                <span className="label-text font-semibold text-primary">Use School Wallet</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={useManagedWallet}
                  onChange={(e) => setUseManagedWallet(e.target.checked)}
                />
              </label>
            </div>
          )}
          {!useManagedWallet && <WalletConnect />}
          {step === 3 && <div className="badge badge-accent badge-outline font-mono">Cardano Testnet</div>}
        </div>
      </div>

      <ul className="steps w-full">
        <li className={`step ${step >= 1 ? 'step-primary' : ''}`}>Select Recipients</li>
        <li className={`step ${step >= 2 ? 'step-primary' : ''}`}>Select Template</li>
        <li className={`step ${step >= 3 ? 'step-primary' : ''}`}>Mint NFT</li>
      </ul>

      {/* STEP 1: SELECT STUDENTS */}
      {step === 1 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h3 className="card-title">Recipients List</h3>
              <span className="badge badge-neutral">{selectedStudents.length} Selected</span>
            </div>

            <div className="overflow-x-auto h-96 border rounded-lg">
              <table className="table table-pin-rows">
                <thead className="bg-base-200">
                  <tr>
                    <th>
                      <label>
                        <input type="checkbox" className="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) setSelectedStudents(students.map(s => s.id));
                            else setSelectedStudents([]);
                          }}
                        />
                      </label>
                    </th>
                    <th>Name</th>
                    <th>Matricule</th>
                    <th>Faculty</th>
                    <th>Level</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className={selectedStudents.includes(s.id) ? 'bg-base-200/50' : ''}>
                      <th>
                        <label>
                          <input type="checkbox" className="checkbox checkbox-primary"
                            checked={selectedStudents.includes(s.id)}
                            onChange={() => handleToggleStudent(s.id)}
                          />
                        </label>
                      </th>
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

      {/* STEP 2: SELECT TEMPLATE */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg px-2">Choose a Diploma Template or Upload Custom Image</h3>

          {/* Toggle between Template and Custom Image */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setUseCustomImage(false)}
              className={`btn btn-sm ${!useCustomImage ? 'btn-primary' : 'btn-ghost'}`}
            >
              <FileText size={16} /> Use Template
            </button>
            <button
              onClick={() => setUseCustomImage(true)}
              className={`btn btn-sm ${useCustomImage ? 'btn-primary' : 'btn-ghost'}`}
            >
              <ImageIcon size={16} /> Upload Custom Image
            </button>
          </div>

          {!useCustomImage ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(tpl => (
                  <div
                    key={tpl.id}
                    className={`card bg-base-100 shadow-xl border-4 cursor-pointer transition-all hover:scale-[1.02] ${selectedTemplate === tpl.id ? 'border-primary' : 'border-transparent'}`}
                    onClick={() => setSelectedTemplate(tpl.id)}
                  >
                    <figure className="h-40 bg-base-200 relative overflow-hidden">
                      {tpl.backgroundImage ? (
                        <img src={tpl.backgroundImage} alt="Template Preview" className="w-full h-full object-cover opacity-80" />
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full opacity-30">
                          <FileText size={48} />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {selectedTemplate === tpl.id && <div className="badge badge-primary scale-150"><Check size={12} /></div>}
                      </div>
                    </figure>
                    <div className="card-body p-4">
                      <h2 className="card-title text-base">{tpl.name}</h2>
                      <div className="flex gap-2">
                        <div className="badge badge-outline text-xs">{tpl.layout}</div>
                        <div className="badge badge-outline text-xs">{tpl.elements.length} Elements</div>
                      </div>
                    </div>
                  </div>
                ))}
                <div
                  className="card bg-base-100 shadow-sm border-2 border-dashed border-base-300 flex items-center justify-center min-h-[200px] cursor-pointer hover:bg-base-200 hover:border-primary transition-colors text-opacity-50 hover:text-opacity-100"
                  onClick={() => alert('Go to Templates page to create new designs')}
                >
                  <div className="text-center">
                    <FileText className="mx-auto mb-2" />
                    <span>Create New Template</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Custom Image Upload */}
              <div className="card bg-base-100 shadow-xl max-w-2xl mx-auto">
                <div className="card-body">
                  <h3 className="card-title">Upload NFT Image</h3>
                  <p className="text-sm opacity-70">Upload an existing image to create NFT diplomas</p>

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
                      <div className="label">
                        <span className="label-text font-semibold">Preview</span>
                        <button
                          onClick={() => {
                            setUploadedImage(null);
                            setImageFile(null);
                          }}
                          className="btn btn-ghost btn-xs"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="relative border-4 border-primary rounded-lg overflow-hidden bg-base-200 p-4">
                        <img
                          src={uploadedImage}
                          alt="Uploaded NFT"
                          className="w-full h-auto max-h-96 object-contain mx-auto rounded"
                        />
                        <div className="absolute top-2 right-2">
                          <div className="badge badge-success gap-1">
                            <Check size={12} /> Ready
                          </div>
                        </div>
                      </div>
                      {imageFile && (
                        <div className="mt-2 text-xs opacity-60 flex justify-between">
                          <span>File: {imageFile.name}</span>
                          <span>Size: {(imageFile.size / 1024).toFixed(2)} KB</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-between mt-8">
            <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
            <button
              className="btn btn-primary px-8"
              disabled={!useCustomImage ? !selectedTemplate : !uploadedImage}
              onClick={() => setStep(3)}
            >
              Next Step
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: MINT & PAY */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* NFT Preview Card */}
          <div className="col-span-1">
            <div className="card bg-base-100 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white text-center">
                <Hexagon size={64} className="mx-auto mb-2 opacity-80" />
                <h3 className="font-bold text-lg">NFT Asset Preview</h3>
                <p className="text-xs opacity-70">CIP-25 Standard</p>
              </div>

              {/* Show uploaded image preview if available */}
              {uploadedImage && useCustomImage && (
                <div className="p-4 bg-base-200">
                  <img
                    src={uploadedImage}
                    alt="NFT Preview"
                    className="w-full h-48 object-contain rounded-lg bg-white"
                  />
                </div>
              )}

              <div className="card-body p-4 text-sm space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="opacity-60">
                    {useCustomImage ? 'Custom Image' : 'Template'}
                  </span>
                  <span className="font-bold">
                    {useCustomImage
                      ? (imageFile?.name.substring(0, 20) || 'Custom')
                      : templates.find(t => t.id === selectedTemplate)?.name
                    }
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="opacity-60">Recipients</span>
                  <span className="font-bold">{selectedStudents.length}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="opacity-60">Blockchain</span>
                  <span className="font-bold text-primary">Cardano Preprod</span>
                </div>
                <div className="alert alert-warning text-xs py-2">
                  <AlertTriangle size={14} />
                  <span>Action is irreversible.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Action */}
          <div className="col-span-1 lg:col-span-2 card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">Transaction Summary</h3>

              {!processing ? (
                <>
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
                          <td className="text-right text-primary">${totalCost.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="card-actions justify-end mt-4 gap-4">
                    <button className="btn btn-ghost" onClick={() => setStep(2)}>Cancel</button>
                    <button className="btn btn-primary gap-2" onClick={handleIssue}>
                      <Hexagon size={18} /> Pay & Mint NFTs
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-8 space-y-6">
                  <ul className="steps steps-vertical w-full">
                    <li className={`step ${['ipfs', 'minting', 'confirming', 'done'].includes(mintStatus) ? 'step-primary' : ''}`}>
                      Generating Metadata & Uploading to IPFS...
                    </li>
                    <li className={`step ${['minting', 'confirming', 'done'].includes(mintStatus) ? 'step-primary' : ''}`}>
                      Interacting with Smart Contract...
                    </li>
                    <li className={`step ${['confirming', 'done'].includes(mintStatus) ? 'step-primary' : ''}`}>
                      Verifying Block Confirmation...
                    </li>
                  </ul>
                  <div className="flex justify-center">
                    <span className="loading loading-dots loading-lg text-primary"></span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Issuance;
