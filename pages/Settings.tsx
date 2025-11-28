import React, { useState, useEffect } from 'react';
import { Save, Building2, Globe, Mail, User, Lock } from 'lucide-react';
import { authService } from '../services/supabase/authService';
import { settingsService } from '../services/supabase/settingsService';
import { useAuth } from '../contexts/AuthContext';
import { Language } from '../types';
import { useTranslation } from '../services/i18n';

interface SettingsProps {
  lang: Language;
}

const Settings: React.FC<SettingsProps> = ({ lang }) => {
  const t = useTranslation(lang);
  const { schoolProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    schoolName: '',
    diplomaPrice: 25.00,
    ipfsGateway: 'https://ipfs.io/ipfs/',
    stripePublicKey: '',
  });

  useEffect(() => {
    if (schoolProfile) {
      loadSettings();
    }
  }, [schoolProfile]);

  const loadSettings = async () => {
    try {
      if (!schoolProfile) return;

      // Get global price config
      const priceConfig = await settingsService.getPriceConfig();

      setSettings({
        schoolName: schoolProfile.name,
        diplomaPrice: priceConfig?.storage_price_per_1000 || 25.00,
        ipfsGateway: 'https://ipfs.io/ipfs/',
        stripePublicKey: '',
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolProfile) return;

    setLoading(true);
    try {
      // Update school profile
      await authService.updateSchoolProfile(schoolProfile.id, {
        name: settings.schoolName
      });

      // Note: Price config is global and typically admin-only, 
      // so we might not want to update it here for a single school.
      // For now, we'll just update the local state/profile.

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold">{t('settings')}</h2>

      <form onSubmit={handleSave}>
        {/* School Profile Section */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h3 className="card-title flex items-center gap-2">
              <User size={20} className="text-primary" />
              {t('schoolProfile')}
            </h3>
            <div className="divider my-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">School Name</label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={settings.schoolName}
                  onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                />
              </div>
              <div className="form-control">
                <label className="label">Diploma Base Price ($)</label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={settings.diplomaPrice}
                  onChange={(e) => setSettings({ ...settings, diplomaPrice: parseFloat(e.target.value) })}
                />
                <label className="label">
                  <span className="label-text-alt text-warning">Basis for 2% network fee calculation</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* API Configuration */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h3 className="card-title flex items-center gap-2">
              <Lock size={20} className="text-secondary" />
              {t('apiConfig')}
            </h3>
            <div className="divider my-0"></div>

            <div className="form-control">
              <label className="label">IPFS Gateway URL</label>
              <div className="input-group flex">
                <span className="bg-base-200 p-3 rounded-l-lg border border-r-0 border-base-300"><Globe size={18} /></span>
                <input
                  type="text"
                  className="input input-bordered w-full rounded-l-none"
                  value={settings.ipfsGateway}
                  onChange={(e) => setSettings({ ...settings, ipfsGateway: e.target.value })}
                />
              </div>
            </div>

            <div className="form-control mt-4">
              <label className="label">Stripe Public Key</label>
              <input
                type="password"
                className="input input-bordered font-mono text-sm"
                value={settings.stripePublicKey}
                onChange={(e) => setSettings({ ...settings, stripePublicKey: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button type="button" className="btn btn-ghost">Cancel</button>
          <button type="submit" className="btn btn-primary gap-2" disabled={loading}>
            {loading ? <span className="loading loading-spinner"></span> : <Save size={18} />}
            {t('save')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
