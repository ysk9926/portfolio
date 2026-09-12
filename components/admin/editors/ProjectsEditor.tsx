'use client';

import {
  CalendarDays,
  Images,
  Layers,
  ListChecks,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { ProjectsPayload } from '@/lib/types/payload';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { StringArrayField } from '../ui/ArrayField';
import { EntityListEditor, type EntityEditorTab } from '../ui/EntityListEditor';
import { Field, NumberInput, TextArea, TextInput } from '../ui/Field';

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

/** Patch a nested STAR block, materialising it on first edit. */
function patchStar(item: ProjectItem, patch: Partial<ProjectStar>): Partial<ProjectItem> {
  return { star: { ...(item.star ?? emptyStar), ...patch } };
}

const tabs: EntityEditorTab<ProjectItem>[] = [
  {
    key: 'overview',
    label: '개요',
    icon: <Images />,
    render: (item, update) => (
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="ID" required hint="고유 숫자 ID">
            <NumberInput value={item.id} onChange={(v) => update({ id: v })} />
          </Field>
          <Field label="타이틀" required className="md:col-span-2">
            <TextInput value={item.title} onChange={(v) => update({ title: v })} />
          </Field>
        </div>

        <Field label="기간" required>
          <TextInput
            value={item.period}
            onChange={(v) => update({ period: v })}
            placeholder="2024.01 - 2024.06"
          />
        </Field>

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
            <TextInput type="url" value={item.deployUrl ?? ''} onChange={(v) => update({ deployUrl: v })} />
          </Field>
          <Field label="GitHub URL">
            <TextInput type="url" value={item.githubUrl ?? ''} onChange={(v) => update({ githubUrl: v })} />
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
      </div>
    ),
  },
  {
    key: 'star',
    label: '배경·STAR',
    icon: <Sparkles />,
    render: (item, update) => (
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="요약">
            <TextArea
              value={item.star?.summary ?? ''}
              onChange={(v) => update(patchStar(item, { summary: v }))}
              rows={2}
            />
          </Field>
          <Field label="역할">
            <TextArea
              value={item.star?.role ?? ''}
              onChange={(v) => update(patchStar(item, { role: v }))}
              rows={2}
            />
          </Field>
        </div>
        <Field label="배경">
          <TextArea
            value={item.star?.background ?? ''}
            onChange={(v) => update(patchStar(item, { background: v }))}
            rows={4}
          />
        </Field>
        <Field label="해결 방법">
          <TextArea
            value={item.star?.solutions ?? ''}
            onChange={(v) => update(patchStar(item, { solutions: v }))}
            rows={4}
          />
        </Field>
        <Field label="결과">
          <TextArea
            value={item.star?.results ?? ''}
            onChange={(v) => update(patchStar(item, { results: v }))}
            rows={4}
          />
        </Field>
      </div>
    ),
  },
  {
    key: 'features',
    label: '주요 기능',
    icon: <ListChecks />,
    render: (item, update) => (
      <div className="space-y-3">
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
      </div>
    ),
  },
  {
    key: 'troubleshooting',
    label: '트러블슈팅',
    icon: <Wrench />,
    render: (item, update) => (
      <Field label="트러블슈팅" hint="선택 항목">
        <TextArea
          value={item.star?.troubleshooting ?? ''}
          onChange={(v) => update(patchStar(item, { troubleshooting: v }))}
          rows={10}
        />
      </Field>
    ),
  },
];

export function ProjectsEditor({ value, onChange }: ProjectsEditorProps) {
  const nextId = () => value.reduce((max, p) => Math.max(max, p.id), 0) + 1;

  return (
    <Card>
      <CardHeader title="프로젝트" description="포트폴리오에 노출되는 프로젝트 상세" />
      <CardBody>
        <EntityListEditor<ProjectItem>
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
            thumbnail: '',
            screenshots: [],
            shortDescription: '',
          })}
          itemBadge={(item) => `#${item.id}`}
          itemTitle={(item) => item.title}
          itemSubtitle={(item) => item.period || undefined}
          itemEyebrow={() => '프로젝트'}
          addLabel="프로젝트 추가"
          emptyLabel="프로젝트가 없습니다. 추가 버튼을 눌러 시작하세요."
          factGroups={(item) => [
            {
              label: '기본 정보',
              facts: [
                { icon: <CalendarDays />, label: '기간', value: item.period || '—' },
                { icon: <Layers />, label: '기술', value: `${item.techStack.length}개` },
              ],
            },
          ]}
          stats={(item) => [
            {
              icon: <ListChecks />,
              label: '주요 기능',
              value: `${item.features.length}개`,
              note: item.features[0],
            },
            {
              icon: <Layers />,
              label: '기술 스택',
              value: `${item.techStack.length}개`,
              note: item.techStack.slice(0, 3).join(' · '),
            },
            {
              icon: <Images />,
              label: '스크린샷',
              value: `${item.screenshots.length}장`,
              note: item.thumbnail || undefined,
            },
          ]}
          rail={(item) =>
            item.techStack.length > 0 ? (
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[.07em] text-neutral-500">
                  기술 스택
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {item.techStack.map((tech, i) => (
                    <span
                      key={`${tech}-${i}`}
                      className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[11px] text-neutral-600"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ) : null
          }
          tabs={tabs}
        />
      </CardBody>
    </Card>
  );
}
