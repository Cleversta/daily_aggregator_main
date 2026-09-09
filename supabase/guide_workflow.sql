-- Run AFTER guide_schema.sql. Private drafts never modify published content.
begin;
alter table guide_intents add column if not exists steps jsonb not null default '[]';
alter table guide_intents add column if not exists sources jsonb not null default '[]';
alter table guide_intents add column if not exists verification text not null default 'unverified';
alter table guide_intents add column if not exists verified_on date;
alter table guide_intents add column if not exists publication_id uuid;
alter table guide_recommendations add column if not exists limitations text;
alter table guide_recommendations add column if not exists signup text;
alter table guide_recommendations add column if not exists privacy text;
alter table guide_recommendations add column if not exists source_urls jsonb not null default '[]';
alter table guide_recommendations add column if not exists link_checked_at timestamptz;

create table if not exists guide_drafts (
 slug text primary key, content jsonb not null, version integer not null default 1,
 status text not null default 'draft' check(status in ('draft','review','published')),
 publication_id uuid, updated_at timestamptz not null default now()
);
create table if not exists guide_jobs (
 id uuid primary key default gen_random_uuid(), slug text not null references guide_drafts(slug),
 draft_version integer not null, input jsonb not null,
 status text not null default 'queued' check(status in ('queued','running','waiting','done','failed','superseded')),
 attempts integer not null default 0, available_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), created_at timestamptz not null default now(),
 message text, sources jsonb
);
create unique index if not exists guide_one_active_job on guide_jobs(slug) where status in ('queued','running','waiting');
create table if not exists guide_usage (
 provider text not null, period text not null, used integer not null default 0,
 primary key(provider, period)
);
create table if not exists guide_admins (
 email text primary key check (email = lower(email)),
 created_at timestamptz not null default now()
);
alter table guide_drafts enable row level security;
alter table guide_jobs enable row level security;
alter table guide_usage enable row level security;
alter table guide_admins enable row level security;
grant all on guide_drafts,guide_jobs,guide_usage,guide_admins to service_role;
-- No public policies for drafts, jobs, or usage.
-- Tighten old child policies so unpublished parent content cannot leak.
drop policy if exists "Public read access to search phrases" on guide_search_phrases;
create policy "Public read access to search phrases" on guide_search_phrases for select using
 (exists(select 1 from guide_intents i where i.id = intent_id and i.status = 'published'));
drop policy if exists "Public read access to published recommendations" on guide_recommendations;
create policy "Public read access to published recommendations" on guide_recommendations for select using
 (status = 'published' and exists(select 1 from guide_intents i where i.id = intent_id and i.status = 'published'));

create or replace function guide_save(p_slug text, p_content jsonb, p_version integer)
returns guide_drafts language plpgsql set search_path = public as $$
declare d guide_drafts;
begin
 if p_version = 0 then
  insert into guide_drafts(slug,content) values(p_slug,p_content) returning * into d;
 else
  update guide_drafts set content=p_content, version=version+1, status='draft', updated_at=now()
   where slug=p_slug and version=p_version returning * into d;
  if not found then raise exception 'Draft changed. Reload before saving.'; end if;
 end if;
 return d;
end $$;

create or replace function guide_queue(p_slug text, p_version integer)
returns uuid language plpgsql set search_path = public as $$
declare d guide_drafts; job_id uuid;
begin
 select * into d from guide_drafts where slug=p_slug for update;
 if not found or d.version <> p_version then raise exception 'Draft changed. Save or reload first.'; end if;
 update guide_jobs set status='superseded', message='A newer draft was queued.', updated_at=now()
  where slug=p_slug and draft_version<>d.version and status in ('queued','running','waiting');
 select id into job_id from guide_jobs where slug=p_slug and status in ('queued','running','waiting');
 if job_id is not null then return job_id; end if;
 insert into guide_jobs(slug,draft_version,input) values(d.slug,d.version,d.content) returning id into job_id;
 return job_id;
end $$;

create or replace function guide_claim()
returns setof guide_jobs language plpgsql set search_path = public as $$
begin
 -- A runner killed mid-request may have spent quota; never refund reservations.
 update guide_jobs set status=case when attempts>=3 then 'failed' else 'waiting' end,
  message='Previous worker stopped; retry scheduled.', available_at=now(), updated_at=now()
  where status='running' and updated_at < now()-interval '15 minutes';
 return query update guide_jobs set status='running', attempts=attempts+1, updated_at=now()
 where id=(select id from guide_jobs where status in ('queued','waiting') and available_at<=now() and attempts<3
  order by created_at for update skip locked limit 1) returning *;
end $$;

create or replace function guide_reserve(p_provider text,p_period text,p_limit integer)
returns boolean language plpgsql set search_path = public as $$
begin
 if p_limit<1 then return false; end if;
 insert into guide_usage(provider,period,used) values(p_provider,p_period,1)
 on conflict(provider,period) do update set used=guide_usage.used+1 where guide_usage.used<p_limit;
 return found;
end $$;

create or replace function guide_complete(p_id uuid,p_content jsonb,p_attempt integer)
returns boolean language plpgsql set search_path = public as $$
declare j guide_jobs; changed boolean;
begin
 -- Lock drafts before jobs, matching guide_queue to avoid deadlocks.
 select * into j from guide_jobs where id=p_id;
 if not found then return false; end if;
 perform 1 from guide_drafts where slug=j.slug for update;
 select * into j from guide_jobs where id=p_id and status='running' and attempts=p_attempt for update;
 if not found then return false; end if;
 update guide_drafts set content=p_content,status='review',version=version+1,updated_at=now()
 where slug=j.slug and version=j.draft_version;
 changed:=found;
 update guide_jobs set status=case when changed then 'done' else 'superseded' end,
 message=case when changed then 'Draft ready for your review.' else 'Draft was edited during research. Your edits were preserved.' end,
 updated_at=now() where id=p_id;
 return changed;
end $$;

create or replace function guide_publish(p_slug text,p_version integer)
returns uuid language plpgsql set search_path = public as $$
declare d guide_drafts; c jsonb; intent_id_value uuid; publication uuid; r jsonb; position integer:=0;
begin
 select * into d from guide_drafts where slug=p_slug for update;
 if not found or d.version<>p_version then raise exception 'Draft changed. Reload before publishing.'; end if;
 if d.status='published' then return d.publication_id; end if;
 c:=d.content; publication:=gen_random_uuid();
 if coalesce(c->>'verification','unverified') not in ('documentation','tested') or nullif(c->>'verified_on','') is null
  or jsonb_array_length(c->'recommendations')<1 or jsonb_array_length(c->'sources')<1
  or jsonb_array_length(c->'steps')<1 then raise exception 'Review and verify the guide before publishing.'; end if;
 insert into guide_intents(slug,name,category,description,status,steps,sources,verification,verified_on,publication_id,updated_at)
 values(p_slug,c->>'name',c->>'category',c->>'description','published',c->'steps',c->'sources',c->>'verification',(c->>'verified_on')::date,publication,now())
 on conflict(slug) do update set name=excluded.name,category=excluded.category,description=excluded.description,
 status='published',steps=excluded.steps,sources=excluded.sources,verification=excluded.verification,
 verified_on=excluded.verified_on,publication_id=excluded.publication_id,updated_at=now() returning id into intent_id_value;
 delete from guide_recommendations where intent_id=intent_id_value;
 delete from guide_search_phrases where intent_id=intent_id_value;
 for r in select * from jsonb_array_elements(c->'recommendations') loop
  position:=position+1;
  insert into guide_recommendations(intent_id,name,url,description,reason,rank,status,limitations,signup,privacy,source_urls,last_verified)
  values(intent_id_value,r->>'name',r->>'url',r->>'description',r->>'reason',position,'published',r->>'limitations',r->>'signup',r->>'privacy',r->'source_urls',(c->>'verified_on')::timestamptz);
 end loop;
 insert into guide_search_phrases(intent_id,phrase) select intent_id_value,value from jsonb_array_elements_text(c->'phrases');
 update guide_drafts set status='published',publication_id=publication,updated_at=now() where slug=p_slug;
 return publication;
end $$;

-- Backfill existing guides into editable private drafts. Never overwrite edits.
insert into guide_drafts(slug,content,status,publication_id)
select i.slug,jsonb_build_object('slug',i.slug,'name',i.name,'category',i.category,'description',coalesce(i.description,''),
 'steps',i.steps,'sources',i.sources,'verification',i.verification,'verified_on',coalesce(i.verified_on::text,''),
 'phrases',coalesce((select jsonb_agg(p.phrase) from guide_search_phrases p where p.intent_id=i.id),'[]'),
 'recommendations',coalesce((select jsonb_agg(jsonb_build_object('name',r.name,'url',r.url,'description',r.description,'reason',r.reason,
 'limitations',r.limitations,'signup',r.signup,'privacy',r.privacy,'source_urls',r.source_urls) order by r.rank)
 from guide_recommendations r where r.intent_id=i.id and r.status='published'),'[]')),
 'draft',i.publication_id from guide_intents i on conflict(slug) do nothing;

revoke all on function guide_save(text,jsonb,integer),guide_queue(text,integer),guide_claim(),guide_reserve(text,text,integer),guide_complete(uuid,jsonb,integer),guide_publish(text,integer) from public,anon,authenticated;
grant execute on function guide_save(text,jsonb,integer),guide_queue(text,integer),guide_claim(),guide_reserve(text,text,integer),guide_complete(uuid,jsonb,integer),guide_publish(text,integer) to service_role;
commit;
