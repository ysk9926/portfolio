import 'server-only';

import {
  ActivityHeatmap,
  ArchiveItem,
  CareerEntry,
  PortfolioViewData,
  Project,
  ProjectPortfolioSync,
  SiteViewData,
  SkillCategory,
  AboutItem,
} from '@/lib/types/view';
import {
  SectionKey,
  SectionPayloadMap,
  sectionPayloadSchemaMap,
} from '@/lib/types/payload';
import { createServerSupabaseClient } from '@/utils/supabase/server';

const parseSectionPayload = <K extends SectionKey>(
  sectionKey: K,
  payload: unknown,
): SectionPayloadMap[K] => {
  const schema = sectionPayloadSchemaMap[sectionKey];
  return schema.parse(payload) as SectionPayloadMap[K];
};

export const getSectionPayload = async <K extends SectionKey>(
  sectionKey: K,
): Promise<SectionPayloadMap[K]> => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('export_section_payload', {
    p_section_key: sectionKey,
  });

  if (error) {
    throw new Error(`Failed to load section \"${sectionKey}\": ${error.message}`);
  }

  return parseSectionPayload(sectionKey, data);
};

export const getSectionUpdatedAt = async (sectionKey: SectionKey) => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('section_payloads')
    .select('updated_at')
    .eq('section_key', sectionKey)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load section metadata \"${sectionKey}\": ${error.message}`,
    );
  }

  return data?.updated_at ?? null;
};

export const getSiteData = async (): Promise<SiteViewData> => {
  const payload = await getSectionPayload('site');
  return payload as SiteViewData;
};

export const getPortfolioPageData = async (): Promise<PortfolioViewData> => {
  const [site, about, skills, archiving, activityHeatmap, projects, projectPortfolioSync, career] =
    await Promise.all([
      getSectionPayload('site'),
      getSectionPayload('about'),
      getSectionPayload('skills'),
      getSectionPayload('archiving'),
      getSectionPayload('activity-heatmap'),
      getSectionPayload('projects'),
      getSectionPayload('project-portfolio-sync'),
      getSectionPayload('career'),
    ]);

  return {
    site: site as SiteViewData,
    about: about as AboutItem[],
    skills: skills as SkillCategory[],
    archiving: archiving as ArchiveItem[],
    activityHeatmap: activityHeatmap as ActivityHeatmap,
    projects: projects as Project[],
    projectPortfolioSync: projectPortfolioSync as ProjectPortfolioSync,
    career: career as CareerEntry[],
  };
};
