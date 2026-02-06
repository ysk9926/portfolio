export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white px-4"
    >
      <div className="text-center space-y-6">
        <p className="text-lg md:text-xl text-gray-300">안녕하세요 👋</p>
        <h1 className="text-5xl md:text-7xl font-bold">
          <span className="text-blue-400">
            홍길동
          </span>
          <span className="sr-only"> - 프론트엔드 개발자 포트폴리오</span>
        </h1>
        <p className="text-2xl md:text-3xl text-gray-200 font-semibold">
          프론트엔드 개발자
        </p>
        <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
          사용자 경험을 최우선으로 생각하며, 클린 코드와 성능 최적화에 집중합니다.
        </p>
        <div className="pt-8">
          <a
            href="#about"
            className="inline-block bg-white text-gray-900 rounded-full px-8 py-3 font-semibold hover:bg-gray-100 transition-colors"
          >
            더 알아보기
          </a>
        </div>
      </div>
      <div className="absolute bottom-10 animate-bounce-arrow">
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
