-- ============================================================
-- DOKAN HISAB — Full Supabase SQL Seed
-- Merged: Inventory Tracker + Invoicing SaaS
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================


-- ============================================================
-- STEP 1: CLEAN UP (safe to re-run)
-- ============================================================

drop trigger if exists trigger_deduct_stock on sale_items;
drop trigger if exists trigger_add_stock on purchase_items;
drop trigger if exists trigger_update_invoice_due on payments;
drop trigger if exists trigger_set_updated_at_products on products;
drop trigger if exists trigger_set_updated_at_invoices on invoices;

drop function if exists deduct_stock_on_sale();
drop function if exists add_stock_on_purchase();
drop function if exists update_invoice_due_on_payment();
drop function if exists set_updated_at();
drop function if exists mark_overdue_invoices();
drop function if exists get_business_id();
drop function if exists generate_invoice_number(uuid);

drop table if exists purchase_items cascade;
drop table if exists purchases cascade;
drop table if exists payments cascade;
drop table if exists invoice_items cascade;
drop table if exists invoices cascade;
drop table if exists sale_items cascade;
drop table if exists sales cascade;
drop table if exists stock_movements cascade;
drop table if exists clients cascade;
drop table if exists products cascade;
drop table if exists categories cascade;
drop table if exists profiles cascade;
drop table if exists businesses cascade;


-- ============================================================
-- STEP 2: HELPER FUNCTION
-- ============================================================

-- Reusable function to get current user's business_id
create or replace function get_business_id()
returns uuid as $$
  select business_id from profiles where id = auth.uid() limit 1;
$$ language sql security definer stable;

-- Concurrency-safe invoice number generator
create or replace function generate_invoice_number(p_business_id uuid)
returns text as $$
declare
  v_year    text := extract(year from now())::text;
  v_last    text;
  v_seq     int;
begin
  select invoice_number
    into v_last
    from invoices
   where business_id = p_business_id
     and invoice_number like 'INV-' || v_year || '-%'
   order by invoice_number desc
   limit 1
   for update skip locked;

  v_seq := coalesce(split_part(v_last, '-', 3)::int, 0) + 1;
  return 'INV-' || v_year || '-' || lpad(v_seq::text, 3, '0');
end;
$$ language plpgsql security definer;


-- ============================================================
-- STEP 3: CORE TABLES
-- ============================================================

-- 1. businesses
create table businesses (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  owner_id      uuid references auth.users(id) on delete cascade,
  phone         text,
  address       text,
  logo_url      text,
  bkash_number  text,
  nagad_number  text,
  rocket_number text,
  currency      text not null default 'BDT',
  created_at    timestamptz not null default now()
);

-- 2. profiles
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  business_id uuid references businesses(id) on delete cascade,
  full_name   text,
  phone       text,
  role        text not null default 'owner'
                check (role in ('owner', 'staff')),
  created_at  timestamptz not null default now()
);

-- 3. categories
create table categories (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (business_id, name)
);

-- 4. products
create table products (
  id                   uuid primary key default gen_random_uuid(),
  business_id          uuid not null references businesses(id) on delete cascade,
  category_id          uuid references categories(id) on delete set null,
  name                 text not null,
  sku                  text,
  unit                 text not null default 'pcs',
  buy_price            numeric(12,2) not null default 0,
  sell_price           numeric(12,2) not null default 0,
  stock_qty            numeric(12,2) not null default 0,
  low_stock_threshold  numeric(12,2) not null default 5,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (business_id, sku)
);

-- 5. stock_movements
create table stock_movements (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  type        text not null
                check (type in ('purchase','sale','adjustment','return')),
  qty_change  numeric(12,2) not null,
  qty_before  numeric(12,2) not null,
  qty_after   numeric(12,2) not null,
  note        text,
  ref_id      uuid,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- 6. clients
create table clients (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name        text not null,
  phone       text,
  address     text,
  email       text,
  total_due   numeric(12,2) not null default 0,
  created_at  timestamptz not null default now()
);

-- 7. sales
create table sales (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references businesses(id) on delete cascade,
  client_id      uuid references clients(id) on delete set null,
  invoice_id     uuid,  -- FK added after invoices table created
  subtotal       numeric(12,2) not null default 0,
  discount       numeric(12,2) not null default 0,
  total          numeric(12,2) not null default 0,
  paid_amount    numeric(12,2) not null default 0,
  due_amount     numeric(12,2) not null default 0,
  payment_method text not null default 'cash'
                   check (payment_method in ('cash','bkash','nagad','rocket','credit','bank')),
  status         text not null default 'completed'
                   check (status in ('completed','returned','cancelled')),
  note           text,
  sold_by        uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

-- 8. sale_items
create table sale_items (
  id           uuid primary key default gen_random_uuid(),
  sale_id      uuid not null references sales(id) on delete cascade,
  product_id   uuid references products(id) on delete set null,
  product_name text not null,
  unit         text,
  qty          numeric(12,2) not null,
  buy_price    numeric(12,2) not null default 0,
  sell_price   numeric(12,2) not null,
  total        numeric(12,2) not null,
  created_at   timestamptz not null default now()
);

-- 9. invoices
create table invoices (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references businesses(id) on delete cascade,
  client_id      uuid references clients(id) on delete set null,
  sale_id        uuid references sales(id) on delete set null,
  invoice_number text not null,
  issue_date     date not null default current_date,
  due_date       date,
  subtotal       numeric(12,2) not null default 0,
  discount       numeric(12,2) not null default 0,
  tax            numeric(12,2) not null default 0,
  total          numeric(12,2) not null default 0,
  paid_amount    numeric(12,2) not null default 0,
  due_amount     numeric(12,2) not null default 0,
  status         text not null default 'draft'
                   check (status in ('draft','sent','paid','overdue','cancelled')),
  note           text,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (business_id, invoice_number)
);

-- Now add FK from sales → invoices
alter table sales
  add constraint sales_invoice_id_fkey
  foreign key (invoice_id) references invoices(id) on delete set null;

-- 10. invoice_items
create table invoice_items (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references invoices(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,
  description text not null,
  unit        text,
  qty         numeric(12,2) not null,
  unit_price  numeric(12,2) not null,
  total       numeric(12,2) not null,
  created_at  timestamptz not null default now()
);

-- 11. payments
create table payments (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references businesses(id) on delete cascade,
  invoice_id     uuid references invoices(id) on delete set null,
  sale_id        uuid references sales(id) on delete set null,
  client_id      uuid references clients(id) on delete set null,
  amount         numeric(12,2) not null,
  method         text not null default 'cash'
                   check (method in ('cash','bkash','nagad','rocket','bank','other')),
  transaction_id text,
  note           text,
  paid_at        timestamptz not null default now(),
  created_by     uuid references auth.users(id) on delete set null
);

-- 12. purchases
create table purchases (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references businesses(id) on delete cascade,
  supplier_name  text,
  total          numeric(12,2) not null default 0,
  paid_amount    numeric(12,2) not null default 0,
  due_amount     numeric(12,2) not null default 0,
  payment_method text not null default 'cash'
                   check (payment_method in ('cash','bkash','nagad','rocket','bank','credit')),
  note           text,
  purchased_by   uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

-- 13. purchase_items
create table purchase_items (
  id           uuid primary key default gen_random_uuid(),
  purchase_id  uuid not null references purchases(id) on delete cascade,
  product_id   uuid references products(id) on delete set null,
  product_name text not null,
  qty          numeric(12,2) not null,
  buy_price    numeric(12,2) not null,
  total        numeric(12,2) not null
);


-- ============================================================
-- STEP 4: INDEXES (performance)
-- ============================================================

create index idx_profiles_business        on profiles(business_id);
create index idx_products_business        on products(business_id);
create index idx_products_category        on products(category_id);
create index idx_products_low_stock       on products(business_id, stock_qty, low_stock_threshold);
create index idx_categories_business      on categories(business_id);
create index idx_clients_business         on clients(business_id);
create index idx_sales_business           on sales(business_id);
create index idx_sales_client             on sales(client_id);
create index idx_sales_created            on sales(created_at);
create index idx_sale_items_sale          on sale_items(sale_id);
create index idx_sale_items_product       on sale_items(product_id);
create index idx_invoices_business        on invoices(business_id);
create index idx_invoices_client          on invoices(client_id);
create index idx_invoices_status          on invoices(status);
create index idx_invoices_due_date        on invoices(due_date);
create index idx_invoice_items_invoice    on invoice_items(invoice_id);
create index idx_payments_invoice         on payments(invoice_id);
create index idx_payments_business        on payments(business_id);
create index idx_stock_movements_product  on stock_movements(product_id);
create index idx_stock_movements_business on stock_movements(business_id);
create index idx_purchases_business       on purchases(business_id);
create index idx_purchase_items_purchase  on purchase_items(purchase_id);


-- ============================================================
-- STEP 5: ROW LEVEL SECURITY
-- ============================================================

alter table businesses      enable row level security;
alter table profiles        enable row level security;
alter table categories      enable row level security;
alter table products        enable row level security;
alter table stock_movements enable row level security;
alter table clients         enable row level security;
alter table sales           enable row level security;
alter table sale_items      enable row level security;
alter table invoices        enable row level security;
alter table invoice_items   enable row level security;
alter table payments        enable row level security;
alter table purchases       enable row level security;
alter table purchase_items  enable row level security;

-- businesses: owner only
create policy "businesses: owner access"
  on businesses for all
  using (owner_id = auth.uid());

-- profiles: own row only
create policy "profiles: own row"
  on profiles for all
  using (id = auth.uid());

-- all other tables: match business_id to user's business
create policy "categories: business access"
  on categories for all
  using (business_id = get_business_id());

create policy "products: business access"
  on products for all
  using (business_id = get_business_id());

create policy "stock_movements: business access"
  on stock_movements for all
  using (business_id = get_business_id());

create policy "clients: business access"
  on clients for all
  using (business_id = get_business_id());

create policy "sales: business access"
  on sales for all
  using (business_id = get_business_id());

create policy "sale_items: via sale"
  on sale_items for all
  using (
    sale_id in (
      select id from sales where business_id = get_business_id()
    )
  );

create policy "invoices: business access"
  on invoices for all
  using (business_id = get_business_id());

create policy "invoice_items: via invoice"
  on invoice_items for all
  using (
    invoice_id in (
      select id from invoices where business_id = get_business_id()
    )
  );

create policy "payments: business access"
  on payments for all
  using (business_id = get_business_id());

create policy "purchases: business access"
  on purchases for all
  using (business_id = get_business_id());

create policy "purchase_items: via purchase"
  on purchase_items for all
  using (
    purchase_id in (
      select id from purchases where business_id = get_business_id()
    )
  );


-- ============================================================
-- STEP 6: TRIGGERS & FUNCTIONS
-- ============================================================

-- updated_at auto-stamp
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_set_updated_at_products
  before update on products
  for each row execute function set_updated_at();

create trigger trigger_set_updated_at_invoices
  before update on invoices
  for each row execute function set_updated_at();

-- -------------------------------------------------------
-- Deduct stock when sale_item inserted
-- -------------------------------------------------------
create or replace function deduct_stock_on_sale()
returns trigger as $$
declare
  v_before numeric(12,2);
  v_after  numeric(12,2);
  v_biz    uuid;
begin
  select stock_qty, business_id
    into v_before, v_biz
    from products
   where id = new.product_id;

  v_after := v_before - new.qty;

  update products
     set stock_qty  = v_after,
         updated_at = now()
   where id = new.product_id;

  insert into stock_movements
    (business_id, product_id, type, qty_change, qty_before, qty_after, ref_id, created_by)
  values
    (v_biz, new.product_id, 'sale', -new.qty, v_before, v_after, new.sale_id, auth.uid());

  return new;
end;
$$ language plpgsql security definer;

create trigger trigger_deduct_stock
  after insert on sale_items
  for each row execute function deduct_stock_on_sale();

-- -------------------------------------------------------
-- Add stock when purchase_item inserted
-- -------------------------------------------------------
create or replace function add_stock_on_purchase()
returns trigger as $$
declare
  v_before numeric(12,2);
  v_after  numeric(12,2);
  v_biz    uuid;
begin
  select stock_qty, business_id
    into v_before, v_biz
    from products
   where id = new.product_id;

  v_after := v_before + new.qty;

  update products
     set stock_qty  = v_after,
         buy_price  = new.buy_price,
         updated_at = now()
   where id = new.product_id;

  insert into stock_movements
    (business_id, product_id, type, qty_change, qty_before, qty_after, ref_id, created_by)
  values
    (v_biz, new.product_id, 'purchase', new.qty, v_before, v_after, new.purchase_id, auth.uid());

  return new;
end;
$$ language plpgsql security definer;

create trigger trigger_add_stock
  after insert on purchase_items
  for each row execute function add_stock_on_purchase();

-- -------------------------------------------------------
-- Update invoice paid/due when payment inserted
-- -------------------------------------------------------
create or replace function update_invoice_due_on_payment()
returns trigger as $$
begin
  if new.invoice_id is not null then
    update invoices
       set paid_amount = paid_amount + new.amount,
           due_amount  = greatest(total - (paid_amount + new.amount), 0),
           status      = case
                           when (paid_amount + new.amount) >= total then 'paid'
                           else status
                         end,
           updated_at  = now()
     where id = new.invoice_id;
  end if;

  -- also update client total_due if credit sale
  if new.client_id is not null then
    update clients
       set total_due = greatest(total_due - new.amount, 0)
     where id = new.client_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger trigger_update_invoice_due
  after insert on payments
  for each row execute function update_invoice_due_on_payment();

-- -------------------------------------------------------
-- Mark overdue invoices (call via Supabase cron / Edge Function)
-- Schedule: every day at midnight
-- -------------------------------------------------------
create or replace function mark_overdue_invoices()
returns void as $$
begin
  update invoices
     set status     = 'overdue',
         updated_at = now()
   where status   = 'sent'
     and due_date < current_date;
end;
$$ language plpgsql security definer;


-- ============================================================
-- STEP 7: AUTO-CREATE PROFILE ON SIGNUP
-- Supabase Auth hook: fires when new user signs up
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ============================================================
-- STEP 8: USEFUL VIEWS
-- ============================================================

-- Low stock products
create or replace view low_stock_products as
select
  p.id,
  p.business_id,
  p.name,
  p.sku,
  p.unit,
  p.stock_qty,
  p.low_stock_threshold,
  p.sell_price,
  c.name as category_name
from products p
left join categories c on c.id = p.category_id
where p.stock_qty <= p.low_stock_threshold
  and p.is_active = true;

-- Invoice summary per client
create or replace view client_invoice_summary as
select
  cl.id as client_id,
  cl.business_id,
  cl.name as client_name,
  cl.phone,
  count(i.id)          as total_invoices,
  coalesce(sum(i.total), 0)       as total_billed,
  coalesce(sum(i.paid_amount), 0) as total_paid,
  coalesce(sum(i.due_amount), 0)  as total_due
from clients cl
left join invoices i on i.client_id = cl.id
group by cl.id, cl.business_id, cl.name, cl.phone;

-- Daily sales summary
create or replace view daily_sales_summary as
select
  business_id,
  date_trunc('day', created_at)::date as sale_date,
  count(*)                            as total_sales,
  coalesce(sum(total), 0)             as total_revenue,
  coalesce(sum(paid_amount), 0)       as total_collected,
  coalesce(sum(due_amount), 0)        as total_due
from sales
where status = 'completed'
group by business_id, date_trunc('day', created_at)::date
order by sale_date desc;

-- Product profit view
create or replace view product_profit_summary as
select
  si.product_id,
  si.product_name,
  s.business_id,
  sum(si.qty)                                    as total_sold,
  sum(si.total)                                  as total_revenue,
  sum(si.buy_price * si.qty)                     as total_cost,
  sum(si.total) - sum(si.buy_price * si.qty)     as total_profit
from sale_items si
join sales s on s.id = si.sale_id
where s.status = 'completed'
group by si.product_id, si.product_name, s.business_id;


-- ============================================================
-- STEP 9: DEMO SEED DATA
-- Replace 'YOUR-USER-UUID' with your actual Supabase auth user ID
-- Get it from: Supabase Dashboard → Authentication → Users
-- ============================================================

do $$
declare
  v_user_id    uuid := '00000000-0000-0000-0000-000000000000'; -- REPLACE THIS
  v_biz_id     uuid := gen_random_uuid();
  v_cat1       uuid := gen_random_uuid();
  v_cat2       uuid := gen_random_uuid();
  v_cat3       uuid := gen_random_uuid();
  v_prod1      uuid := gen_random_uuid();
  v_prod2      uuid := gen_random_uuid();
  v_prod3      uuid := gen_random_uuid();
  v_client1    uuid := gen_random_uuid();
  v_client2    uuid := gen_random_uuid();
  v_sale1      uuid := gen_random_uuid();
  v_invoice1   uuid := gen_random_uuid();
begin

  -- business
  insert into businesses (id, name, owner_id, phone, address, bkash_number)
  values (v_biz_id, 'Rahman Store', v_user_id,
          '01711-000000', 'Mirpur-10, Dhaka', '01711-000000');

  -- profile
  insert into profiles (id, business_id, full_name, role)
  values (v_user_id, v_biz_id, 'Istiaq Ahmed', 'owner');

  -- categories
  insert into categories (id, business_id, name) values
    (v_cat1, v_biz_id, 'Grocery'),
    (v_cat2, v_biz_id, 'Beverages'),
    (v_cat3, v_biz_id, 'Household');

  -- products
  insert into products
    (id, business_id, category_id, name, sku, unit, buy_price, sell_price, stock_qty, low_stock_threshold)
  values
    (v_prod1, v_biz_id, v_cat1, 'Chinigura Rice 5kg',  'RICE-5KG',  'bag',  280, 320,  50, 10),
    (v_prod2, v_biz_id, v_cat2, 'Mojo Cola 250ml',     'MOJO-250',  'pcs',   18,  25, 120, 20),
    (v_prod3, v_biz_id, v_cat3, 'Surf Excel 1kg',      'SURF-1KG',  'pcs',  110, 135,   8,  5);

  -- clients
  insert into clients (id, business_id, name, phone, address)
  values
    (v_client1, v_biz_id, 'Karim Bhai',  '01811-111111', 'Mirpur-11, Dhaka'),
    (v_client2, v_biz_id, 'Rina Begum',  '01911-222222', 'Pallabi, Dhaka');

  -- sample sale
  insert into sales
    (id, business_id, client_id, subtotal, total, paid_amount, due_amount, payment_method, status)
  values
    (v_sale1, v_biz_id, v_client1, 705, 705, 705, 0, 'bkash', 'completed');

  insert into sale_items
    (sale_id, product_id, product_name, unit, qty, buy_price, sell_price, total)
  values
    (v_sale1, v_prod1, 'Chinigura Rice 5kg', 'bag', 2, 280, 320, 640),
    (v_sale1, v_prod2, 'Mojo Cola 250ml',    'pcs', 3,  18,  25,  75) -- triggers will auto-deduct stock
  ;

  -- sample invoice
  insert into invoices
    (id, business_id, client_id, invoice_number, issue_date, due_date,
     subtotal, total, due_amount, status)
  values
    (v_invoice1, v_biz_id, v_client2, 'INV-2024-001',
     current_date, current_date + interval '7 days',
     500, 500, 500, 'sent');

  insert into invoice_items
    (invoice_id, product_id, description, unit, qty, unit_price, total)
  values
    (v_invoice1, v_prod3, 'Surf Excel 1kg', 'pcs', 4, 125, 500);

end $$;


-- ============================================================
-- DONE ✓
-- ============================================================
-- Tables created:   businesses, profiles, categories, products,
--                   stock_movements, clients, sales, sale_items,
--                   invoices, invoice_items, payments,
--                   purchases, purchase_items
--
-- Views created:    low_stock_products, client_invoice_summary,
--                   daily_sales_summary, product_profit_summary
--
-- Triggers:         deduct_stock_on_sale (auto on sale_items insert)
--                   add_stock_on_purchase (auto on purchase_items insert)
--                   update_invoice_due_on_payment (auto on payments insert)
--                   set_updated_at (products, invoices)
--                   on_auth_user_created (auto profile on signup)
--
-- Functions:        get_business_id(), mark_overdue_invoices()
--                   handle_new_user()
--
-- Next steps:
-- 1. Replace '00000000-0000-0000-0000-000000000000' with your real user UUID
-- 2. Paste entire file in Supabase SQL Editor → Run
-- 3. Check Table Editor — all 13 tables should appear
-- 4. Schedule mark_overdue_invoices() via Supabase Edge Function cron
-- ============================================================