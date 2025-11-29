import React from 'react';
import { CardanoWallet, useWallet } from '@meshsdk/react';

export const WalletConnect = () => {
    const { connected, name, connecting } = useWallet();

    return (
        <div className="flex items-center gap-4">
            <div className="cardano-wallet-wrapper">
                <CardanoWallet isDark={false} />
            </div>
            {connected && (
                <span className="text-sm text-green-600 font-medium">
                    Connected: {name}
                </span>
            )}
        </div>
    );
};
