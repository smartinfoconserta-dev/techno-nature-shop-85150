-- Criar tabela de solicitações/pré-cadastros de vendas
create table public.customer_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  customer_name text not null,
  
  -- Dados preenchidos pelo CLIENTE/PARCEIRO
  product_name text not null,
  sale_price numeric not null,
  notes text,
  
  -- Dados preenchidos pelo ADMIN
  cost_price numeric,
  brand text,
  category text,
  warranty_months integer default 3,
  payment_method text,
  installments integer default 1,
  installment_rate numeric default 0,
  admin_notes text,
  
  -- Controle e Status
  status text not null default 'pending',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  confirmed_at timestamp with time zone,
  confirmed_by uuid references auth.users(id),
  converted_to_receivable_id uuid references public.receivables(id)
);

-- Índices para melhor performance
create index customer_requests_customer_id_idx on public.customer_requests(customer_id);
create index customer_requests_status_idx on public.customer_requests(status);
create index customer_requests_created_at_idx on public.customer_requests(created_at);

-- Habilitar Row Level Security
alter table public.customer_requests enable row level security;

-- Políticas RLS - Admin pode fazer tudo
create policy "Admin pode ver todas solicitações"
  on public.customer_requests for select
  using (has_role(auth.uid(), 'admin'::app_role));

create policy "Admin pode inserir solicitações"
  on public.customer_requests for insert
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy "Admin pode atualizar solicitações"
  on public.customer_requests for update
  using (has_role(auth.uid(), 'admin'::app_role));

create policy "Admin pode deletar solicitações"
  on public.customer_requests for delete
  using (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at automaticamente
create trigger update_customer_requests_updated_at
  before update on public.customer_requests
  for each row
  execute function public.update_updated_at_column();