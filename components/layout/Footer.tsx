import { FooterData } from '@/lib/types/view';

interface FooterProps {
  footerData: FooterData;
}

export default function Footer({ footerData }: FooterProps) {
  return (
    <footer className="bg-neutral-950 text-white py-10 text-center">
      <p className="mb-2">{footerData.copyright}</p>
      <p className="text-sm">{footerData.builtWith}</p>
    </footer>
  );
}
