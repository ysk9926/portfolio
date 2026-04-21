'use client';

import { ProjectsPayload } from '@/lib/types/payload';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { ArrayField, StringArrayField } from '../ui/ArrayField';
import { Checkbox, Field, NumberInput, TextArea, TextInput } from '../ui/Field';

interface ProjectsEditorProps {
  value: ProjectsPayload;
  onChange: (next: ProjectsPayload) => void;
}

type ProjectItem = ProjectsPayload[number];
type ProjectStar = NonNullable<ProjectItem['star']>;

const emptyStar: ProjectStar = {
  summary: '',
  role: '',
  background: '',
  solutions: '',
  results: '',
  troubleshooting: '',
};

export function ProjectsEditor({ value, onChange }: ProjectsEditorProps) {
  const nextId = () => (value.reduce((max, p) => Math.max(max, p.id), 0) ?? 0) + 1;

  return (
    <Card>
      <CardHeader title="프로젝트" description="포트폴리오에 노출되는 프로젝트 상세" />
      <CardBody>
        <ArrayField<ProjectItem>
          items={value}
          onChange={onChange}
          createEmpty={() => ({
            id: nextId(),
            title: '',
            period: '',
            description: '',
            features: [],
            techStack: [],
            deployUrl: '',
            githubUrl: '',
            isMain: false,
            thumbnail: '',
            screenshots: [],
            shortDescription: '',
          })}
          itemLabel={(item) => `#${item.id} · ${item.title || '(제목 없음)'}`}
          addLabel="프로젝트 추가"
          renderItem={(item, _index, update) => {
            const updateStar = (patch: Partial<ProjectStar>) => {
              const current = item.star ?? emptyStar;
              update({ star: { ...current, ...patch } });
            };

            return (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="ID" required hint="고유 숫자 ID">
                    <NumberInput value={item.id} onChange={(v) => update({ id: v })} />
                  </Field>
                  <Field label="타이틀" required className="md:col-span-2">
                    <TextInput value={item.title} onChange={(v) => update({ title: v })} />
                  </Field>
                  <Field label="기간" required className="md:col-span-2">
                    <TextInput value={item.period} onChange={(v) => update({ period: v })} />
                  </Field>
                  <Field label="메인 노출">
                    <Checkbox
                      checked={item.isMain}
                      onChange={(v) => update({ isMain: v })}
                      label="메인에 노출"
                    />
                  </Field>
                </div>

                <Field label="설명" required>
                  <TextArea value={item.description} onChange={(v) => update({ description: v })} rows={3} />
                </Field>
                <Field label="짧은 설명" hint="카드에 노출되는 1-2줄 요약">
                  <TextArea
                    value={item.shortDescription ?? ''}
                    onChange={(v) => update({ shortDescription: v })}
                    rows={2}
                  />
                </Field>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="배포 URL">
                    <TextInput
                      type="url"
                      value={item.deployUrl ?? ''}
                      onChange={(v) => update({ deployUrl: v })}
                    />
                  </Field>
                  <Field label="GitHub URL">
                    <TextInput
                      type="url"
                      value={item.githubUrl ?? ''}
                      onChange={(v) => update({ githubUrl: v })}
                    />
                  </Field>
                </div>

                <Field label="썸네일 경로" required>
                  <TextInput value={item.thumbnail} onChange={(v) => update({ thumbnail: v })} />
                </Field>

                <Field label="스크린샷 경로 목록">
                  <StringArrayField
                    items={item.screenshots}
                    onChange={(screenshots) => update({ screenshots })}
                    placeholder="/images/..."
                  />
                </Field>

                <Field label="주요 기능">
                  <StringArrayField
                    items={item.features}
                    onChange={(features) => update({ features })}
                    placeholder="기능 한 줄"
                  />
                </Field>

                <Field label="기술 스택">
                  <StringArrayField
                    items={item.techStack}
                    onChange={(techStack) => update({ techStack })}
                    placeholder="React, Next.js ..."
                  />
                </Field>

                <div className="rounded-lg border border-neutral-200 bg-white p-3">
                  <p className="mb-2 text-xs font-semibold text-neutral-700">STAR 상세 (선택)</p>
                  <div className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="요약">
                        <TextArea
                          value={item.star?.summary ?? ''}
                          onChange={(v) => updateStar({ summary: v })}
                          rows={2}
                        />
                      </Field>
                      <Field label="역할">
                        <TextArea
                          value={item.star?.role ?? ''}
                          onChange={(v) => updateStar({ role: v })}
                          rows={2}
                        />
                      </Field>
                    </div>
                    <Field label="배경">
                      <TextArea
                        value={item.star?.background ?? ''}
                        onChange={(v) => updateStar({ background: v })}
                        rows={3}
                      />
                    </Field>
                    <Field label="해결 방법">
                      <TextArea
                        value={item.star?.solutions ?? ''}
                        onChange={(v) => updateStar({ solutions: v })}
                        rows={3}
                      />
                    </Field>
                    <Field label="결과">
                      <TextArea
                        value={item.star?.results ?? ''}
                        onChange={(v) => updateStar({ results: v })}
                        rows={3}
                      />
                    </Field>
                    <Field label="트러블슈팅">
                      <TextArea
                        value={item.star?.troubleshooting ?? ''}
                        onChange={(v) => updateStar({ troubleshooting: v })}
                        rows={3}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            );
          }}
        />
      </CardBody>
    </Card>
  );
}
