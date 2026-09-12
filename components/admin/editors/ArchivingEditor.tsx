'use client';

import { FileText, Link2, ListChecks } from 'lucide-react';
import { ArchivingPayload } from '@/lib/types/payload';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { StringArrayField } from '../ui/ArrayField';
import { EntityListEditor, type EntityEditorTab } from '../ui/EntityListEditor';
import { Field, TextArea, TextInput } from '../ui/Field';

interface ArchivingEditorProps {
  value: ArchivingPayload;
  onChange: (next: ArchivingPayload) => void;
}

type ArchivingItem = ArchivingPayload[number];

const tabs: EntityEditorTab<ArchivingItem>[] = [
  {
    key: 'overview',
    label: '기본 정보',
    icon: <FileText />,
    render: (item, update) => (
      <div className="space-y-3">
        <Field label="제목" required>
          <TextInput value={item.title} onChange={(v) => update({ title: v })} />
        </Field>
        <Field label="URL" required>
          <TextInput type="url" value={item.url} onChange={(v) => update({ url: v })} />
        </Field>
        <Field label="설명" required>
          <TextArea value={item.description} onChange={(v) => update({ description: v })} rows={4} />
        </Field>
      </div>
    ),
  },
  {
    key: 'details',
    label: '상세 bullet',
    icon: <ListChecks />,
    render: (item, update) => (
      <Field label="상세 bullet">
        <StringArrayField
          items={item.details}
          onChange={(details) => update({ details })}
          placeholder="한 줄 요약"
        />
      </Field>
    ),
  },
];

export function ArchivingEditor({ value, onChange }: ArchivingEditorProps) {
  return (
    <Card>
      <CardHeader title="아카이빙" description="블로그, 발표자료 등 외부 콘텐츠 링크" />
      <CardBody>
        <EntityListEditor<ArchivingItem>
          items={value}
          onChange={onChange}
          createEmpty={() => ({ title: '', description: '', url: '', details: [] })}
          itemTitle={(item) => item.title}
          itemSubtitle={(item) => item.url || undefined}
          itemEyebrow={() => '아카이빙'}
          addLabel="아카이빙 추가"
          emptyLabel="아카이빙 항목이 없습니다. 추가 버튼을 눌러 시작하세요."
          factGroups={(item) => [
            {
              label: '기본 정보',
              facts: [
                { icon: <Link2 />, label: 'URL', value: item.url || '—' },
                { icon: <ListChecks />, label: '상세', value: `${item.details.length}개` },
              ],
            },
          ]}
          stats={(item) => [
            {
              icon: <ListChecks />,
              label: '상세 bullet',
              value: `${item.details.length}개`,
              note: item.details[0],
            },
          ]}
          tabs={tabs}
        />
      </CardBody>
    </Card>
  );
}
