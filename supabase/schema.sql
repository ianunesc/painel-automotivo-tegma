-- ============================================================
-- Painel do Mercado Automotivo — Tegma RI
-- Schema do banco de dados (Supabase/PostgreSQL)
-- ============================================================

-- 1. INDICADORES MENSAIS (mercado + crédito)
create table monthly_values (
  id               uuid primary key default gen_random_uuid(),
  indicator        text not null check (indicator in (
    'licenciamento', 'producao', 'exportacao', 'importados',
    'credito_saldo', 'credito_concessao', 'credito_juros', 'credito_inadimplencia'
  )),
  ref_month        date not null, -- sempre dia 1 do mês (ex: 2026-05-01)
  value            numeric not null,
  source           text not null default 'manual',
  edited_manually  boolean not null default false,
  updated_at       timestamptz not null default now(),
  unique (indicator, ref_month)
);

-- 2. VENDAS POR MONTADORA (licenciamento — top 40 + "Outras")
create table brand_sales (
  id               uuid primary key default gen_random_uuid(),
  ref_month        date not null,
  brand            text not null,
  units            numeric not null,
  source           text not null default 'autoo',
  edited_manually  boolean not null default false,
  updated_at       timestamptz not null default now(),
  unique (ref_month, brand)
);

-- 3. VENDAS POR REGIÃO (Fenabrave — % e valor absoluto)
create table region_sales (
  id               uuid primary key default gen_random_uuid(),
  ref_month        date not null,
  region           text not null check (region in ('Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul')),
  share_pct        numeric not null, -- 0-1
  units            numeric not null, -- share_pct * licenciamento do mês
  source           text not null default 'fenabrave',
  edited_manually  boolean not null default false,
  updated_at       timestamptz not null default now(),
  unique (ref_month, region)
);

-- 4. INDICADORES ANUAIS (frota — Sindipeças)
create table annual_values (
  id               uuid primary key default gen_random_uuid(),
  indicator        text not null check (indicator in ('frota_circulante', 'idade_media_frota')),
  ref_year         integer not null,
  value            numeric, -- pode ser nulo (ex: idade média não disponível em 2022)
  source           text not null default 'sindipecas',
  edited_manually  boolean not null default false,
  updated_at       timestamptz not null default now(),
  unique (indicator, ref_year)
);

-- 5. DIAS ÚTEIS (para licenciamento/dia útil) — pré-carregada, editável
create table business_days (
  ref_month        date primary key,
  dias_uteis       integer not null,
  edited_manually  boolean not null default false
);

-- 6. LOG DE INGESTÃO (uso interno do Admin)
create table ingest_log (
  id          uuid primary key default gen_random_uuid(),
  source      text not null, -- 'bcb' | 'anfavea' | 'autoo' | 'regioes' | 'frota'
  ref_month   date,
  status      text not null check (status in ('ok', 'erro', 'alerta')),
  message     text,
  created_at  timestamptz not null default now()
);

-- 7. ADMIN (apenas o Ian — vinculado ao Supabase Auth)
create table admins (
  id      uuid primary key references auth.users(id) on delete cascade,
  email   text not null
);

-- ============================================================
-- SEGURANÇA: Row Level Security
-- Leitura pública (painel é aberto); escrita só para admin
-- ============================================================

alter table monthly_values  enable row level security;
alter table brand_sales     enable row level security;
alter table region_sales    enable row level security;
alter table annual_values   enable row level security;
alter table business_days   enable row level security;
alter table ingest_log      enable row level security;
alter table admins          enable row level security;

create policy "public_read" on monthly_values for select using (true);
create policy "public_read" on brand_sales    for select using (true);
create policy "public_read" on region_sales   for select using (true);
create policy "public_read" on annual_values  for select using (true);
create policy "public_read" on business_days  for select using (true);

create policy "admin_write" on monthly_values for all using (
  exists (select 1 from admins where id = auth.uid())
);
create policy "admin_write" on brand_sales for all using (
  exists (select 1 from admins where id = auth.uid())
);
create policy "admin_write" on region_sales for all using (
  exists (select 1 from admins where id = auth.uid())
);
create policy "admin_write" on annual_values for all using (
  exists (select 1 from admins where id = auth.uid())
);
create policy "admin_write" on business_days for all using (
  exists (select 1 from admins where id = auth.uid())
);
create policy "admin_only" on ingest_log for all using (
  exists (select 1 from admins where id = auth.uid())
);
create policy "self_read" on admins for select using (id = auth.uid());

-- ============================================================
-- ÍNDICES
-- ============================================================

create index idx_monthly_values_indicator on monthly_values(indicator, ref_month);
create index idx_brand_sales_month        on brand_sales(ref_month);
create index idx_region_sales_month       on region_sales(ref_month);
create index idx_annual_values_indicator  on annual_values(indicator, ref_year);

-- ============================================================
-- Depois de criar seu usuário no Supabase Auth (Authentication > Users),
-- rode este comando trocando o e-mail para liberar o acesso Admin:
--
-- insert into admins (id, email)
-- select id, email from auth.users where email = 'SEU_EMAIL_AQUI';
-- ============================================================
