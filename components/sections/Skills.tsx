import skillsData from '../../data/skills.json';
import SectionWrapper from '../ui/SectionWrapper';
import SkillBar from '../ui/SkillBar';
import AnimateOnScroll from '../ui/AnimateOnScroll';
import { SkillCategory } from '../../lib/types';

export default function Skills() {
  const categories = skillsData as SkillCategory[];

  return (
    <SectionWrapper
      id="skills"
      title="Skills"
      className="bg-section-skills"
      contentVisibility
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {categories.map((category, index) => (
          <AnimateOnScroll key={index}>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
              {category.category}
            </h3>
            <div>
              {category.skills.map((skill, skillIndex) => (
                <SkillBar
                  key={skillIndex}
                  name={skill.name}
                  level={skill.level}
                  color={category.color}
                  index={skillIndex}
                  detail={skill.detail}
                />
              ))}
            </div>
          </AnimateOnScroll>
        ))}
      </div>
    </SectionWrapper>
  );
}
