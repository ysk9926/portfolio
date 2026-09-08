import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="ai-ink min-h-screen flex flex-col items-center justify-center text-white px-4">
      <h1 className="text-7xl md:text-9xl font-bold font-mono text-ai-accent">404</h1>
      <p className="text-xl md:text-2xl text-gray-300 mt-4">
        페이지를 찾을 수 없습니다
      </p>
      <p className="text-gray-500 mt-2">
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block bg-white text-ai-ink rounded-full px-8 py-3 font-semibold hover:bg-ai-accent-soft transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </section>
  );
}
