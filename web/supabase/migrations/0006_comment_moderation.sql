-- Comments currently go straight to public the moment they're posted (RLS
-- `comments_public_select using (true)`) — there is no moderation state at
-- all. This adds one: every new comment defaults to 'pending' and only
-- becomes publicly visible once staff approves it. The submitter can still
-- see their own pending comment (so they know it was received), but nobody
-- else can until it's approved.

create type comment_status as enum ('pending', 'approved', 'rejected', 'hidden', 'deleted');

alter table comments add column if not exists status comment_status not null default 'pending';
alter table comments add column if not exists moderated_at timestamptz;
alter table comments add column if not exists moderated_by uuid references profiles (id) on delete set null;
alter table comments add column if not exists moderation_notes text;

create index if not exists comments_status_idx on comments (status, created_at desc);

drop policy if exists comments_public_select on comments;
create policy comments_public_select on comments for select using (
  status = 'approved' or user_id = auth.uid() or is_staff()
);

-- Staff need to actually change status/notes — there was no update policy
-- on comments at all before this.
create policy comments_staff_update on comments for update using (is_staff()) with check (is_staff());
