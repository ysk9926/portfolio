'use client';

import { FileText, Tag } from 'lucide-react';
import { AboutPayload } from '@/lib/types/payload';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { EntityListEditor, type EntityEditorTab } from '../ui/EntityListEditor';
import { Field, TextInput } from '../ui/Field';

interface AboutEditorProps {
  value: AboutPayload;
  onChange: (next: AboutPayload) => void;
}

type AboutItem = AboutPayload[number];

const tabs: EntityEditorTab<AboutItem>[] = [
  {
    key: 'overview',
    label: '기본 정보',
    icon: <FileText />,
    render: (item, update) => (
      <div className="space-y-3">
        <Field label="라벨" required>
          <TextInput value={item.label} onChange={(v) => update({ label: v })} />
        </Field>
        <Field label="값" required>
          <TextInput value={item.value} onChange={(v) => update({ value: v })} />
        </Field>
        <Field label="아이콘" hint="lucide-react 아이콘 이름">
          <TextInput value={item.icon} onChange={(v) => update({ icon: v })} />
        </Field>
      </div>
    ),
  },
];

export function AboutEditor({ value, onChange }: AboutEditorProps) {
  return (
    <Card>
      <CardHeader
        title="About 정보"
        description="이력서 상단에 노출되는 key-value 형태의 기본 정보"
      />
      <CardBody>
        <EntityListEditor<AboutItem>
          items={value}
          onChange={onChange}
          createEmpty={() => ({ icon: '', label: '', value: '' })}
          itemTitle={(item) => item.label}
          itemSubtitle={(item) => item.value || undefined}
          itemEyebrow={() => 'About'}
          addLabel="정보 추가"
          emptyLabel="정보가 없습니다. 추가 버튼을 눌러 시작하세요."
          factGroups={(item) => [
            {
              label: '기본 정보',
              facts: [{ icon: <Tag />, label: '아이콘', value: item.icon || '—' }],
            },
          ]}
          tabs={tabs}
        />
      </CardBody>
    </Card>
  );
}
