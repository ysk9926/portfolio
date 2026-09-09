-- Drops the `is_main` flag from projects. Every row carried is_main = true, so
-- the 전체/주요 프로젝트 filter and the "주요 프로젝트" badges it drove were no-ops.
-- admin_replace_section and export_section_payload are recreated verbatim from
-- 202604210001_portfolio_schema.sql with the is_main column/key removed.
begin;

alter table public.projects
  drop column if exists is_main;

create or replace function public.admin_replace_section(
  p_section_key text,
  p_payload jsonb
)
returns timestamptz
language plpgsql
as $$
declare
  v_now timestamptz := now();
  v_item jsonb;
  v_child jsonb;
  v_sort integer;
  v_category_id bigint;
  v_archiving_item_id bigint;
  v_career_entry_id bigint;
  v_sync_batch_id bigint;
  v_sync_entry_id bigint;
  v_snapshot_id bigint;
  v_week_id bigint;
  v_day_id bigint;
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'forbidden';
  end if;

  if p_section_key not in (
    'site',
    'about',
    'skills',
    'archiving',
    'career',
    'projects',
    'project-portfolio-sync',
    'activity-heatmap'
  ) then
    raise exception 'invalid section_key: %', p_section_key;
  end if;

  case p_section_key
    when 'site' then
      insert into public.site_config (
        id,
        name,
        title,
        description,
        url,
        og_image,
        about_summary,
        profile_image
      ) values (
        1,
        p_payload->'config'->>'name',
        p_payload->'config'->>'title',
        p_payload->'config'->>'description',
        p_payload->'config'->>'url',
        p_payload->'config'->>'ogImage',
        p_payload->>'aboutSummary',
        p_payload->>'profileImage'
      )
      on conflict (id)
      do update
      set
        name = excluded.name,
        title = excluded.title,
        description = excluded.description,
        url = excluded.url,
        og_image = excluded.og_image,
        about_summary = excluded.about_summary,
        profile_image = excluded.profile_image;

      insert into public.site_hero (id, greeting, name, role, tagline, cta)
      values (
        1,
        p_payload->'hero'->>'greeting',
        p_payload->'hero'->>'name',
        p_payload->'hero'->>'role',
        p_payload->'hero'->>'tagline',
        p_payload->'hero'->>'cta'
      )
      on conflict (id)
      do update
      set
        greeting = excluded.greeting,
        name = excluded.name,
        role = excluded.role,
        tagline = excluded.tagline,
        cta = excluded.cta;

      insert into public.site_footer (id, copyright, built_with)
      values (
        1,
        p_payload->'footer'->>'copyright',
        p_payload->'footer'->>'builtWith'
      )
      on conflict (id)
      do update
      set
        copyright = excluded.copyright,
        built_with = excluded.built_with;

      delete from public.site_nav;
      v_sort := 0;
      for v_item in select value from jsonb_array_elements(p_payload->'nav') loop
        insert into public.site_nav (sort_order, label, href)
        values (
          v_sort,
          v_item->>'label',
          v_item->>'href'
        );
        v_sort := v_sort + 1;
      end loop;

    when 'about' then
      delete from public.about_items;
      v_sort := 0;
      for v_item in select value from jsonb_array_elements(p_payload) loop
        insert into public.about_items (sort_order, icon, label, value)
        values (
          v_sort,
          v_item->>'icon',
          v_item->>'label',
          v_item->>'value'
        );
        v_sort := v_sort + 1;
      end loop;

    when 'skills' then
      delete from public.skills_categories;
      v_sort := 0;
      for v_item in select value from jsonb_array_elements(p_payload) loop
        insert into public.skills_categories (sort_order, category, color)
        values (v_sort, v_item->>'category', v_item->>'color')
        returning id into v_category_id;

        v_sort := v_sort + 1;

        declare
          v_skill_sort integer := 0;
        begin
          for v_child in select value from jsonb_array_elements(v_item->'skills') loop
            insert into public.skills_items (category_id, sort_order, name, level, detail)
            values (
              v_category_id,
              v_skill_sort,
              v_child->>'name',
              (v_child->>'level')::integer,
              v_child->>'detail'
            );
            v_skill_sort := v_skill_sort + 1;
          end loop;
        end;
      end loop;

    when 'archiving' then
      delete from public.archiving_items;
      v_sort := 0;
      for v_item in select value from jsonb_array_elements(p_payload) loop
        insert into public.archiving_items (sort_order, title, description, url)
        values (
          v_sort,
          v_item->>'title',
          v_item->>'description',
          v_item->>'url'
        )
        returning id into v_archiving_item_id;

        v_sort := v_sort + 1;

        declare
          v_detail_sort integer := 0;
        begin
          for v_child in select value from jsonb_array_elements(v_item->'details') loop
            insert into public.archiving_details (item_id, sort_order, detail)
            values (v_archiving_item_id, v_detail_sort, v_child #>> '{}');
            v_detail_sort := v_detail_sort + 1;
          end loop;
        end;
      end loop;

    when 'career' then
      delete from public.career_entries;
      v_sort := 0;
      for v_item in select value from jsonb_array_elements(p_payload) loop
        insert into public.career_entries (sort_order, company, role, period, description)
        values (
          v_sort,
          v_item->>'company',
          v_item->>'role',
          v_item->>'period',
          v_item->>'description'
        )
        returning id into v_career_entry_id;

        v_sort := v_sort + 1;

        declare
          v_achievement_sort integer := 0;
        begin
          for v_child in select value from jsonb_array_elements(v_item->'achievements') loop
            insert into public.career_achievements (entry_id, sort_order, achievement)
            values (v_career_entry_id, v_achievement_sort, v_child #>> '{}');
            v_achievement_sort := v_achievement_sort + 1;
          end loop;
        end;
      end loop;

    when 'projects' then
      delete from public.projects;
      v_sort := 0;
      for v_item in select value from jsonb_array_elements(p_payload) loop
        insert into public.projects (
          id,
          sort_order,
          title,
          period,
          description,
          deploy_url,
          github_url,
          thumbnail,
          short_description
        ) values (
          (v_item->>'id')::integer,
          v_sort,
          v_item->>'title',
          v_item->>'period',
          v_item->>'description',
          v_item->>'deployUrl',
          v_item->>'githubUrl',
          v_item->>'thumbnail',
          v_item->>'shortDescription'
        );

        declare
          v_project_id integer := (v_item->>'id')::integer;
          v_feature_sort integer := 0;
          v_tech_sort integer := 0;
          v_screenshot_sort integer := 0;
        begin
          for v_child in select value from jsonb_array_elements(v_item->'features') loop
            insert into public.project_features (project_id, sort_order, feature)
            values (v_project_id, v_feature_sort, v_child #>> '{}');
            v_feature_sort := v_feature_sort + 1;
          end loop;

          for v_child in select value from jsonb_array_elements(v_item->'techStack') loop
            insert into public.project_tech_stacks (project_id, sort_order, tech)
            values (v_project_id, v_tech_sort, v_child #>> '{}');
            v_tech_sort := v_tech_sort + 1;
          end loop;

          for v_child in select value from jsonb_array_elements(v_item->'screenshots') loop
            insert into public.project_screenshots (project_id, sort_order, screenshot)
            values (v_project_id, v_screenshot_sort, v_child #>> '{}');
            v_screenshot_sort := v_screenshot_sort + 1;
          end loop;

          if (v_item ? 'star') and v_item->'star' <> 'null'::jsonb then
            insert into public.project_stars (
              project_id,
              summary,
              role,
              background,
              solutions,
              results,
              troubleshooting
            ) values (
              v_project_id,
              v_item->'star'->>'summary',
              v_item->'star'->>'role',
              v_item->'star'->>'background',
              v_item->'star'->>'solutions',
              v_item->'star'->>'results',
              v_item->'star'->>'troubleshooting'
            );
          end if;
        end;

        v_sort := v_sort + 1;
      end loop;

    when 'project-portfolio-sync' then
      delete from public.project_portfolio_sync_batches;

      insert into public.project_portfolio_sync_batches (generated_at)
      values (p_payload->>'generatedAt')
      returning id into v_sync_batch_id;

      v_sort := 0;
      for v_item in select value from jsonb_array_elements(p_payload->'projects') loop
        insert into public.project_portfolio_sync_entries (
          batch_id,
          sort_order,
          project_key,
          project_title,
          source_doc,
          source_doc_relative,
          headline,
          summary,
          status,
          period,
          company,
          role,
          team_size,
          updated,
          track,
          today_commit_count,
          last_authored_commit_at,
          recent_updates,
          portfolio_notes,
          thumbnail,
          screenshot_count
        ) values (
          v_sync_batch_id,
          v_sort,
          v_item->>'projectKey',
          v_item->>'projectTitle',
          v_item->>'sourceDoc',
          v_item->>'sourceDocRelative',
          v_item->>'headline',
          v_item->>'summary',
          v_item->>'status',
          v_item->>'period',
          v_item->>'company',
          v_item->>'role',
          v_item->>'teamSize',
          v_item->>'updated',
          v_item->>'track',
          (v_item->>'todayCommitCount')::integer,
          v_item->>'lastAuthoredCommitAt',
          v_item->>'recentUpdates',
          v_item->>'portfolioNotes',
          v_item->>'thumbnail',
          (v_item->>'screenshotCount')::integer
        )
        returning id into v_sync_entry_id;

        declare
          v_tech_sort integer := 0;
          v_repo_sort integer := 0;
          v_screenshot_sort integer := 0;
        begin
          for v_child in select value from jsonb_array_elements(v_item->'tech') loop
            insert into public.project_portfolio_sync_tech (entry_id, sort_order, tech)
            values (v_sync_entry_id, v_tech_sort, v_child #>> '{}');
            v_tech_sort := v_tech_sort + 1;
          end loop;

          for v_child in select value from jsonb_array_elements(v_item->'linkedRepos') loop
            insert into public.project_portfolio_sync_linked_repos (entry_id, sort_order, repo)
            values (v_sync_entry_id, v_repo_sort, v_child #>> '{}');
            v_repo_sort := v_repo_sort + 1;
          end loop;

          for v_child in select value from jsonb_array_elements(v_item->'screenshots') loop
            insert into public.project_portfolio_sync_screenshots (entry_id, sort_order, screenshot)
            values (v_sync_entry_id, v_screenshot_sort, v_child #>> '{}');
            v_screenshot_sort := v_screenshot_sort + 1;
          end loop;
        end;

        v_sort := v_sort + 1;
      end loop;

    when 'activity-heatmap' then
      delete from public.activity_heatmap_snapshots;

      insert into public.activity_heatmap_snapshots (
        generated_at,
        range_start,
        range_end,
        active_days,
        company_active_days,
        personal_active_days,
        total_company_commits,
        total_personal_commits,
        total_commits,
        latest_active_date
      ) values (
        p_payload->>'generatedAt',
        p_payload->>'rangeStart',
        p_payload->>'rangeEnd',
        (p_payload->'summary'->>'activeDays')::integer,
        (p_payload->'summary'->>'companyActiveDays')::integer,
        (p_payload->'summary'->>'personalActiveDays')::integer,
        (p_payload->'summary'->>'totalCompanyCommits')::integer,
        (p_payload->'summary'->>'totalPersonalCommits')::integer,
        (p_payload->'summary'->>'totalCommits')::integer,
        p_payload->'summary'->>'latestActiveDate'
      )
      returning id into v_snapshot_id;

      v_sort := 0;
      for v_item in select value from jsonb_array_elements(p_payload->'weeks') loop
        insert into public.activity_heatmap_weeks (snapshot_id, sort_order, week_start)
        values (v_snapshot_id, v_sort, v_item->>'weekStart')
        returning id into v_week_id;

        declare
          v_day_sort integer := 0;
        begin
          for v_child in select value from jsonb_array_elements(v_item->'days') loop
            insert into public.activity_heatmap_days (
              week_id,
              sort_order,
              date,
              weekday,
              in_range,
              company_commit_count,
              personal_commit_count,
              total_commit_count,
              intensity_level,
              company_intensity_level,
              personal_intensity_level,
              has_activity
            ) values (
              v_week_id,
              v_day_sort,
              v_child->>'date',
              v_child->>'weekday',
              (v_child->>'inRange')::boolean,
              (v_child->>'companyCommitCount')::integer,
              (v_child->>'personalCommitCount')::integer,
              (v_child->>'totalCommitCount')::integer,
              (v_child->>'intensityLevel')::integer,
              (v_child->>'companyIntensityLevel')::integer,
              (v_child->>'personalIntensityLevel')::integer,
              (v_child->>'hasActivity')::boolean
            )
            returning id into v_day_id;

            declare
              v_company_sort integer := 0;
              v_personal_sort integer := 0;
            begin
              for v_item in select value from jsonb_array_elements(v_child->'companyProjects') loop
                insert into public.activity_heatmap_day_project_refs (
                  day_id,
                  track,
                  sort_order,
                  name,
                  count
                ) values (
                  v_day_id,
                  '회사',
                  v_company_sort,
                  v_item->>'name',
                  (v_item->>'count')::integer
                );
                v_company_sort := v_company_sort + 1;
              end loop;

              for v_item in select value from jsonb_array_elements(v_child->'personalProjects') loop
                insert into public.activity_heatmap_day_project_refs (
                  day_id,
                  track,
                  sort_order,
                  name,
                  count
                ) values (
                  v_day_id,
                  '개인',
                  v_personal_sort,
                  v_item->>'name',
                  (v_item->>'count')::integer
                );
                v_personal_sort := v_personal_sort + 1;
              end loop;
            end;

            v_day_sort := v_day_sort + 1;
          end loop;
        end;

        v_sort := v_sort + 1;
      end loop;
  end case;

  insert into public.section_payloads (section_key, payload, updated_at)
  values (p_section_key, p_payload, v_now)
  on conflict (section_key)
  do update
  set
    payload = excluded.payload,
    updated_at = excluded.updated_at;

  return v_now;
end;
$$;
create or replace function public.export_section_payload(
  p_section_key text
)
returns jsonb
language plpgsql
stable
as $$
declare
  v_payload jsonb;
  v_batch_id bigint;
  v_snapshot_id bigint;
begin
  if p_section_key not in (
    'site',
    'about',
    'skills',
    'archiving',
    'career',
    'projects',
    'project-portfolio-sync',
    'activity-heatmap'
  ) then
    raise exception 'invalid section_key: %', p_section_key;
  end if;

  case p_section_key
    when 'site' then
      select jsonb_build_object(
        'config',
        coalesce((
          select jsonb_build_object(
            'name', name,
            'title', title,
            'description', description,
            'url', url,
            'ogImage', og_image
          )
          from public.site_config
          where id = 1
        ), '{}'::jsonb),
        'nav',
        coalesce((
          select jsonb_agg(
            jsonb_build_object('label', label, 'href', href)
            order by sort_order
          )
          from public.site_nav
        ), '[]'::jsonb),
        'hero',
        coalesce((
          select jsonb_build_object(
            'greeting', greeting,
            'name', name,
            'role', role,
            'tagline', tagline,
            'cta', cta
          )
          from public.site_hero
          where id = 1
        ), '{}'::jsonb),
        'aboutSummary',
        coalesce((select about_summary from public.site_config where id = 1), ''),
        'profileImage',
        coalesce((select profile_image from public.site_config where id = 1), ''),
        'footer',
        coalesce((
          select jsonb_build_object(
            'copyright', copyright,
            'builtWith', built_with
          )
          from public.site_footer
          where id = 1
        ), '{}'::jsonb)
      ) into v_payload;

    when 'about' then
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'icon', icon,
            'label', label,
            'value', value
          )
          order by sort_order
        ),
        '[]'::jsonb
      )
      into v_payload
      from public.about_items;

    when 'skills' then
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'category', c.category,
            'color', c.color,
            'skills', coalesce((
              select jsonb_agg(
                jsonb_strip_nulls(
                  jsonb_build_object(
                    'name', s.name,
                    'level', s.level,
                    'detail', s.detail
                  )
                )
                order by s.sort_order
              )
              from public.skills_items s
              where s.category_id = c.id
            ), '[]'::jsonb)
          )
          order by c.sort_order
        ),
        '[]'::jsonb
      )
      into v_payload
      from public.skills_categories c;

    when 'archiving' then
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'title', a.title,
            'description', a.description,
            'url', a.url,
            'details', coalesce((
              select jsonb_agg(d.detail order by d.sort_order)
              from public.archiving_details d
              where d.item_id = a.id
            ), '[]'::jsonb)
          )
          order by a.sort_order
        ),
        '[]'::jsonb
      )
      into v_payload
      from public.archiving_items a;

    when 'career' then
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'company', c.company,
            'role', c.role,
            'period', c.period,
            'description', c.description,
            'achievements', coalesce((
              select jsonb_agg(a.achievement order by a.sort_order)
              from public.career_achievements a
              where a.entry_id = c.id
            ), '[]'::jsonb)
          )
          order by c.sort_order
        ),
        '[]'::jsonb
      )
      into v_payload
      from public.career_entries c;

    when 'projects' then
      select coalesce(
        jsonb_agg(
          jsonb_strip_nulls(
            jsonb_build_object(
              'id', p.id,
              'title', p.title,
              'period', p.period,
              'description', p.description,
              'features', coalesce((
                select jsonb_agg(f.feature order by f.sort_order)
                from public.project_features f
                where f.project_id = p.id
              ), '[]'::jsonb),
              'techStack', coalesce((
                select jsonb_agg(t.tech order by t.sort_order)
                from public.project_tech_stacks t
                where t.project_id = p.id
              ), '[]'::jsonb),
              'deployUrl', p.deploy_url,
              'githubUrl', p.github_url,
              'thumbnail', p.thumbnail,
              'screenshots', coalesce((
                select jsonb_agg(s.screenshot order by s.sort_order)
                from public.project_screenshots s
                where s.project_id = p.id
              ), '[]'::jsonb),
              'shortDescription', p.short_description,
              'star', (
                select jsonb_strip_nulls(
                  jsonb_build_object(
                    'summary', ps.summary,
                    'role', ps.role,
                    'background', ps.background,
                    'solutions', ps.solutions,
                    'results', ps.results,
                    'troubleshooting', ps.troubleshooting
                  )
                )
                from public.project_stars ps
                where ps.project_id = p.id
              )
            )
          )
          order by p.sort_order
        ),
        '[]'::jsonb
      )
      into v_payload
      from public.projects p;

    when 'project-portfolio-sync' then
      select id into v_batch_id
      from public.project_portfolio_sync_batches
      order by id desc
      limit 1;

      if v_batch_id is null then
        v_payload := jsonb_build_object('generatedAt', null, 'projects', '[]'::jsonb);
      else
        select jsonb_build_object(
          'generatedAt', b.generated_at,
          'projects', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'projectKey', e.project_key,
                'projectTitle', e.project_title,
                'sourceDoc', e.source_doc,
                'sourceDocRelative', e.source_doc_relative,
                'headline', e.headline,
                'summary', e.summary,
                'status', e.status,
                'period', e.period,
                'company', e.company,
                'role', e.role,
                'teamSize', e.team_size,
                'updated', e.updated,
                'tech', coalesce((
                  select jsonb_agg(t.tech order by t.sort_order)
                  from public.project_portfolio_sync_tech t
                  where t.entry_id = e.id
                ), '[]'::jsonb),
                'track', e.track,
                'todayCommitCount', e.today_commit_count,
                'lastAuthoredCommitAt', e.last_authored_commit_at,
                'linkedRepos', coalesce((
                  select jsonb_agg(r.repo order by r.sort_order)
                  from public.project_portfolio_sync_linked_repos r
                  where r.entry_id = e.id
                ), '[]'::jsonb),
                'recentUpdates', e.recent_updates,
                'portfolioNotes', e.portfolio_notes,
                'thumbnail', e.thumbnail,
                'screenshots', coalesce((
                  select jsonb_agg(s.screenshot order by s.sort_order)
                  from public.project_portfolio_sync_screenshots s
                  where s.entry_id = e.id
                ), '[]'::jsonb),
                'screenshotCount', e.screenshot_count
              )
              order by e.sort_order
            )
            from public.project_portfolio_sync_entries e
            where e.batch_id = b.id
          ), '[]'::jsonb)
        )
        into v_payload
        from public.project_portfolio_sync_batches b
        where b.id = v_batch_id;
      end if;

    when 'activity-heatmap' then
      select id into v_snapshot_id
      from public.activity_heatmap_snapshots
      order by id desc
      limit 1;

      if v_snapshot_id is null then
        v_payload := jsonb_build_object(
          'generatedAt', null,
          'rangeStart', null,
          'rangeEnd', null,
          'summary', jsonb_build_object(
            'activeDays', 0,
            'companyActiveDays', 0,
            'personalActiveDays', 0,
            'totalCompanyCommits', 0,
            'totalPersonalCommits', 0,
            'totalCommits', 0,
            'latestActiveDate', null
          ),
          'weeks', '[]'::jsonb
        );
      else
        select jsonb_build_object(
          'generatedAt', s.generated_at,
          'rangeStart', s.range_start,
          'rangeEnd', s.range_end,
          'summary', jsonb_build_object(
            'activeDays', s.active_days,
            'companyActiveDays', s.company_active_days,
            'personalActiveDays', s.personal_active_days,
            'totalCompanyCommits', s.total_company_commits,
            'totalPersonalCommits', s.total_personal_commits,
            'totalCommits', s.total_commits,
            'latestActiveDate', s.latest_active_date
          ),
          'weeks', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'weekStart', w.week_start,
                'days', coalesce((
                  select jsonb_agg(
                    jsonb_build_object(
                      'date', d.date,
                      'weekday', d.weekday,
                      'inRange', d.in_range,
                      'companyCommitCount', d.company_commit_count,
                      'personalCommitCount', d.personal_commit_count,
                      'companyProjects', coalesce((
                        select jsonb_agg(
                          jsonb_build_object(
                            'name', r.name,
                            'count', r.count,
                            'track', r.track
                          )
                          order by r.sort_order
                        )
                        from public.activity_heatmap_day_project_refs r
                        where r.day_id = d.id and r.track = '회사'
                      ), '[]'::jsonb),
                      'personalProjects', coalesce((
                        select jsonb_agg(
                          jsonb_build_object(
                            'name', r.name,
                            'count', r.count,
                            'track', r.track
                          )
                          order by r.sort_order
                        )
                        from public.activity_heatmap_day_project_refs r
                        where r.day_id = d.id and r.track = '개인'
                      ), '[]'::jsonb),
                      'totalCommitCount', d.total_commit_count,
                      'intensityLevel', d.intensity_level,
                      'companyIntensityLevel', d.company_intensity_level,
                      'personalIntensityLevel', d.personal_intensity_level,
                      'hasActivity', d.has_activity
                    )
                    order by d.sort_order
                  )
                  from public.activity_heatmap_days d
                  where d.week_id = w.id
                ), '[]'::jsonb)
              )
              order by w.sort_order
            )
            from public.activity_heatmap_weeks w
            where w.snapshot_id = s.id
          ), '[]'::jsonb)
        )
        into v_payload
        from public.activity_heatmap_snapshots s
        where s.id = v_snapshot_id;
      end if;
  end case;

  return v_payload;
end;
$$;
commit;
