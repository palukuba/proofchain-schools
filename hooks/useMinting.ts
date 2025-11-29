import { useState } from 'react';
import { cardanoService } from '../services/cardano/cardanoService';
import { diplomaService } from '../services/supabase/diplomaService';
import { useWallet } from '@meshsdk/react';

// Define the shape of the diploma data required for minting
interface DiplomaMintingData {
    studentName: string;
    studentId: string;
    courseName: string;
    courseLevel?: string;
    faculty?: string;
    graduationDate?: string;
    diplomaNumber?: string;
    schoolName?: string;
    schoolId: string;
}

// Define the return type of the hook
interface UseMintingReturn {
    mint: (diplomaData: DiplomaMintingData[], diplomaImage: File) => Promise<void>;
    isMinting: boolean;
    error: string | null;
    successTx: string | null;
}

export const useMinting = (): UseMintingReturn => {
    const { wallet } = useWallet();
    const [isMinting, setIsMinting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successTx, setSuccessTx] = useState<string | null>(null);

    const mint = async (diplomaData: DiplomaMintingData[], diplomaImage: File) => {
        setIsMinting(true);
        setError(null);
        setSuccessTx(null);

        if (!wallet) {
            setError('Please connect your wallet before minting.');
            setIsMinting(false);
            return;
        }

        try {
            // Step 1: Upload diploma image to IPFS (once for the whole batch)
            const ipfsImageHash = await cardanoService.uploadToIPFS(diplomaImage);

            // Step 2: Mint NFTs for each student in the batch
            let lastTxHash = '';
            for (const diploma of diplomaData) {
                const txHash = await cardanoService.mintDiploma(
                    wallet,
                    diploma,
                    ipfsImageHash
                );

                // Step 3: Save diploma details to Supabase
                await diplomaService.createDiploma({
                    student_id: diploma.studentId,
                    school_id: diploma.schoolId,
                    course_name: diploma.courseName,
                    student_name: diploma.studentName,
                    ipfs_hash: ipfsImageHash,
                    transaction_hash: txHash,
                });
                lastTxHash = txHash;
            }

            setSuccessTx(lastTxHash);
            console.log('Batch minting completed. Last Transaction:', lastTxHash);

        } catch (e: any) {
            console.error('Minting process failed:', e);
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during minting.';
            setError(errorMessage);
        } finally {
            setIsMinting(false);
        }
    };

    return { mint, isMinting, error, successTx };
};