'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white px-4">
      <h1 className="text-5xl md:text-7xl font-bold text-blue-400">오류 발생</h1>
      <p className="text-xl md:text-2xl text-gray-300 mt-4">
        문제가 발생했습니다
      </p>
      <p className="text-gray-500 mt-2">
        잠시 후 다시 시도해 주세요.
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-block bg-white text-gray-900 rounded-full px-8 py-3 font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
      >
        다시 시도
      </button>
    </section>
  );
}
