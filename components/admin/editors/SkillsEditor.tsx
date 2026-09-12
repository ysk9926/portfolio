'use client';

import { Layers, Palette, Wrench } from 'lucide-react';
import { SkillsPayload } from '@/lib/types/payload';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { ArrayField } from '../ui/ArrayField';
import { EntityListEditor, type EntityEditorTab } from '../ui/EntityListEditor';
import { Field, NumberInput, TextArea, TextInput } from '../ui/Field';

interface SkillsEditorProps {
  value: SkillsPayload;
  onChange: (next: SkillsPayload) => void;
}

type SkillsCategory = SkillsPayload[number];
type SkillItem = SkillsCategory['skills'][number];

const tabs: EntityEditorTab<SkillsCategory>[] = [
  {
    key: 'overview',
    label: '카테고리',
    icon: <Palette />,
    render: (category, update) => (
      <div className="space-y-3">
        <Field label="카테고리명" required>
          <TextInput value={category.category} onChange={(v) => update({ category: v })} />
        </Field>
        <Field label="색상" hint="HEX 또는 Tailwind 클래스">
          <TextInput value={category.color} onChange={(v) => update({ color: v })} />
        </Field>
      </div>
    ),
  },
  {
    key: 'skills',
    label: '스킬 목록',
    icon: <Wrench />,
    render: (category, update) => (
      <ArrayField<SkillItem>
        items={category.skills}
        onChange={(skills) => update({ skills })}
        createEmpty={() => ({ name: '', level: 80, detail: '' })}
        itemLabel={(skill) => skill.name || '(이름 없음)'}
        addLabel="스킬 추가"
        renderItem={(skill, _i, updateSkill) => (
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="이름" required className="md:col-span-2">
              <TextInput value={skill.name} onChange={(v) => updateSkill({ name: v })} />
            </Field>
            <Field label="숙련도" required hint="0-100">
              <NumberInput
                value={skill.level}
                min={0}
                max={100}
                onChange={(v) => updateSkill({ level: v })}
              />
            </Field>
            <Field label="상세 설명" className="md:col-span-3">
              <TextArea
                rows={2}
                value={skill.detail ?? ''}
                onChange={(v) => updateSkill({ detail: v })}
              />
            </Field>
          </div>
        )}
      />
    ),
  },
];

export function SkillsEditor({ value, onChange }: SkillsEditorProps) {
  return (
    <Card>
      <CardHeader
        title="스킬"
        description="카테고리별로 기술 항목을 그룹화합니다. 레벨은 0-100 숫자."
      />
      <CardBody>
        <EntityListEditor<SkillsCategory>
          items={value}
          onChange={onChange}
          createEmpty={() => ({ category: '', color: '#111827', skills: [] })}
          itemTitle={(item) => item.category}
          itemSubtitle={(item) =>
            item.skills.length > 0
              ? `${item.skills.length}개 · ${item.skills.slice(0, 3).map((s) => s.name).join(', ')}`
              : undefined
          }
          itemEyebrow={() => '스킬 카테고리'}
          addLabel="카테고리 추가"
          emptyLabel="카테고리가 없습니다. 추가 버튼을 눌러 시작하세요."
          factGroups={(item) => [
            {
              label: '기본 정보',
              facts: [
                { icon: <Palette />, label: '색상', value: item.color || '—' },
                { icon: <Layers />, label: '스킬 수', value: `${item.skills.length}개` },
              ],
            },
          ]}
          stats={(item) => [
            {
              icon: <Wrench />,
              label: '스킬',
              value: `${item.skills.length}개`,
              note: item.skills.slice(0, 3).map((s) => s.name).join(' · '),
            },
          ]}
          tabs={tabs}
        />
      </CardBody>
    </Card>
  );
}
