'use client';

import {
  BarChart3,
  Blocks,
  FileText,
  Sparkles,
  Terminal,
  Workflow,
  Wrench,
} from 'lucide-react';
import { AiWorkflowPayload } from '@/lib/types/payload';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { ArrayField, StringArrayField } from '../ui/ArrayField';
import { Field, Select, TextArea, TextInput } from '../ui/Field';

interface AiWorkflowEditorProps {
  value: AiWorkflowPayload;
  onChange: (next: AiWorkflowPayload) => void;
}

const TOOL_ACCENTS = ['claude', 'codex', 'product'] as const;
const SKILL_CLIENTS = ['공용', 'Claude', 'Codex'] as const;
const SKILL_ORIGINS = ['직접 제작', '팀 공용'] as const;
const COMMAND_KINDS = ['slash', 'hook', 'automation', 'script'] as const;

type Tool = AiWorkflowPayload['tools'][number];
type Stat = AiWorkflowPayload['stats'][number];
type WorkflowStep = AiWorkflowPayload['workflow'][number];
type SkillGroup = AiWorkflowPayload['skillGroups'][number];
type Command = AiWorkflowPayload['commands'][number];

const SECTIONS = [
  { key: 'intro', label: '소개', icon: FileText },
  { key: 'stats', label: '지표', icon: BarChart3 },
  { key: 'tools', label: '도구', icon: Wrench },
  { key: 'workflow', label: '워크플로', icon: Workflow },
  { key: 'skillGroups', label: '스킬 그룹', icon: Blocks },
  { key: 'commands', label: '커맨드', icon: Terminal },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

export default function AiWorkflowEditor({ value, onChange }: AiWorkflowEditorProps) {
  const patch = (next: Partial<AiWorkflowPayload>) => onChange({ ...value, ...next });

  return (
    <Card>
      <CardHeader
        title="AI 워크플로"
        description="섹션별로 나눠 편집합니다. 저장하면 전체 섹션이 교체됩니다."
      />
      <CardBody>
        <div className="space-y-8">
          <Section id="intro" title="소개">
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="eyebrow" hint="헤드라인 위 작은 문구" required>
                  <TextInput value={value.eyebrow} onChange={(v) => patch({ eyebrow: v })} />
                </Field>
                <Field label="headline" required>
                  <TextInput value={value.headline} onChange={(v) => patch({ headline: v })} />
                </Field>
              </div>
              <Field label="intro" required>
                <TextArea value={value.intro} onChange={(v) => patch({ intro: v })} rows={4} />
              </Field>
              <Field label="highlights" hint="핵심 요약 불릿">
                <StringArrayField
                  items={value.highlights}
                  onChange={(highlights) => patch({ highlights })}
                  placeholder="한 줄 요약"
                />
              </Field>
            </div>
          </Section>

          <Section id="stats" title="지표">
            <ArrayField<Stat>
              items={value.stats}
              onChange={(stats) => patch({ stats })}
              createEmpty={() => ({ label: '', value: '', note: '' })}
              itemLabel={(item, i) => item.label || `지표 #${i + 1}`}
              addLabel="지표 추가"
              renderItem={(item, _i, update) => (
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="label" required>
                    <TextInput value={item.label} onChange={(v) => update({ label: v })} />
                  </Field>
                  <Field label="value" required>
                    <TextInput value={item.value} onChange={(v) => update({ value: v })} />
                  </Field>
                  <Field label="note">
                    <TextInput value={item.note ?? ''} onChange={(v) => update({ note: v })} />
                  </Field>
                </div>
              )}
            />
          </Section>

          <Section id="tools" title="도구">
            <ArrayField<Tool>
              items={value.tools}
              onChange={(tools) => patch({ tools })}
              createEmpty={() => ({
                name: '',
                kind: '',
                model: '',
                summary: '',
                points: [],
                accent: 'claude',
              })}
              itemLabel={(item, i) => item.name || `도구 #${i + 1}`}
              addLabel="도구 추가"
              renderItem={(item, _i, update) => (
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="name" required>
                      <TextInput value={item.name} onChange={(v) => update({ name: v })} />
                    </Field>
                    <Field label="kind" required>
                      <TextInput value={item.kind} onChange={(v) => update({ kind: v })} />
                    </Field>
                    <Field label="model">
                      <TextInput value={item.model ?? ''} onChange={(v) => update({ model: v })} />
                    </Field>
                    <Field label="accent" required>
                      <Select
                        value={item.accent}
                        onChange={(accent) => update({ accent })}
                        options={TOOL_ACCENTS}
                      />
                    </Field>
                  </div>
                  <Field label="summary" required>
                    <TextArea value={item.summary} onChange={(v) => update({ summary: v })} rows={3} />
                  </Field>
                  <Field label="points">
                    <StringArrayField
                      items={item.points}
                      onChange={(points) => update({ points })}
                      placeholder="한 줄 설명"
                    />
                  </Field>
                </div>
              )}
            />
          </Section>

          <Section id="workflow" title="워크플로">
            <ArrayField<WorkflowStep>
              items={value.workflow}
              onChange={(workflow) => patch({ workflow })}
              createEmpty={() => ({ step: '', title: '', description: '', skills: [] })}
              itemLabel={(item, i) => item.title || `단계 #${i + 1}`}
              addLabel="단계 추가"
              renderItem={(item, _i, update) => (
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="step" hint="예: 01" required>
                      <TextInput value={item.step} onChange={(v) => update({ step: v })} />
                    </Field>
                    <Field label="title" required>
                      <TextInput value={item.title} onChange={(v) => update({ title: v })} />
                    </Field>
                  </div>
                  <Field label="description" required>
                    <TextArea
                      value={item.description}
                      onChange={(v) => update({ description: v })}
                      rows={3}
                    />
                  </Field>
                  <Field label="skills">
                    <StringArrayField
                      items={item.skills}
                      onChange={(skills) => update({ skills })}
                      placeholder="스킬명"
                    />
                  </Field>
                </div>
              )}
            />
          </Section>

          <Section id="skillGroups" title="스킬 그룹">
            <ArrayField<SkillGroup>
              items={value.skillGroups}
              onChange={(skillGroups) => patch({ skillGroups })}
              createEmpty={() => ({
                title: '',
                client: '공용',
                origin: '직접 제작',
                description: '',
                skills: [],
              })}
              itemLabel={(item, i) => item.title || `그룹 #${i + 1}`}
              addLabel="그룹 추가"
              renderItem={(item, _i, update) => (
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <Field label="title" required>
                      <TextInput value={item.title} onChange={(v) => update({ title: v })} />
                    </Field>
                    <Field label="client" required>
                      <Select
                        value={item.client}
                        onChange={(client) => update({ client })}
                        options={SKILL_CLIENTS}
                      />
                    </Field>
                    <Field label="origin" required>
                      <Select
                        value={item.origin}
                        onChange={(origin) => update({ origin })}
                        options={SKILL_ORIGINS}
                      />
                    </Field>
                  </div>
                  <Field label="description" required>
                    <TextArea
                      value={item.description}
                      onChange={(v) => update({ description: v })}
                      rows={2}
                    />
                  </Field>
                  <Field label="skills" hint="그룹에 속한 개별 스킬">
                    <ArrayField<SkillGroup['skills'][number]>
                      items={item.skills}
                      onChange={(skills) => update({ skills })}
                      createEmpty={() => ({ name: '', summary: '' })}
                      itemLabel={(skill, i) => skill.name || `스킬 #${i + 1}`}
                      addLabel="스킬 추가"
                      sortable={false}
                      renderItem={(skill, _si, updateSkill) => (
                        <div className="grid gap-3 md:grid-cols-2">
                          <Field label="name" required>
                            <TextInput
                              value={skill.name}
                              onChange={(v) => updateSkill({ name: v })}
                            />
                          </Field>
                          <Field label="summary" required>
                            <TextInput
                              value={skill.summary}
                              onChange={(v) => updateSkill({ summary: v })}
                            />
                          </Field>
                        </div>
                      )}
                    />
                  </Field>
                </div>
              )}
            />
          </Section>

          <Section id="commands" title="커맨드">
            <ArrayField<Command>
              items={value.commands}
              onChange={(commands) => patch({ commands })}
              createEmpty={() => ({ name: '', kind: 'slash', description: '' })}
              itemLabel={(item, i) => item.name || `커맨드 #${i + 1}`}
              addLabel="커맨드 추가"
              renderItem={(item, _i, update) => (
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="name" required>
                      <TextInput value={item.name} onChange={(v) => update({ name: v })} />
                    </Field>
                    <Field label="kind" required>
                      <Select
                        value={item.kind}
                        onChange={(kind) => update({ kind })}
                        options={COMMAND_KINDS}
                      />
                    </Field>
                  </div>
                  <Field label="description" required>
                    <TextArea
                      value={item.description}
                      onChange={(v) => update({ description: v })}
                      rows={2}
                    />
                  </Field>
                </div>
              )}
            />
          </Section>
        </div>
      </CardBody>
    </Card>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: SectionKey;
  title: string;
  children: React.ReactNode;
}) {
  const Icon = SECTIONS.find((section) => section.key === id)?.icon ?? Sparkles;

  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 border-b border-neutral-200 pb-2 text-sm font-semibold text-neutral-800">
        <Icon className="h-4 w-4 text-neutral-500" />
        {title}
      </h3>
      {children}
    </section>
  );
}
