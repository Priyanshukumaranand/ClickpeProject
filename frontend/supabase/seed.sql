-- Schema for products and chat history
create extension if not exists "uuid-ossp";

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  bank text not null,
  type text check (type in ('personal','education','vehicle','home','credit_line','debt_consolidation')) not null,
  rate_apr numeric not null,
  min_income numeric not null,
  min_credit_score int not null,
  tenure_min_months int default 6,
  tenure_max_months int default 60,
  processing_fee_pct numeric default 0,
  prepayment_allowed boolean default true,
  disbursal_speed text default 'standard',
  docs_level text default 'standard',
  summary text,
  faq jsonb default '[]',
  terms jsonb default '{}'
);

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  display_name text
);

create table if not exists ai_chat_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  product_id uuid references products(id),
  role text check (role in ('user','assistant')) not null,
  content text not null,
  created_at timestamptz default now()
);

truncate table products restart identity;

insert into products (id, name, bank, type, rate_apr, min_income, min_credit_score, tenure_min_months, tenure_max_months, processing_fee_pct, prepayment_allowed, disbursal_speed, docs_level, summary, faq, terms) values
  ('1b9d6c00-1111-4c2d-a2d1-000000000001','Swift Personal Flex','Axis Bank','personal',10.5,35000,680,12,60,1.2,true,'fast','low','Fast approval personal loan with flexible tenure and zero prepayment penalties.', '[{"question":"Is there a prepayment charge?","answer":"No prepayment charge after the first 6 EMIs are cleared."},{"question":"How long does disbursal take?","answer":"Funds are usually disbursed within 24 hours after verification."}]','{"limited_time_offer":true,"joining_bonus":"1% processing fee waiver for applications before quarter end"}'),
  ('1b9d6c00-2222-4c2d-a2d1-000000000002','EduRise Student Loan','HDFC Bank','education',9.25,20000,650,24,84,0.75,true,'standard','standard','Education loan with long tenure options and interest-only during study period.','[{"question":"Is co-applicant mandatory?","answer":"A parent or guardian co-applicant is recommended for faster approval."},{"question":"Do I get a moratorium?","answer":"Yes, repayment starts 6 months after course completion."}]','{"moratorium_months":6}'),
  ('1b9d6c00-3333-4c2d-a2d1-000000000003','Home Secure Advantage','ICICI Bank','home',8.5,60000,720,120,360,0.95,true,'standard','standard','Home loan with balanced rates, doorstep documentation pickup, and part-prepay flexibility.','[{"question":"Is part-prepayment allowed?","answer":"Yes, up to 20% of principal outstanding once every year without penalty."},{"question":"Can I balance transfer?","answer":"Balance transfer is supported after 12 EMIs with revised rates."}]','{"doorstep_service":true}'),
  ('1b9d6c00-4444-4c2d-a2d1-000000000004','AutoDrive Express','SBI','vehicle',9.9,30000,670,12,84,0.85,true,'fast','standard','Vehicle loan with fast approval for salaried applicants and low down payment options.','[{"question":"Is down payment required?","answer":"Minimum 10% down payment for new vehicles, 15% for used vehicles."},{"question":"Is pre-approval available?","answer":"Yes, pre-approval up to ₹12L with 30-day validity."}]','{"preapproved_limit":"₹12,00,000"}'),
  ('1b9d6c00-5555-4c2d-a2d1-000000000005','Smart Credit Line','IndusInd Bank','credit_line',12.5,40000,690,6,60,1.5,true,'instant','minimal','Reusable credit line with instant drawdowns and daily interest calculation.','[{"question":"How is interest charged?","answer":"Interest is charged only on the amount utilized, calculated daily."},{"question":"Is there a card?","answer":"You get a virtual card plus bank transfers for drawdowns."}]','{"instant_drawdown":true}'),
  ('1b9d6c00-6666-4c2d-a2d1-000000000006','DebtEase Consolidation','Kotak Mahindra','debt_consolidation',11.4,28000,660,12,72,1.35,true,'standard','low','One-stop consolidation loan with free closure on balance transfers after 12 months.','[{"question":"Will you close existing loans?","answer":"We can disburse directly to your lenders for clean closure records."},{"question":"Can I top up later?","answer":"Top-up allowed after 6 on-time EMIs and subject to credit review."}]','{"balance_transfer_support":true}'),
  ('1b9d6c00-7777-4c2d-a2d1-000000000007','Green Home Saver','Yes Bank','home',8.9,55000,710,120,300,0.9,true,'standard','standard','Home loan with energy-efficiency incentives and step-down rates for timely EMIs.','[{"question":"Any green incentive?","answer":"0.2% APR discount for certified green buildings."},{"question":"Is insurance bundled?","answer":"Property insurance is optional and can be bundled at discount."}]','{"green_discount":"0.2% on certified buildings"}'),
  ('1b9d6c00-8888-4c2d-a2d1-000000000008','Startup Booster Line','IDFC First','credit_line',13.2,50000,700,6,48,1.75,true,'fast','minimal','Flexible business credit line for professionals with 48-hour onboarding and GST-based limits.','[{"question":"How is limit decided?","answer":"Limit is based on last 6 months of GST + bank statements."},{"question":"Is collateral needed?","answer":"No collateral required for limits up to ₹25L."}]','{"gst_based_limit":true}'),
  ('1b9d6c00-9999-4c2d-a2d1-000000000009','Travel Lite Personal','RBL Bank','personal',12,25000,640,6,48,1.1,true,'instant','low','Personal loan aimed at travel with EMI holiday option for the first 2 months.','[{"question":"Do I get an EMI holiday?","answer":"Yes, you can start EMI after 60 days for travel planning."},{"question":"Is insurance bundled?","answer":"Trip protection add-on available at nominal cost."}]','{"emi_holiday_days":60}'),
  ('1b9d6c00-aaaa-4c2d-a2d1-000000000010','NRI Home Assist','Federal Bank','home',9.1,70000,730,180,360,1.0,true,'standard','standard','Home loan tailored for NRIs with remote documentation and competitive spreads.','[{"question":"Can I sign remotely?","answer":"Yes, KYC and agreements can be executed through verified digital channels."},{"question":"Do you fund resale?","answer":"Ready and resale properties are eligible subject to valuation."}]','{"remote_kyc":true}');
