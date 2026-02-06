import { skillsData } from '../../data/skills';
import SectionWrapper from '../ui/SectionWrapper';
import Badge from '../ui/Badge';
import AnimateOnScroll from '../ui/AnimateOnScroll';

export default function Skills() {
  return (
    <SectionWrapper
      id="skills"
      title="Skills"
      className="bg-section-skills"
      contentVisibility
    >
      <div className="space-y-10">
        {skillsData.map((category, index) => (
          <AnimateOnScroll key={index}>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              {category.category}
            </h3>
            <div className="flex flex-wrap gap-3">
              {category.skills.map((skill, skillIndex) => (
                <Badge key={skillIndex} name={skill.name} />
              ))}
            </div>
          </AnimateOnScroll>
        ))}
      </div>
    </SectionWrapper>
  );
}
