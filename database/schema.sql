create extension if not exists pgcrypto;

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null unique,
  telegram_username text,
  telegram_first_name text,
  telegram_last_name text,
  telegram_link text not null,
  phone text,
  email text,
  loyalty_points integer not null default 0,
  loyalty_level text not null default 'base',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  lead_type text not null check (
    lead_type in ('personal_consultation', 'situation_description', 'loyalty_interest')
  ),
  message text,
  status text not null default 'new' check (
    status in ('new', 'contacted', 'booked', 'closed')
  ),
  source text not null default 'telegram_bot',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bot_sessions (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null unique,
  step text not null default 'idle' check (
    step in ('idle', 'waiting_for_consent', 'waiting_for_situation')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists personal_data_consents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  telegram_id bigint not null,
  consent_text_version text not null,
  source text not null default 'telegram_bot',
  accepted_at timestamptz not null default now(),
  personal_data_policy_url text not null,
  user_agreement_url text not null,
  personal_data_consent_url text not null,
  public_offer_url text not null
);

alter table if exists personal_data_consents
  add column if not exists source text not null default 'telegram_bot',
  add column if not exists personal_data_policy_url text not null default '',
  add column if not exists user_agreement_url text not null default '',
  add column if not exists personal_data_consent_url text not null default '',
  add column if not exists public_offer_url text not null default '';

alter table if exists personal_data_consents
  alter column source set default 'telegram_bot';

create table if not exists consultation_slots (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'available' check (
    status in ('available', 'reserved', 'booked', 'cancelled')
  ),
  client_id uuid references clients(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  title text,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  points_delta integer not null,
  reason text,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists idx_clients_telegram_username
  on clients (telegram_username);

create index if not exists idx_leads_client_id
  on leads (client_id);

create index if not exists idx_leads_status_created_at
  on leads (status, created_at desc);

create index if not exists idx_leads_lead_type
  on leads (lead_type);

create index if not exists idx_consents_telegram_version
  on personal_data_consents (telegram_id, consent_text_version, accepted_at desc);

create index if not exists idx_consultation_slots_status_starts_at
  on consultation_slots (status, starts_at);

create index if not exists idx_loyalty_transactions_client_id
  on loyalty_transactions (client_id, created_at desc);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_clients_updated_at on clients;
create trigger trg_clients_updated_at
before update on clients
for each row
execute function set_updated_at();

drop trigger if exists trg_leads_updated_at on leads;
create trigger trg_leads_updated_at
before update on leads
for each row
execute function set_updated_at();

drop trigger if exists trg_bot_sessions_updated_at on bot_sessions;
create trigger trg_bot_sessions_updated_at
before update on bot_sessions
for each row
execute function set_updated_at();

drop trigger if exists trg_consultation_slots_updated_at on consultation_slots;
create trigger trg_consultation_slots_updated_at
before update on consultation_slots
for each row
execute function set_updated_at();
