'use client';

import { SkillsPayload } from '@/lib/types/payload';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { ArrayField } from '../ui/ArrayField';
import { Field, NumberInput, TextArea, TextInput } from '../ui/Field';

interface SkillsEditorProps {
  value: SkillsPayload;
  onChange: (next: SkillsPayload) => void;
}

type SkillsCategory = SkillsPayload[number];
type SkillItem = SkillsCategory['skills'][number];

export function SkillsEditor({ value, onChange }: SkillsEditorProps) {
  return (
    <Card>
      <CardHeader
        title="스킬"
        description="카테고리별로 기술 항목을 그룹화합니다. 레벨은 0-100 숫자."
      />
      <CardBody>
        <ArrayField<SkillsCategory>
          items={value}
          onChange={onChange}
          createEmpty={() => ({ category: '', color: '#111827', skills: [] })}
          itemLabel={(item) => item.category || '(카테고리 없음)'}
          addLabel="카테고리 추가"
          renderItem={(category, _index, updateCategory) => (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="카테고리명" required>
                  <TextInput
                    value={category.category}
                    onChange={(v) => updateCategory({ category: v })}
                  />
                </Field>
                <Field label="색상" hint="HEX 또는 Tailwind 클래스">
                  <TextInput
                    value={category.color}
                    onChange={(v) => updateCategory({ color: v })}
                  />
                </Field>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-neutral-700">스킬 목록</p>
                <ArrayField<SkillItem>
                  items={category.skills}
                  onChange={(skills) => updateCategory({ skills })}
                  createEmpty={() => ({ name: '', level: 80, detail: '' })}
                  itemLabel={(skill) => skill.name || '(이름 없음)'}
                  addLabel="스킬 추가"
                  renderItem={(skill, _i, updateSkill) => (
                    <div className="grid gap-3 md:grid-cols-4">
                      <Field label="이름" required className="md:col-span-2">
                        <TextInput
                          value={skill.name}
                          onChange={(v) => updateSkill({ name: v })}
                        />
                      </Field>
                      <Field label="숙련도" required hint="0-100">
                        <NumberInput
                          value={skill.level}
                          min={0}
                          max={100}
                          onChange={(v) => updateSkill({ level: v })}
                        />
                      </Field>
                      <Field label="상세 설명" className="md:col-span-4">
                        <TextArea
                          rows={2}
                          value={skill.detail ?? ''}
                          onChange={(v) => updateSkill({ detail: v })}
                        />
                      </Field>
                    </div>
                  )}
                />
              </div>
            </div>
          )}
        />
      </CardBody>
    </Card>
  );
}
