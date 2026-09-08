-- Adds the `ai-workflow` section. Its payload is stored as raw jsonb in
-- section_payloads (read/written directly by the app), so the normalized
-- export/replace functions are intentionally left untouched.
begin;

alter table public.section_payloads
  drop constraint if exists section_payloads_section_key_check;

alter table public.section_payloads
  add constraint section_payloads_section_key_check check (
    section_key in (
      'site',
      'about',
      'skills',
      'archiving',
      'career',
      'projects',
      'project-portfolio-sync',
      'activity-heatmap',
      'ai-workflow'
    )
  );

commit;
