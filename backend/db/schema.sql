create extension if not exists "uuid-ossp";

create table if not exists users (
  id text primary key,
  email text not null,
  monthly_income numeric,
  credit_score int,
  employment_status text,
  age int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists loan_products (
  id uuid primary key default uuid_generate_v4(),
  product_name text not null,
  source_url text,
  interest_rate numeric,
  min_monthly_income numeric,
  min_credit_score int,
  eligibility jsonb default '{}'::jsonb,
  scraped_at timestamptz default now()
);

create table if not exists matches (
  id uuid primary key default uuid_generate_v4(),
  user_id text references users(id),
  product_id uuid references loan_products(id),
  score numeric,
  created_at timestamptz default now()
);

-- webhook payload audit (optional)
create table if not exists workflow_events (
  id uuid primary key default uuid_generate_v4(),
  event_type text,
  payload jsonb,
  created_at timestamptz default now()
);
