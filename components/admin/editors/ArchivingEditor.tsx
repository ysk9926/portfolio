'use client';

import { ArchivingPayload } from '@/lib/types/payload';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { ArrayField, StringArrayField } from '../ui/ArrayField';
import { Field, TextArea, TextInput } from '../ui/Field';

interface ArchivingEditorProps {
  value: ArchivingPayload;
  onChange: (next: ArchivingPayload) => void;
}

export function ArchivingEditor({ value, onChange }: ArchivingEditorProps) {
  return (
    <Card>
      <CardHeader title="아카이빙" description="블로그, 발표자료 등 외부 콘텐츠 링크" />
      <CardBody>
        <ArrayField
          items={value}
          onChange={onChange}
          createEmpty={() => ({ title: '', description: '', url: '', details: [] })}
          itemLabel={(item) => item.title || '(제목 없음)'}
          addLabel="아카이빙 추가"
          renderItem={(item, _index, update) => (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="제목" required>
                  <TextInput value={item.title} onChange={(v) => update({ title: v })} />
                </Field>
                <Field label="URL" required>
                  <TextInput type="url" value={item.url} onChange={(v) => update({ url: v })} />
                </Field>
              </div>
              <Field label="설명" required>
                <TextArea value={item.description} onChange={(v) => update({ description: v })} rows={2} />
              </Field>
              <Field label="상세 bullet">
                <StringArrayField
                  items={item.details}
                  onChange={(details) => update({ details })}
                  placeholder="한 줄 요약"
                />
              </Field>
            </div>
          )}
        />
      </CardBody>
    </Card>
  );
}
