import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Skills from '@/components/sections/Skills';
import Archiving from '@/components/sections/Archiving';
import ActivityHeatmap from '@/components/sections/ActivityHeatmap';
import Projects from '@/components/sections/Projects';
import Career from '@/components/sections/Career';
import { getPortfolioPageData } from '@/lib/portfolio-data/server';

export default async function Home() {
  const data = await getPortfolioPageData();

  return (
    <>
      <Hero heroData={data.site.hero} />
      <About
        data={data.about}
        aboutSummary={data.site.aboutSummary}
        profileImage={data.site.profileImage}
      />
      <Skills categories={data.skills} />
      <Archiving data={data.archiving} />
      <ActivityHeatmap heatmap={data.activityHeatmap} />
      <Projects
        projectsData={data.projects}
        projectPortfolioSyncData={data.projectPortfolioSync}
      />
      <Career data={data.career} />
    </>
  );
}
