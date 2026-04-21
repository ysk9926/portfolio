'use client';

import { SitePayload } from '@/lib/types/payload';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { ArrayField } from '../ui/ArrayField';
import { Field, TextArea, TextInput } from '../ui/Field';

interface SiteEditorProps {
  value: SitePayload;
  onChange: (next: SitePayload) => void;
}

export function SiteEditor({ value, onChange }: SiteEditorProps) {
  const patch = (partial: Partial<SitePayload>) => onChange({ ...value, ...partial });
  const patchConfig = (partial: Partial<SitePayload['config']>) =>
    patch({ config: { ...value.config, ...partial } });
  const patchHero = (partial: Partial<SitePayload['hero']>) =>
    patch({ hero: { ...value.hero, ...partial } });
  const patchFooter = (partial: Partial<SitePayload['footer']>) =>
    patch({ footer: { ...value.footer, ...partial } });

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="사이트 기본 정보" description="메타데이터 및 공유 정보" />
        <CardBody className="grid gap-4 md:grid-cols-2">
          <Field label="사이트명" required>
            <TextInput value={value.config.name} onChange={(v) => patchConfig({ name: v })} />
          </Field>
          <Field label="타이틀" required>
            <TextInput value={value.config.title} onChange={(v) => patchConfig({ title: v })} />
          </Field>
          <Field label="URL" required className="md:col-span-2">
            <TextInput type="url" value={value.config.url} onChange={(v) => patchConfig({ url: v })} />
          </Field>
          <Field label="OG 이미지 경로" required className="md:col-span-2">
            <TextInput value={value.config.ogImage} onChange={(v) => patchConfig({ ogImage: v })} />
          </Field>
          <Field label="설명" required className="md:col-span-2">
            <TextArea value={value.config.description} onChange={(v) => patchConfig({ description: v })} rows={3} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="내비게이션" description="헤더에 노출되는 메뉴 순서대로" />
        <CardBody>
          <ArrayField
            items={value.nav}
            onChange={(nav) => patch({ nav })}
            createEmpty={() => ({ label: '', href: '#' })}
            itemLabel={(item) => item.label || '(라벨 없음)'}
            addLabel="메뉴 추가"
            renderItem={(item, _index, update) => (
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="라벨" required>
                  <TextInput value={item.label} onChange={(v) => update({ label: v })} />
                </Field>
                <Field label="링크 (href)" required hint="#hero, #about 같은 앵커 또는 절대 URL">
                  <TextInput value={item.href} onChange={(v) => update({ href: v })} />
                </Field>
              </div>
            )}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="히어로 섹션" description="첫 화면 타이틀 영역" />
        <CardBody className="grid gap-4 md:grid-cols-2">
          <Field label="인사말" required>
            <TextInput value={value.hero.greeting} onChange={(v) => patchHero({ greeting: v })} />
          </Field>
          <Field label="이름" required>
            <TextInput value={value.hero.name} onChange={(v) => patchHero({ name: v })} />
          </Field>
          <Field label="역할" required>
            <TextInput value={value.hero.role} onChange={(v) => patchHero({ role: v })} />
          </Field>
          <Field label="CTA 문구" required>
            <TextInput value={value.hero.cta} onChange={(v) => patchHero({ cta: v })} />
          </Field>
          <Field label="태그라인" required className="md:col-span-2">
            <TextArea value={value.hero.tagline} onChange={(v) => patchHero({ tagline: v })} rows={2} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="About · Footer" />
        <CardBody className="grid gap-4 md:grid-cols-2">
          <Field label="프로필 이미지 경로" required className="md:col-span-2">
            <TextInput value={value.profileImage} onChange={(v) => patch({ profileImage: v })} />
          </Field>
          <Field label="About 요약" required className="md:col-span-2">
            <TextArea value={value.aboutSummary} onChange={(v) => patch({ aboutSummary: v })} rows={4} />
          </Field>
          <Field label="Footer · Copyright" required>
            <TextInput value={value.footer.copyright} onChange={(v) => patchFooter({ copyright: v })} />
          </Field>
          <Field label="Footer · Built with" required>
            <TextInput value={value.footer.builtWith} onChange={(v) => patchFooter({ builtWith: v })} />
          </Field>
        </CardBody>
      </Card>
    </div>
  );
}
