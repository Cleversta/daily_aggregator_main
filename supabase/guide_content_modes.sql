-- Run after guide_workflow.sql. No existing draft content is overwritten.
-- Deploy this migration before the new admin/worker code; old clients still work.
begin;
alter table guide_intents add column if not exists content_mode text not null default 'ai'
 check (content_mode in ('manual','ai','recommendations'));
create or replace function guide_queue(p_slug text, p_version integer)
returns uuid language plpgsql set search_path = public as $$
declare d guide_drafts; job_id uuid;
begin
 select * into d from guide_drafts where slug=p_slug for update;
 if not found or d.version <> p_version then raise exception 'Draft changed. Save or reload first.'; end if;
 if coalesce(d.content->>'content_mode','ai') = 'manual' then raise exception 'Manual guides do not use AI research.'; end if;
 update guide_jobs set status='superseded', message='A newer draft was queued.', updated_at=now()
  where slug=p_slug and draft_version<>d.version and status in ('queued','running','waiting');
 select id into job_id from guide_jobs where slug=p_slug and status in ('queued','running','waiting');
 if job_id is not null then return job_id; end if;
 insert into guide_jobs(slug,draft_version,input) values(d.slug,d.version,d.content) returning id into job_id;
 return job_id;
end $$;

create or replace function guide_publish(p_slug text,p_version integer)
returns uuid language plpgsql set search_path = public as $$
declare d guide_drafts; c jsonb; intent_id_value uuid; publication uuid; r jsonb; position integer:=0;
begin
 select * into d from guide_drafts where slug=p_slug for update;
 if not found or d.version<>p_version then raise exception 'Draft changed. Reload before publishing.'; end if;
 if d.status='published' then return d.publication_id; end if;
 c:=d.content; publication:=gen_random_uuid();
 if coalesce(c->>'content_mode','ai') not in ('manual','ai','recommendations') then raise exception 'Invalid content mode.'; end if;
 if coalesce(c->>'verification','unverified') not in ('documentation','tested') or nullif(c->>'verified_on','') is null
  or coalesce(jsonb_array_length(c->'sources'),0)<1
  or nullif(trim(c->>'description'),'') is null
  or (coalesce(c->>'content_mode','ai')='recommendations' and coalesce(jsonb_array_length(c->'recommendations'),0)<1)
  or (coalesce(c->>'content_mode','ai')<>'recommendations' and coalesce(jsonb_array_length(c->'steps'),0)<1) then raise exception 'Review and verify the guide before publishing.'; end if;
 insert into guide_intents(slug,name,category,description,content_mode,status,steps,sources,verification,verified_on,publication_id,updated_at)
 values(p_slug,c->>'name',c->>'category',c->>'description',coalesce(c->>'content_mode','ai'),'published',c->'steps',c->'sources',c->>'verification',(c->>'verified_on')::date,publication,now())
 on conflict(slug) do update set name=excluded.name,category=excluded.category,description=excluded.description,
 content_mode=excluded.content_mode,status='published',steps=excluded.steps,sources=excluded.sources,verification=excluded.verification,
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


revoke all on function guide_queue(text,integer),guide_publish(text,integer) from public,anon,authenticated;
grant execute on function guide_queue(text,integer),guide_publish(text,integer) to service_role;
commit;
