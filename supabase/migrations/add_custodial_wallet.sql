-- ============================================================
-- MIGRATION : Ajout du support pour Wallet Custodial
-- Date : 2025-11-29
-- Description : Ajoute la colonne encrypted_mnemonic à school_profiles
-- ============================================================

-- Ajouter la colonne encrypted_mnemonic si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'school_profiles' 
    AND column_name = 'encrypted_mnemonic'
  ) THEN
    ALTER TABLE public.school_profiles ADD COLUMN encrypted_mnemonic TEXT;
  END IF;
END $$;

-- Commentaire pour documentation
COMMENT ON COLUMN public.school_profiles.encrypted_mnemonic IS 'Phrase mnémonique chiffrée du wallet custodial de l''école';

-- Sécurité : S'assurer que seul l'utilisateur peut voir son mnémonique (si RLS est actif)
-- Note: Les politiques RLS existantes devraient déjà couvrir cela si elles sont basées sur user_id = auth.uid()
