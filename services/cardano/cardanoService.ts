import { BlockfrostProvider, MeshTxBuilder, AssetMetadata } from '@meshsdk/core';
import { policyService } from './policyService';

const BLOCKFROST_PROJECT_ID = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;

if (!BLOCKFROST_PROJECT_ID) {
    console.warn('⚠️ CRITICAL: VITE_BLOCKFROST_PROJECT_ID is not set. Cardano NFT features will not work.');
    console.warn('📝 To enable Cardano features, add VITE_BLOCKFROST_PROJECT_ID to your .env file.');
    console.warn('🔗 Get a free API key at: https://blockfrost.io');
}

// Validate format (should start with 'preprod' or 'mainnet')
if (BLOCKFROST_PROJECT_ID && !BLOCKFROST_PROJECT_ID.startsWith('preprod') && !BLOCKFROST_PROJECT_ID.startsWith('mainnet')) {
    console.warn('⚠️ Blockfrost Project ID format may be incorrect. Expected format: preprod... or mainnet...');
}

export const provider = BLOCKFROST_PROJECT_ID ? new BlockfrostProvider(BLOCKFROST_PROJECT_ID) : null;

export const cardanoService = {
    /**
     * Upload image to IPFS using Blockfrost
     */
    async uploadToIPFS(file: File): Promise<string> {
        if (!BLOCKFROST_PROJECT_ID) {
            throw new Error('Blockfrost API key not configured. Please add VITE_BLOCKFROST_PROJECT_ID to your .env file.');
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('https://ipfs.blockfrost.io/api/v0/ipfs/add', {
            method: 'POST',
            headers: {
                'project_id': BLOCKFROST_PROJECT_ID,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('IPFS upload failed:', errorText);
            throw new Error(`Failed to upload to IPFS: ${response.statusText}`);
        }

        const data = await response.json();
        return `ipfs://${data.ipfs_hash}`;
    },

    /**
     * Upload metadata JSON to IPFS
     */
    async uploadMetadataToIPFS(metadata: any): Promise<string> {
        if (!BLOCKFROST_PROJECT_ID) {
            throw new Error('Blockfrost API key not configured. Please add VITE_BLOCKFROST_PROJECT_ID to your .env file.');
        }

        const blob = new Blob([JSON.stringify(metadata, null, 2)], {
            type: 'application/json'
        });
        const file = new File([blob], 'metadata.json');

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('https://ipfs.blockfrost.io/api/v0/ipfs/add', {
            method: 'POST',
            headers: {
                'project_id': BLOCKFROST_PROJECT_ID,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Metadata IPFS upload failed:', errorText);
            throw new Error(`Failed to upload metadata to IPFS: ${response.statusText}`);
        }

        const data = await response.json();
        return `ipfs://${data.ipfs_hash}`;
    },

    /**
     * Mint a Diploma NFT
     */
    async mintDiploma(
        wallet: any,
        diplomaData: {
            studentName: string;
            studentId: string;
            courseName: string;
            courseLevel?: string;
            faculty?: string;
            graduationDate?: string;
            diplomaNumber?: string;
            schoolName?: string;
            schoolId: string;
        },
        ipfsImage: string,
        additionalMetadata?: any
    ): Promise<string> {
        if (!wallet) throw new Error('Wallet not connected');
        if (!BLOCKFROST_PROJECT_ID || !provider) {
            throw new Error('Blockfrost API key not configured. Please add VITE_BLOCKFROST_PROJECT_ID to your .env file.');
        }

        try {
            // 1. Get wallet details
            const utxos = await wallet.getUtxos();
            const changeAddress = await wallet.getChangeAddress();

            if (!utxos || utxos.length === 0) {
                throw new Error('No UTXOs available. Please fund your wallet with ADA.');
            }

            // 2. Get or create the minting policy
            const { policyId, script } = await policyService.getOrCreateSchoolPolicy(diplomaData.schoolId, wallet);

            // 3. Generate unique asset name (using a more robust method)
            const assetName = `CertiChain_${diplomaData.studentId}_${Date.now()}`;
            const assetNameHex = Buffer.from(assetName, 'utf8').toString('hex');

            // 4. Create CIP-25 compliant metadata
            const metadata: AssetMetadata = {
                name: `Diploma - ${diplomaData.studentName}`,
                image: ipfsImage,
                description: `Official ${diplomaData.courseLevel || 'Academic'} Diploma in ${diplomaData.courseName} from ${diplomaData.schoolName || 'our institution'}.`,
                mediaType: 'image/png', // Or appropriate type
                files: [{
                    name: 'Diploma Image',
                    mediaType: 'image/png', // Or appropriate type
                    src: ipfsImage,
                }],

                // Custom Diploma Standard
                "standard": "CertiChain Diploma v1.0",
                "student_name": diplomaData.studentName,
                "student_id": diplomaData.studentId,
                "course_name": diplomaData.courseName,
                "course_level": diplomaData.courseLevel || 'N/A',
                "faculty": diplomaData.faculty || 'N/A',
                "graduation_date": diplomaData.graduationDate || new Date().toISOString().split('T')[0],
                "diploma_number": diplomaData.diplomaNumber || `CERT-${Date.now()}`,
                "issuer_name": diplomaData.schoolName || 'Educational Institution',
                "issuer_id": diplomaData.schoolId,
                ...additionalMetadata
            };

            // 5. Build the transaction with MeshTxBuilder
            const txBuilder = new MeshTxBuilder({
                fetcher: provider,
                submitter: provider,
            });

            const unsignedTx = await txBuilder
                .selectUtxosFrom(utxos)
                .mint(1, policyId, assetNameHex)
                .metadataValue(721, { [policyId]: { [assetNameHex]: metadata } })
                .changeAddress(changeAddress)
                .complete();

            // 6. Sign the transaction
            const signedTx = await wallet.signTx(unsignedTx, true); // Partial sign if needed

            // 7. Submit the transaction
            const txHash = await wallet.submitTx(signedTx);

            console.log('✅ NFT Diploma minted successfully! Transaction Hash:', txHash);
            return txHash;

        } catch (error: any) {
            console.error('❌ Error minting diploma NFT:', error);

            let errorMessage = 'Failed to mint diploma.';
            if (error?.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            // Provide more specific user-friendly messages
            if (errorMessage.includes('UTxO Balance Insufficient')) {
                errorMessage = 'Insufficient funds. Please ensure your wallet has enough ADA to cover the transaction fees.';
            } else if (errorMessage.includes('User declined the transaction')) {
                errorMessage = 'Transaction was cancelled by the user.';
            }

            throw new Error(errorMessage);
        }
    }
};