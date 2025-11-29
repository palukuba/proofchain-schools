-- ============================================================
-- MIGRATION : Support NFT Cardano pour diplômes
-- Date : 2025-11-29
-- Description : Ajoute la table minting_policies et met à jour
--               la table diplomas pour supporter les NFT Cardano
-- ============================================================

-- ============================================================
-- TABLE : minting_policies (politiques de minting Cardano)
-- Chaque école a une politique unique pour tous ses diplômes NFT
-- ============================================================
create table if not exists public.minting_policies (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.school_profiles(user_id) on delete cascade,
  policy_id text not null unique,
  script jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Contrainte: une seule politique par école
  constraint unique_school_policy unique (school_id)
);

-- Index pour améliorer les performances de recherche
create index if not exists idx_minting_policies_school_id on public.minting_policies(school_id);
create index if not exists idx_minting_policies_policy_id on public.minting_policies(policy_id);

-- Commentaires pour documentation
comment on table public.minting_policies is 'Stocke les politiques de minting Cardano pour chaque école';
comment on column public.minting_policies.school_id is 'Référence à l''école propriétaire de la politique';
comment on column public.minting_policies.policy_id is 'ID de la politique Cardano (hash du script)';
comment on column public.minting_policies.script is 'Script de minting Cardano au format JSON';


-- ============================================================
-- MODIFICATION : Ajouter colonnes NFT à la table diplomas
-- ============================================================

-- Ajouter la colonne transaction_hash si elle n'existe pas
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'diplomas' 
    and column_name = 'transaction_hash'
  ) then
    alter table public.diplomas add column transaction_hash text;
  end if;
end $$;

-- Ajouter la colonne template_id si elle n'existe pas
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'diplomas' 
    and column_name = 'template_id'
  ) then
    alter table public.diplomas add column template_id uuid;
  end if;
end $$;

-- Commentaires pour les nouvelles colonnes
comment on column public.diplomas.transaction_hash is 'Hash de la transaction Cardano du NFT';
comment on column public.diplomas.template_id is 'Référence au template utilisé pour le diplôme';


-- ============================================================
-- TRIGGER : Mise à jour automatique de updated_at
-- ============================================================
create or replace function update_minting_policies_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_update_minting_policies_updated_at
  before update on public.minting_policies
  for each row
  execute function update_minting_policies_updated_at();


-- ============================================================
-- VUE : Statistiques NFT pour le dashboard
-- ============================================================

-- Vue pour compter les diplômes mintés sur la blockchain
create or replace view admin_stats_nft_diplomas as
select count(*) as total_nft_diplomas
from public.diplomas
where transaction_hash is not null;

-- Vue pour les statistiques par école
create or replace view school_nft_stats as
select 
  sp.user_id,
  sp.name as school_name,
  count(d.id) as total_diplomas,
  count(d.transaction_hash) filter (where d.transaction_hash is not null) as nft_diplomas,
  count(d.ipfs_hash) filter (where d.ipfs_hash is not null) as ipfs_diplomas,
  mp.policy_id
from public.school_profiles sp
left join public.diplomas d on d.school_id = sp.user_id
left join public.minting_policies mp on mp.school_id = sp.user_id
group by sp.user_id, sp.name, mp.policy_id;

comment on view school_nft_stats is 'Statistiques NFT par école';


-- ============================================================
-- FONCTION : Vérifier si un diplôme est un NFT valide
-- ============================================================
create or replace function is_valid_nft_diploma(diploma_id uuid)
returns boolean as $$
declare
  has_tx_hash boolean;
  has_ipfs boolean;
begin
  select 
    transaction_hash is not null,
    ipfs_hash is not null
  into has_tx_hash, has_ipfs
  from public.diplomas
  where id = diploma_id;
  
  return has_tx_hash and has_ipfs;
end;
$$ language plpgsql;

comment on function is_valid_nft_diploma is 'Vérifie si un diplôme est un NFT valide (a transaction_hash et ipfs_hash)';


-- ============================================================
-- FONCTION : Obtenir la politique de minting d'une école
-- ============================================================
create or replace function get_school_policy(school_user_id uuid)
returns table (
  policy_id text,
  script jsonb,
  created_at timestamptz
) as $$
begin
  return query
  select mp.policy_id, mp.script, mp.created_at
  from public.minting_policies mp
  where mp.school_id = school_user_id;
end;
$$ language plpgsql;

comment on function get_school_policy is 'Récupère la politique de minting d''une école';


-- ============================================================
-- POLITIQUE RLS (Row Level Security) - Optionnel
-- ============================================================

-- Activer RLS sur minting_policies
alter table public.minting_policies enable row level security;

-- Politique : Les écoles peuvent voir uniquement leur propre politique
create policy "Schools can view their own policy"
  on public.minting_policies
  for select
  using (auth.uid() = school_id);

-- Politique : Les écoles peuvent créer leur propre politique
create policy "Schools can create their own policy"
  on public.minting_policies
  for insert
  with check (auth.uid() = school_id);

-- Politique : Les écoles peuvent mettre à jour leur propre politique
create policy "Schools can update their own policy"
  on public.minting_policies
  for update
  using (auth.uid() = school_id);


-- ============================================================
-- DONNÉES DE TEST (Optionnel - à commenter en production)
-- ============================================================

-- Exemple d'insertion d'une politique de test
-- insert into public.minting_policies (school_id, policy_id, script)
-- values (
--   'uuid-de-votre-ecole-test',
--   'policy_test_123456',
--   '{"type": "all", "scripts": [{"type": "sig", "keyHash": "test_hash"}]}'::jsonb
-- );


-- ============================================================
-- VÉRIFICATION : Afficher les tables créées
-- ============================================================

-- Vérifier que la table minting_policies existe
select 
  table_name, 
  column_name, 
  data_type 
from information_schema.columns 
where table_schema = 'public' 
  and table_name = 'minting_policies'
order by ordinal_position;

-- Vérifier les nouvelles colonnes de diplomas
select 
  column_name, 
  data_type,
  is_nullable
from information_schema.columns 
where table_schema = 'public' 
  and table_name = 'diplomas'
  and column_name in ('transaction_hash', 'template_id')
order by ordinal_position;

