import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = '윤승규 | ysk9926 풀스택 개발자 포트폴리오';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const profileBuffer = await readFile(
    join(process.cwd(), 'public/images/profile/profile.jpeg'),
  );

  const profileSrc = `data:image/jpeg;base64,${Buffer.from(profileBuffer).toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #111111 0%, #1a1a1a 50%, #0a0a0a 100%)',
          fontFamily: 'sans-serif',
          padding: '60px',
          gap: '60px',
        }}
      >
        {/* Profile image */}
        <div
          style={{
            display: 'flex',
            width: '220px',
            height: '220px',
            borderRadius: '110px',
            overflow: 'hidden',
            border: '4px solid #333',
            flexShrink: 0,
          }}
        >
          <img
            src={profileSrc}
            alt="윤승규 프로필"
            width={220}
            height={220}
            style={{ objectFit: 'cover' }}
          />
        </div>

        {/* Text content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div
            style={{
              fontSize: '64px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.2,
            }}
          >
            윤승규
          </div>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 600,
              color: '#737373',
            }}
          >
            @ysk9926
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 600,
              color: '#a3a3a3',
            }}
          >
            풀스택 개발자
          </div>
          <div
            style={{
              fontSize: '18px',
              color: '#737373',
              lineHeight: 1.6,
              marginTop: '4px',
              maxWidth: '500px',
            }}
          >
            10개월간 8개 프로덕션 시스템을 기획부터 배포까지 주도
          </div>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '12px',
            }}
          >
            {['React', 'Next.js', 'TypeScript', 'Flutter'].map((tech) => (
              <div
                key={tech}
                style={{
                  fontSize: '18px',
                  color: '#a3a3a3',
                  padding: '6px 18px',
                  borderRadius: '9999px',
                  border: '1px solid #404040',
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
    { ...size },
  );
}
