'use client';

import { AboutPayload } from '@/lib/types/payload';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { ArrayField } from '../ui/ArrayField';
import { Field, TextInput } from '../ui/Field';

interface AboutEditorProps {
  value: AboutPayload;
  onChange: (next: AboutPayload) => void;
}

export function AboutEditor({ value, onChange }: AboutEditorProps) {
  return (
    <Card>
      <CardHeader
        title="About 정보"
        description="이력서 상단에 노출되는 key-value 형태의 기본 정보"
      />
      <CardBody>
        <ArrayField
          items={value}
          onChange={onChange}
          createEmpty={() => ({ icon: '', label: '', value: '' })}
          itemLabel={(item) => item.label || '(라벨 없음)'}
          addLabel="정보 추가"
          renderItem={(item, _index, update) => (
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="아이콘" hint="lucide-react 아이콘 이름">
                <TextInput value={item.icon} onChange={(v) => update({ icon: v })} />
              </Field>
              <Field label="라벨" required>
                <TextInput value={item.label} onChange={(v) => update({ label: v })} />
              </Field>
              <Field label="값" required>
                <TextInput value={item.value} onChange={(v) => update({ value: v })} />
              </Field>
            </div>
          )}
        />
      </CardBody>
    </Card>
  );
}
