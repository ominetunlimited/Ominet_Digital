-- Merge one category into another at the same level, keeping every post's primary category valid. One transaction.
create or replace function public.merge_categories(p_from uuid, p_into uuid) returns void
language plpgsql security invoker as $$
declare r record;
begin
  if p_from = p_into then raise exception 'Choose a different category to merge into'; end if;
  if exists (select 1 from public.categories where parent_id = p_from) then raise exception 'Move or merge its subcategories first'; end if;
  if (select parent_id from public.categories where id = p_from) is distinct from (select parent_id from public.categories where id = p_into) then
    raise exception 'Categories can only be merged with another category at the same level';
  end if;
  for r in select * from public.content_categories where category_id = p_from loop
    if exists (select 1 from public.content_categories where content_id = r.content_id and category_id = p_into) then
      delete from public.content_categories where content_id = r.content_id and category_id = p_from;
      if r.is_primary then
        update public.content_categories set is_primary = true where content_id = r.content_id and category_id = p_into;
      end if;
    else
      update public.content_categories set category_id = p_into where content_id = r.content_id and category_id = p_from;
    end if;
  end loop;
  update public.content set category_id = p_into where category_id = p_from;
  delete from public.categories where id = p_from;
end $$;
