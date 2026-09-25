begin;

alter table public.section_payloads
  drop constraint if exists section_payloads_section_key_check;

alter table public.section_payloads
  add constraint section_payloads_section_key_check check (
    section_key in (
      'site', 'about', 'skills', 'archiving', 'career', 'projects',
      'project-portfolio-sync', 'activity-heatmap', 'ai-workflow',
      'featured-projects'
    )
  );

insert into public.section_payloads (section_key, payload)
values ('featured-projects', '{"ids":[]}'::jsonb)
on conflict (section_key) do nothing;

commit;
