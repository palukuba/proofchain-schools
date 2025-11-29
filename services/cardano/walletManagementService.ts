import { MeshWallet } from '@meshsdk/core';
import CryptoJS from 'crypto-js';

const APP_SECRET = import.meta.env.VITE_APP_SECRET;

if (!APP_SECRET) {
    console.warn('⚠️ VITE_APP_SECRET is not set. Wallet encryption will not be secure.');
}

export const walletManagementService = {
    /**
     * Génère un nouveau wallet Cardano
     * @returns {Promise<{mnemonic: string[], address: string}>}
     */
    async generateWallet(): Promise<{ mnemonic: string[], address: string }> {
        // Générer un mnémonique de 24 mots
        const mnemonic = MeshWallet.brew(true) as string[]; // true = 24 words

        // Créer une instance temporaire pour obtenir l'adresse
        const wallet = new MeshWallet({
            networkId: 0, // 0 = Preprod/Testnet, 1 = Mainnet
            fetcher: undefined,
            submitter: undefined,
            key: {
                type: 'mnemonic',
                words: mnemonic,
            },
        });

        const address = await wallet.getChangeAddress();

        return {
            mnemonic,
            address
        };
    },

    /**
     * Chiffre une phrase mnémonique
     * @param mnemonic La phrase mnémonique (tableau de mots ou chaîne)
     * @returns La chaîne chiffrée
     */
    encryptMnemonic(mnemonic: string[] | string): string {
        const mnemonicString = Array.isArray(mnemonic) ? mnemonic.join(' ') : mnemonic;
        return CryptoJS.AES.encrypt(mnemonicString, APP_SECRET || 'default-secret').toString();
    },

    /**
     * Déchiffre une phrase mnémonique
     * @param encryptedMnemonic La chaîne chiffrée
     * @returns La phrase mnémonique (tableau de mots)
     */
    decryptMnemonic(encryptedMnemonic: string): string[] {
        const bytes = CryptoJS.AES.decrypt(encryptedMnemonic, APP_SECRET || 'default-secret');
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);

        if (!decrypted) {
            throw new Error('Failed to decrypt mnemonic. Invalid secret or corrupted data.');
        }

        return decrypted.split(' ');
    },

    /**
     * Crée une instance de wallet à partir d'un mnémonique chiffré
     * @param encryptedMnemonic Le mnémonique chiffré
     * @param provider Le provider Blockfrost (optionnel)
     * @returns Instance MeshWallet
     */
    createWalletInstance(encryptedMnemonic: string, provider?: any): MeshWallet {
        const mnemonic = this.decryptMnemonic(encryptedMnemonic);

        return new MeshWallet({
            networkId: 0, // Preprod
            fetcher: provider,
            submitter: provider,
            key: {
                type: 'mnemonic',
                words: mnemonic,
            },
        });
    }
};
