export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="mb-2">© {new Date().getFullYear()} 홍길동. All rights reserved.</p>
        <p className="text-sm">Built with Next.js & Tailwind CSS</p>
      </div>
    </footer>
  );
}
