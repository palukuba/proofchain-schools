import React, { useState, useEffect } from 'react';
import { CreditCard, Download, ExternalLink, DollarSign, Calendar, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { billingService } from '../services/supabase/billingService';
import { authService } from '../services/supabase/authService';
import { useAuth } from '../contexts/AuthContext';
import { Language } from '../types';
import { useTranslation } from '../services/i18n';

interface BillingProps {
  lang: Language;
}

const Billing: React.FC<BillingProps> = ({ lang }) => {
  const t = useTranslation(lang);
  const { schoolProfile } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Calculator State
  const [calcQty, setCalcQty] = useState<number>(1);
  const [calcResult, setCalcResult] = useState<{ ipfsFee: number, networkFee: number, total: number }>({ ipfsFee: 0, networkFee: 0, total: 0 });

  useEffect(() => {
    if (schoolProfile) {
      loadBillingData();
    }
  }, [schoolProfile]);

  const loadBillingData = async () => {
    try {
      if (!schoolProfile) return;

      const txs = await billingService.getTransactions(schoolProfile.id);
      setTransactions(txs);

      // Calculate balance (mock calculation based on transactions for now)
      const totalSpent = txs.reduce((acc, tx) => acc + tx.amount, 0);
      setBalance(1000 - totalSpent); // Assuming initial credit of 1000

    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fees = billingService.calculateFees(calcQty);
    setCalcResult(fees);
  }, [calcQty]);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">{t('billing')}</h2>

      {/* Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-primary text-primary-content shadow-xl">
          <div className="card-body">
            <h3 className="card-title text-sm opacity-90">Current Balance</h3>
            <div className="text-4xl font-bold">${balance.toFixed(2)}</div>
            <div className="card-actions justify-end mt-4">
              <button className="btn btn-sm btn-secondary">
                <CreditCard size={16} className="mr-2" />
                Add Funds
              </button>
            </div>
          </div>
        </div>

        {/* Fee Calculator */}
        <div className="card bg-base-100 shadow-xl md:col-span-2">
          <div className="card-body">
            <h3 className="card-title text-sm opacity-70">Fee Calculator</h3>
            <div className="flex items-end gap-4">
              <div className="form-control w-full max-w-xs">
                <label className="label">
                  <span className="label-text">Number of Diplomas</span>
                </label>
                <input
                  type="number"
                  min="1"
                  className="input input-bordered"
                  value={calcQty}
                  onChange={(e) => setCalcQty(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="stats shadow bg-base-200 w-full">
                <div className="stat place-items-center">
                  <div className="stat-title text-xs">Network Fee (2%)</div>
                  <div className="stat-value text-lg">${calcResult.networkFee.toFixed(2)}</div>
                </div>
                <div className="stat place-items-center">
                  <div className="stat-title text-xs">Storage Fee</div>
                  <div className="stat-value text-lg">${calcResult.ipfsFee.toFixed(2)}</div>
                </div>
                <div className="stat place-items-center bg-primary text-primary-content">
                  <div className="stat-title text-xs opacity-80">Total Cost</div>
                  <div className="stat-value text-lg">${calcResult.total.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title mb-4">Transaction History</h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="text-sm opacity-70">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {tx.kind === 'network_fee' ? <ArrowUpRight size={16} className="text-warning" /> : <ArrowDownLeft size={16} className="text-success" />}
                        <span className="capitalize">{tx.kind.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="font-mono font-bold">
                      ${tx.amount.toFixed(2)}
                    </td>
                    <td>
                      <div className="badge badge-sm badge-success uppercase">Completed</div>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-xs">
                        <Download size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 opacity-50">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
