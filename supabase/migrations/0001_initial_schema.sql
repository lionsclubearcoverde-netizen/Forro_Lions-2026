-- ============================================================================
-- Gestão Lions — Esquema inicial (mesas, senhas, triggers e RLS)
-- Execute com: supabase db push  (ou no SQL Editor do painel Supabase)
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Tabela de mesas
-- ----------------------------------------------------------------------------
create table if not exists public.mesas (
  id uuid primary key default gen_random_uuid(),
  numero integer not null unique check (numero > 0),
  setor text not null check (setor in ('inferior', 'esquerda', 'direita')),
  linha integer not null default 0,
  coluna integer not null default 0,
  status text not null default 'livre' check (status in ('livre', 'reservada', 'paga')),
  responsavel text not null default '',
  telefone text not null default '',
  forma_pagamento text not null default '',
  valor_pago numeric(10,2) not null default 0 check (valor_pago >= 0),
  data_reserva timestamptz,
  data_pagamento timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Tabela de senhas individuais (valores calculados no servidor)
-- ----------------------------------------------------------------------------
create table if not exists public.senhas (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(trim(nome)) between 2 and 120),
  telefone text not null default '',
  quantidade integer not null default 1 check (quantidade between 1 and 100),
  valor_unitario numeric(10,2) not null default 40.00 check (valor_unitario >= 0),
  valor_total numeric(10,2) generated always as (quantidade * valor_unitario) stored,
  forma_pagamento text not null default '',
  data_venda timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Trigger: mantém updated_at e normaliza a mesa conforme o status
-- ----------------------------------------------------------------------------
create or replace function public.handle_mesa_update()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();

  if new.status = 'livre' then
    new.responsavel := '';
    new.telefone := '';
    new.forma_pagamento := '';
    new.valor_pago := 0;
    new.data_pagamento := null;
  elsif new.status = 'reservada' then
    if new.responsavel is null or trim(new.responsavel) = '' then
      raise exception 'O responsável é obrigatório para reservar a mesa.';
    end if;
    new.data_reserva := coalesce(new.data_reserva, now());
    new.forma_pagamento := '';
    new.valor_pago := 0;
    new.data_pagamento := null;
  elsif new.status = 'paga' then
    if new.responsavel is null or trim(new.responsavel) = '' then
      raise exception 'O responsável é obrigatório ao confirmar pagamento.';
    end if;
    if new.valor_pago <= 0 then
      raise exception 'O valor pago deve ser maior que zero.';
    end if;
    new.data_reserva := coalesce(new.data_reserva, now());
    new.data_pagamento := coalesce(new.data_pagamento, now());
  end if;

  return new;
end;
$$;

drop trigger if exists on_mesas_update on public.mesas;
create trigger on_mesas_update
  before update on public.mesas
  for each row execute function public.handle_mesa_update();

-- ----------------------------------------------------------------------------
-- Trigger: registra o usuário autenticado na venda de senha
-- ----------------------------------------------------------------------------
create or replace function public.set_senha_created_by()
returns trigger
language plpgsql
as $$
begin
  new.created_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists on_senhas_insert on public.senhas;
create trigger on_senhas_insert
  before insert on public.senhas
  for each row execute function public.set_senha_created_by();

-- ----------------------------------------------------------------------------
-- Row Level Security: apenas usuários autenticados operam o sistema
-- ----------------------------------------------------------------------------
alter table public.mesas enable row level security;
alter table public.senhas enable row level security;

drop policy if exists "mesas_auth_all" on public.mesas;
create policy "mesas_auth_all" on public.mesas
  for all to authenticated using (true) with check (true);

drop policy if exists "senhas_auth_all" on public.senhas;
create policy "senhas_auth_all" on public.senhas
  for all to authenticated using (true) with check (true);

-- ----------------------------------------------------------------------------
-- Índices de apoio às consultas mais frequentes
-- ----------------------------------------------------------------------------
create index if not exists idx_mesas_status on public.mesas (status);
create index if not exists idx_senhas_data_venda on public.senhas (data_venda desc);

-- ----------------------------------------------------------------------------
-- Realtime (para propagar mudanças entre operadores conectados)
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table public.mesas;
alter publication supabase_realtime add table public.senhas;

-- ----------------------------------------------------------------------------
-- Seed: layout oficial do salão (36 mesas) — executado apenas se estiver vazio
-- ----------------------------------------------------------------------------
insert into public.mesas (numero, setor, linha, coluna)
select * from (values
  -- Setor inferior (parte de baixo do mapa)
  (1, 'inferior', 0, 1), (2, 'inferior', 0, 2), (3, 'inferior', 0, 3),
  (4, 'inferior', 0, 8), (5, 'inferior', 0, 9), (6, 'inferior', 0, 10),
  (7, 'inferior', 1, 1), (8, 'inferior', 1, 2), (9, 'inferior', 1, 3),
  (10, 'inferior', 1, 8), (11, 'inferior', 1, 9), (12, 'inferior', 1, 10),
  -- Setor esquerda
  (13, 'esquerda', 2, 1), (14, 'esquerda', 2, 2), (15, 'esquerda', 2, 3),
  (16, 'esquerda', 3, 1), (17, 'esquerda', 3, 2), (18, 'esquerda', 3, 3),
  (19, 'esquerda', 4, 1), (20, 'esquerda', 4, 2), (21, 'esquerda', 4, 3),
  (22, 'esquerda', 5, 1), (23, 'esquerda', 5, 2), (24, 'esquerda', 5, 3),
  -- Setor direita
  (25, 'direita', 2, 8), (26, 'direita', 2, 9), (27, 'direita', 2, 10),
  (28, 'direita', 3, 8), (29, 'direita', 3, 9), (30, 'direita', 3, 10),
  (31, 'direita', 4, 8), (32, 'direita', 4, 9), (33, 'direita', 4, 10),
  (34, 'direita', 5, 8), (35, 'direita', 5, 9), (36, 'direita', 5, 10)
) as seed(numero, setor, linha, coluna)
where not exists (select 1 from public.mesas);
