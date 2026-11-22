-- Replies (one level) and thumbs up / thumbs down on comments. Additive.
alter table public.comments add column if not exists parent_id uuid references public.comments(id) on delete cascade;
create index if not exists comments_parent_idx on public.comments (parent_id) where parent_id is not null;

alter table public.comment_reactions add column if not exists value smallint not null default 1;
alter table public.comment_reactions drop constraint if exists comment_reactions_value_chk;
alter table public.comment_reactions add constraint comment_reactions_value_chk check (value in (1, -1));
-- A reader can switch their own vote between up and down.
drop policy if exists comment_reactions_owner_update on public.comment_reactions;
create policy comment_reactions_owner_update on public.comment_reactions for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A reply must sit directly under a top-level comment on the same post or book.
create or replace function public.comments_reply_guard() returns trigger
language plpgsql security invoker set search_path = public, pg_temp as $$
declare p record;
begin
  if new.parent_id is null then return new; end if;
  select parent_id, content_id, book_id into p from public.comments where id = new.parent_id;
  if not found then raise exception 'Parent comment not found'; end if;
  if p.parent_id is not null then raise exception 'Replies can only be one level deep'; end if;
  if p.content_id is distinct from new.content_id or p.book_id is distinct from new.book_id then
    raise exception 'A reply must belong to the same post as its parent';
  end if;
  return new;
end $$;
drop trigger if exists comments_reply_guard_trg on public.comments;
create trigger comments_reply_guard_trg before insert on public.comments
  for each row execute function public.comments_reply_guard();
