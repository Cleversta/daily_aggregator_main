-- Disposable database only. See GUIDE_WORKFLOW.md.
\set ON_ERROR_STOP on
begin;
select guide_save('integration-guide', '{"slug":"integration-guide","name":"Test task","category":"images","description":"Test description","steps":["Step one"],"sources":[{"title":"Docs","url":"https://example.com/docs"}],"verification":"documentation","verified_on":"2026-01-01","phrases":["test phrase"],"recommendations":[{"name":"Tool","url":"https://example.com","description":"Test","reason":"Test","limitations":"Unknown","signup":"Unknown","privacy":"Unknown","source_urls":["https://example.com/docs"]}]}',0);

do $$ declare first_id uuid; second_id uuid; j guide_jobs; count_value integer; ok boolean; begin
 if (select count(*) from guide_intents where slug='integration-guide')<>0 then raise exception 'Draft leaked into published data'; end if;
 first_id:=guide_publish('integration-guide',1);
 second_id:=guide_publish('integration-guide',1);
 if first_id<>second_id then raise exception 'Repeated publish was not idempotent'; end if;
 if (select count(*) from guide_recommendations where intent_id=(select id from guide_intents where slug='integration-guide'))<>1 then raise exception 'Duplicate recommendations'; end if;
 perform guide_save('integration-guide',(select content || '{"description":"New private description"}'::jsonb from guide_drafts where slug='integration-guide'),1);
 if (select description from guide_intents where slug='integration-guide')<>'Test description' then raise exception 'Draft save altered public content'; end if;
 begin
  perform guide_save('integration-guide','{}',1);
  raise exception 'Stale save incorrectly succeeded';
 exception when raise_exception then
  if sqlerrm <> 'Draft changed. Reload before saving.' then raise; end if;
 end;
 first_id:=guide_queue('integration-guide',2);
 second_id:=guide_queue('integration-guide',2);
 if first_id<>second_id then raise exception 'Duplicate active research'; end if;
 select * into j from guide_claim();
 if j.id<>first_id or j.attempts<>1 then raise exception 'Claim failed'; end if;
 perform guide_save('integration-guide',(select content from guide_drafts where slug='integration-guide'),2);
 ok:=guide_complete(j.id,j.input,j.attempts);
 if ok then raise exception 'Research overwrote concurrent edit'; end if;
 if (select status from guide_jobs where id=j.id)<>'superseded' then raise exception 'Missing superseded state'; end if;
 first_id:=guide_queue('integration-guide',3);
 select * into j from guide_claim();
 ok:=guide_complete(j.id,j.input,j.attempts);
 if not ok or (select status from guide_drafts where slug='integration-guide')<>'review' then raise exception 'Draft completion failed'; end if;
 if guide_complete(j.id,'{}',j.attempts) then raise exception 'Job completed twice'; end if;
 if (select description from guide_intents where slug='integration-guide')<>'Test description' then raise exception 'AI completion published content'; end if;
 perform guide_publish('integration-guide',4);
 if (select description from guide_intents where slug='integration-guide')<>'New private description' then raise exception 'Publication did not replace content'; end if;
 if not guide_reserve('test','month',2) or not guide_reserve('test','month',2) or guide_reserve('test','month',2) then raise exception 'Quota enforcement failed'; end if;
 if guide_reserve('test','zero',0) then raise exception 'Disabled budget accepted'; end if;
 if (select count(*) from guide_recommendations where intent_id=(select id from guide_intents where slug='integration-guide'))<>1 then raise exception 'Republish appended duplicate'; end if;
end $$;

-- Force a mid-publication failure to prove recommendations and parent rollback.
create function pg_temp.reject_rec() returns trigger language plpgsql as $$ begin raise exception 'forced recommendation failure'; end $$;
create trigger guide_test_reject before insert on guide_recommendations for each row execute function pg_temp.reject_rec();
select guide_save('integration-guide',(select content || '{"description":"Must not publish"}'::jsonb from guide_drafts where slug='integration-guide'),4);
do $$ begin
 begin perform guide_publish('integration-guide',5); exception when raise_exception then
  if sqlerrm<>'forced recommendation failure' then raise; end if;
 end;
 if (select description from guide_intents where slug='integration-guide')<>'New private description' then raise exception 'Partial publication leaked'; end if;
 if (select count(*) from guide_recommendations where intent_id=(select id from guide_intents where slug='integration-guide'))<>1 then raise exception 'Rollback lost recommendations'; end if;
end $$;
drop trigger guide_test_reject on guide_recommendations;

-- An unpublished parent's child rows must be private, too.
insert into guide_intents(slug,name,category,status) values('private-parent','Private','images','draft');
insert into guide_search_phrases(intent_id,phrase) select id,'secret phrase' from guide_intents where slug='private-parent';
insert into guide_recommendations(intent_id,name,url,status) select id,'Secret recommendation','https://example.com','published' from guide_intents where slug='private-parent';
set local role anon;
do $$ begin
 if (select count(*) from guide_drafts)<>0 or (select count(*) from guide_jobs)<>0 or (select count(*) from guide_usage)<>0 then raise exception 'Private workflow data leaked'; end if;
 if exists(select 1 from guide_search_phrases where phrase='secret phrase') or exists(select 1 from guide_recommendations where name='Secret recommendation') then raise exception 'Unpublished children leaked'; end if;
 begin perform guide_publish('integration-guide',5); raise exception 'Anonymous publication succeeded'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
\echo 'PASS: private drafts, publication, rollback, stale edits, queue, quotas and RLS'
