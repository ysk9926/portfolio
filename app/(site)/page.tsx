import Hero from '@/components/sections/Hero';
import AiWorkflow from '@/components/sections/AiWorkflow';
import About from '@/components/sections/About';
import Skills from '@/components/sections/Skills';
import Archiving from '@/components/sections/Archiving';
import Projects from '@/components/sections/Projects';
import Career from '@/components/sections/Career';
import { getPortfolioPageData } from '@/lib/portfolio-data/server';

export default async function Home() {
  const data = await getPortfolioPageData();
  const publicEmail = data.about.find((item) => item.label === '이메일')?.value;

  return (
    <>
      <Hero
        heroData={data.site.hero}
        publicEmail={publicEmail}
      />
      <About
        data={data.about}
        aboutSummary={data.site.aboutSummary}
        profileImage={data.site.profileImage}
      />
      <Projects
        projectsData={data.projects}
        projectPortfolioSyncData={data.projectPortfolioSync}
        featuredIds={data.featuredProjects.ids}
      />
      <Career data={data.career} />
      <Skills categories={data.skills} />
      <AiWorkflow data={data.aiWorkflow} />
      <Archiving data={data.archiving} heatmap={data.activityHeatmap} />
    </>
  );
}
