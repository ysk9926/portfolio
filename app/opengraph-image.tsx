import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '홍길동 | 프론트엔드 개발자 포트폴리오';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div
            style={{
              fontSize: '72px',
              fontWeight: 800,
              color: '#60a5fa',
              lineHeight: 1.2,
            }}
          >
            홍길동
          </div>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 600,
              color: '#e2e8f0',
            }}
          >
            프론트엔드 개발자
          </div>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '16px',
            }}
          >
            {['React', 'Next.js', 'TypeScript'].map((tech) => (
              <div
                key={tech}
                style={{
                  fontSize: '20px',
                  color: '#94a3b8',
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  border: '1px solid #334155',
                  background: 'rgba(255,255,255,0.05)',
                }}
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
