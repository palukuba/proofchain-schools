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
    mint: (diplomaData: DiplomaMintingData, diplomaImage: File) => Promise<void>;
    isMinting: boolean;
    error: string | null;
    successTx: string | null;
}

export const useMinting = (): UseMintingReturn => {
    const { wallet } = useWallet();
    const [isMinting, setIsMinting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successTx, setSuccessTx] = useState<string | null>(null);

    const mint = async (diplomaData: DiplomaMintingData, diplomaImage: File) => {
        setIsMinting(true);
        setError(null);
        setSuccessTx(null);

        if (!wallet) {
            setError('Please connect your wallet before minting.');
            setIsMinting(false);
            return;
        }

        try {
            // Step 1: Upload diploma image to IPFS
            const ipfsImageHash = await cardanoService.uploadToIPFS(diplomaImage);

            // Step 2: Mint the NFT diploma on Cardano
            const txHash = await cardanoService.mintDiploma(
                wallet,
                diplomaData,
                ipfsImageHash
            );

            // Step 3: Save diploma details to Supabase
            // Note: This assumes you have a 'diplomas' table in Supabase
            await diplomaService.createDiploma({
                student_id: diplomaData.studentId,
                school_id: diplomaData.schoolId,
                course_name: diplomaData.courseName,
                student_name: diplomaData.studentName,
                ipfs_hash: ipfsImageHash,
                transaction_hash: txHash,
                // Add other relevant fields
            });

            setSuccessTx(txHash);
            console.log('Diploma successfully minted and recorded. Transaction:', txHash);

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