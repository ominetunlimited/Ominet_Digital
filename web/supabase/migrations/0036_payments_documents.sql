-- Payments and business documents (additive). Staff-only via is_staff() RLS.

create table if not exists public.booking_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  quotation_id uuid references public.quotations(id) on delete set null,
  kind text not null default 'instalment' check (kind in ('deposit','instalment','balance','full')),
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'NGN',
  method text,
  reference text,
  paid_on date not null default current_date,
  note text,
  status text not null default 'recorded' check (status in ('recorded','voided')),
  recorded_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists booking_payments_booking_idx on public.booking_payments (booking_id, paid_on);

create table if not exists public.document_counters (
  kind text not null,
  year int not null,
  last_value int not null default 0,
  primary key (kind, year)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  quotation_id uuid references public.quotations(id) on delete set null,
  payment_id uuid references public.booking_payments(id) on delete set null,
  kind text not null check (kind in ('quotation','booking_confirmation','agreement','invoice','receipt','completion_note')),
  number text not null,
  status text not null default 'draft' check (status in ('draft','issued','void')),
  title text not null,
  intro_html text not null default '',
  body_html text not null default '',
  footer_html text not null default '',
  data jsonb not null default '{}'::jsonb,
  issued_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A receipt exists only because money was recorded.
  constraint documents_receipt_needs_payment check (kind <> 'receipt' or payment_id is not null)
);
create unique index if not exists documents_number_key on public.documents (number);
create index if not exists documents_booking_idx on public.documents (booking_id, created_at desc);
create index if not exists documents_payment_idx on public.documents (payment_id);
create index if not exists documents_quotation_idx on public.documents (quotation_id);

alter table public.booking_payments enable row level security;
alter table public.document_counters enable row level security;
alter table public.documents enable row level security;
drop policy if exists booking_payments_staff_all on public.booking_payments;
drop policy if exists document_counters_staff_all on public.document_counters;
drop policy if exists documents_staff_all on public.documents;
create policy booking_payments_staff_all on public.booking_payments for all using ((select public.is_staff())) with check ((select public.is_staff()));
create policy document_counters_staff_all on public.document_counters for all using ((select public.is_staff())) with check ((select public.is_staff()));
create policy documents_staff_all on public.documents for all using ((select public.is_staff())) with check ((select public.is_staff()));

-- Gap-free-per-kind numbering, atomic under concurrent calls. SECURITY INVOKER, so only staff can use it.
create or replace function public.next_document_number(p_kind text)
returns text language plpgsql security invoker set search_path = public as $$
declare
  y int := extract(year from now())::int;
  n int;
  prefix text := case p_kind
    when 'quotation' then 'QUO' when 'booking_confirmation' then 'BKC' when 'agreement' then 'AGR'
    when 'invoice' then 'INV' when 'receipt' then 'RCT' when 'completion_note' then 'CMP' else null end;
begin
  if prefix is null then raise exception 'Unknown document kind %', p_kind; end if;
  insert into public.document_counters (kind, year, last_value) values (p_kind, y, 1)
    on conflict (kind, year) do update set last_value = public.document_counters.last_value + 1
    returning last_value into n;
  return prefix || '-' || y || '-' || lpad(n::text, 4, '0');
end $$;
revoke all on function public.next_document_number(text) from public, anon;
grant execute on function public.next_document_number(text) to authenticated;
