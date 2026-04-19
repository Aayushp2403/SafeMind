-- Replace the placeholder email before running this in the Supabase SQL editor.
-- Example: owner@example.com

create table if not exists public.site_ratings (
  visitor_id text primary key,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_site_rating_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists site_ratings_set_updated_at on public.site_ratings;

create trigger site_ratings_set_updated_at
before update on public.site_ratings
for each row
execute function public.set_site_rating_updated_at();

alter table public.site_ratings enable row level security;

drop policy if exists "Anyone can insert site ratings" on public.site_ratings;
drop policy if exists "Anyone can update site ratings" on public.site_ratings;
drop policy if exists "Owner can read site ratings" on public.site_ratings;

create or replace function public.submit_site_rating(
  input_visitor_id text,
  input_rating smallint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if char_length(coalesce(input_visitor_id, '')) not between 8 and 120 then
    raise exception 'invalid visitor id';
  end if;

  if input_rating not between 1 and 5 then
    raise exception 'invalid rating';
  end if;

  insert into public.site_ratings (visitor_id, rating)
  values (input_visitor_id, input_rating)
  on conflict (visitor_id)
  do update
    set rating = excluded.rating;
end;
$$;

create or replace function public.get_site_rating_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  breakdown jsonb;
  recent_ratings jsonb;
  total_ratings integer;
  average_rating numeric(3, 1);
  last_updated timestamptz;
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'REPLACE_WITH_OWNER_EMAIL' then
    raise exception 'unauthorized';
  end if;

  select
    count(*)::int,
    round(avg(rating)::numeric, 1),
    max(updated_at)
  into total_ratings, average_rating, last_updated
  from public.site_ratings;

  select jsonb_agg(
    jsonb_build_object(
      'rating', rating_bucket.rating,
      'count', rating_bucket.count
    )
    order by rating_bucket.rating
  )
  into breakdown
  from (
    select
      series.rating,
      coalesce(count(site_ratings.rating), 0)::int as count
    from generate_series(1, 5) as series(rating)
    left join public.site_ratings
      on public.site_ratings.rating = series.rating
    group by series.rating
    order by series.rating
  ) as rating_bucket;

  select jsonb_agg(
    jsonb_build_object(
      'rating', recent_entry.rating,
      'updatedAt', recent_entry.updated_at
    )
    order by recent_entry.updated_at desc
  )
  into recent_ratings
  from (
    select rating, updated_at
    from public.site_ratings
    order by updated_at desc
    limit 8
  ) as recent_entry;

  return jsonb_build_object(
    'totalRatings', coalesce(total_ratings, 0),
    'averageRating', average_rating,
    'breakdown', coalesce(breakdown, '[]'::jsonb),
    'recentRatings', coalesce(recent_ratings, '[]'::jsonb),
    'lastUpdated', last_updated
  );
end;
$$;

grant usage on schema public to anon, authenticated;
revoke all on public.site_ratings from anon, authenticated;

revoke all on function public.submit_site_rating(text, smallint) from public;
grant execute on function public.submit_site_rating(text, smallint) to anon, authenticated;

revoke all on function public.get_site_rating_summary() from public;
grant execute on function public.get_site_rating_summary() to authenticated;
