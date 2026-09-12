'use client';

import { Building2, CalendarDays, FileText, TrendingUp, UserRound } from 'lucide-react';
import { CareerPayload } from '@/lib/types/payload';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { StringArrayField } from '../ui/ArrayField';
import { EntityListEditor, type EntityEditorTab } from '../ui/EntityListEditor';
import { Field, TextArea, TextInput } from '../ui/Field';

interface CareerEditorProps {
  value: CareerPayload;
  onChange: (next: CareerPayload) => void;
}

type CareerItem = CareerPayload[number];

const tabs: EntityEditorTab<CareerItem>[] = [
  {
    key: 'overview',
    label: '기본 정보',
    icon: <FileText />,
    render: (item, update) => (
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="회사명" required>
            <TextInput value={item.company} onChange={(v) => update({ company: v })} />
          </Field>
          <Field label="역할" required>
            <TextInput value={item.role} onChange={(v) => update({ role: v })} />
          </Field>
        </div>
        <Field label="기간" required>
          <TextInput
            value={item.period}
            onChange={(v) => update({ period: v })}
            placeholder="2023.03 - 현재"
          />
        </Field>
        <Field label="설명" required>
          <TextArea value={item.description} onChange={(v) => update({ description: v })} rows={5} />
        </Field>
      </div>
    ),
  },
  {
    key: 'achievements',
    label: '주요 성과',
    icon: <TrendingUp />,
    render: (item, update) => (
      <Field label="주요 성과">
        <StringArrayField
          items={item.achievements}
          onChange={(achievements) => update({ achievements })}
          placeholder="한 줄 성과"
        />
      </Field>
    ),
  },
];

export function CareerEditor({ value, onChange }: CareerEditorProps) {
  return (
    <Card>
      <CardHeader title="경력" description="재직한 회사와 주요 성과" />
      <CardBody>
        <EntityListEditor<CareerItem>
          items={value}
          onChange={onChange}
          createEmpty={() => ({
            company: '',
            role: '',
            period: '',
            description: '',
            achievements: [],
          })}
          itemTitle={(item) => item.company}
          itemSubtitle={(item) => [item.role, item.period].filter(Boolean).join(' · ') || undefined}
          itemEyebrow={() => '경력'}
          addLabel="경력 추가"
          emptyLabel="경력이 없습니다. 추가 버튼을 눌러 시작하세요."
          factGroups={(item) => [
            {
              label: '기본 정보',
              facts: [
                { icon: <Building2 />, label: '회사', value: item.company || '—' },
                { icon: <UserRound />, label: '역할', value: item.role || '—' },
                { icon: <CalendarDays />, label: '기간', value: item.period || '—' },
              ],
            },
          ]}
          stats={(item) => [
            {
              icon: <TrendingUp />,
              label: '주요 성과',
              value: `${item.achievements.length}개`,
              note: item.achievements[0],
            },
          ]}
          tabs={tabs}
        />
      </CardBody>
    </Card>
  );
}
