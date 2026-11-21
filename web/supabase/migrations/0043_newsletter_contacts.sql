-- Everyone who sends an enquiry is saved to the newsletter table. Only people who opt in get status 'subscribed'
-- and receive campaigns; everyone else is kept as status 'contact' (visible to staff, never mailed by a campaign).
alter table public.newsletter_subscribers add column if not exists name text;
alter table public.newsletter_subscribers add column if not exists phone text;
alter table public.newsletter_subscribers add column if not exists source text not null default 'website_signup';
alter table public.newsletter_subscribers add column if not exists last_contact_at timestamptz;

-- Backfill from enquiries already received.
insert into public.newsletter_subscribers (email, name, phone, source, status, subscribed_at, last_contact_at)
select lower(trim(b.email)), (array_agg(b.name order by b.created_at desc))[1], (array_agg(b.phone order by b.created_at desc))[1],
       'enquiry', 'contact', min(b.created_at), max(b.created_at)
from public.bookings b
where b.email like '%_@_%.__%'
group by lower(trim(b.email))
on conflict (email) do nothing;
