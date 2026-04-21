'use client';

import { CareerPayload } from '@/lib/types/payload';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { ArrayField, StringArrayField } from '../ui/ArrayField';
import { Field, TextArea, TextInput } from '../ui/Field';

interface CareerEditorProps {
  value: CareerPayload;
  onChange: (next: CareerPayload) => void;
}

export function CareerEditor({ value, onChange }: CareerEditorProps) {
  return (
    <Card>
      <CardHeader title="경력" description="재직한 회사와 주요 성과" />
      <CardBody>
        <ArrayField
          items={value}
          onChange={onChange}
          createEmpty={() => ({
            company: '',
            role: '',
            period: '',
            description: '',
            achievements: [],
          })}
          itemLabel={(item) => `${item.company || '(회사명 없음)'} · ${item.role}`}
          addLabel="경력 추가"
          renderItem={(item, _index, update) => (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="회사명" required>
                  <TextInput value={item.company} onChange={(v) => update({ company: v })} />
                </Field>
                <Field label="역할" required>
                  <TextInput value={item.role} onChange={(v) => update({ role: v })} />
                </Field>
                <Field label="기간" required className="md:col-span-2">
                  <TextInput
                    value={item.period}
                    onChange={(v) => update({ period: v })}
                    placeholder="2023.03 - 현재"
                  />
                </Field>
              </div>
              <Field label="설명" required>
                <TextArea value={item.description} onChange={(v) => update({ description: v })} rows={3} />
              </Field>
              <Field label="주요 성과">
                <StringArrayField
                  items={item.achievements}
                  onChange={(achievements) => update({ achievements })}
                  placeholder="한 줄 성과"
                />
              </Field>
            </div>
          )}
        />
      </CardBody>
    </Card>
  );
}
