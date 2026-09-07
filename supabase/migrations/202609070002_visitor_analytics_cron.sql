begin;

do $$
begin
  if to_regnamespace('cron') is null then
    raise exception 'pg_cron is not installed; enable it before applying this migration';
  end if;

  perform cron.schedule(
    'portfolio-analytics-retention',
    '0 18 * * *',
    'select public.analytics_purge(now(), false);'
  );
end;
$$;

commit;
