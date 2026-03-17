import { FOOTER_DATA } from '@/lib/constants';

export default function Footer() {
  return (
    <footer className="bg-neutral-950 text-neutral-400 py-8">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="mb-2">{FOOTER_DATA.copyright}</p>
        <p className="text-sm">{FOOTER_DATA.builtWith}</p>
      </div>
    </footer>
  );
}
