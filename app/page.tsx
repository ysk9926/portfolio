import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Skills from '@/components/sections/Skills';
import Archiving from '@/components/sections/Archiving';
import ActivityHeatmap from '@/components/sections/ActivityHeatmap';
import Projects from '@/components/sections/Projects';
import Career from '@/components/sections/Career';

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Skills />
      <Archiving />
      <ActivityHeatmap />
      <Projects />
      <Career />
    </>
  );
}
