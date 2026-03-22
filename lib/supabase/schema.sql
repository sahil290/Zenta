-- Run this entire file in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Subscriptions
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  plan text not null default 'free' check (plan in ('free','starter','pro','agency')),
  status text not null default 'active' check (status in ('active','canceled','past_due','trialing')),
  stripe_subscription_id text,
  stripe_customer_id text,
  current_period_end timestamptz,
  created_at timestamptz default now()
);

-- Contacts
create table public.contacts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in ('lead','client')),
  name text not null,
  email text not null,
  company text,
  phone text,
  notes text,
  last_contacted_at timestamptz,
  created_at timestamptz default now()
);

-- Invoices
create table public.invoices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete set null,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  status text not null default 'draft' check (status in ('draft','sent','paid','overdue')),
  due_date date not null,
  sent_at timestamptz,
  paid_at timestamptz,
  description text,
  created_at timestamptz default now()
);

-- Agent tasks
create table public.agent_tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null,
  status text not null default 'pending' check (status in ('pending','running','completed','failed')),
  input jsonb not null default '{}',
  output jsonb,
  error text,
  credits_used integer not null default 1,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Agent logs
create table public.agent_logs (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references public.agent_tasks(id) on delete cascade not null,
  message text not null,
  level text not null default 'info' check (level in ('info','warn','error')),
  created_at timestamptz default now()
);

-- Integrations
create table public.integrations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in ('gmail','notion','slack','stripe')),
  is_connected boolean default false,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, type)
);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security
alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.contacts enable row level security;
alter table public.invoices enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.agent_logs enable row level security;
alter table public.integrations enable row level security;

-- Policies: users can only see their own data
create policy "users_own" on public.users for all using (auth.uid() = id);
create policy "subs_own" on public.subscriptions for all using (auth.uid() = user_id);
create policy "contacts_own" on public.contacts for all using (auth.uid() = user_id);
create policy "invoices_own" on public.invoices for all using (auth.uid() = user_id);
create policy "tasks_own" on public.agent_tasks for all using (auth.uid() = user_id);
create policy "logs_own" on public.agent_logs for all using (
  auth.uid() = (select user_id from public.agent_tasks where id = task_id)
);
create policy "integrations_own" on public.integrations for all using (auth.uid() = user_id);
