# 프로젝트 이미지 저장소

프로젝트 썸네일·스크린샷은 AWS 프로필 `tmdrb`의 전용 S3 버킷을 사용한다.

- AWS 계정: `167217328107`
- 리전: `ap-northeast-2`
- 버킷: `portfolio-project-images-167217328107`
- 객체 경로: `images/projects/…`
- 공개 URL: `https://portfolio-project-images-167217328107.s3.ap-northeast-2.amazonaws.com/images/projects/…`

블로그 업로드는 기존 Supabase Storage `blog-images` 버킷을 사용한다. 프로필 사진은 기존 정적 파일을 사용한다.

## 이미지 추가·교체

1. 파일을 `public/images/projects/<프로젝트>/`에 추가한다. 교체 시에는 캐시 충돌을 피하도록 새 파일명을 권장한다.
2. `npm run images:sync -- --dry-run`으로 업로드 대상을 확인한다.
3. `npm run images:sync`를 실행한다. 로컬 AWS CLI의 `tmdrb` 프로필로 업로드하고 파일 크기·MD5를 비교한다.
4. 관리자 화면이나 동기화 데이터에 `/images/projects/<프로젝트>/<파일명>` 또는 위 S3 URL을 입력한다.

이미지를 먼저 업로드한 다음 경로를 저장한다. 스크립트는 원격 파일을 삭제하지 않는다. PNG/JPG/JPEG/WebP/GIF/AVIF/SVG의 소문자 확장자만 업로드한다. 로컬 파일은 작업 원본으로 유지한다.

기존 DB 및 JSON의 `/images/projects/…` 값은 `mergePortfolioProjects`에서 S3 URL로 변환하므로 DB 전체를 덮어쓸 필요가 없다. 기존 경로로 직접 접근하면 Next.js가 S3로 리다이렉트한다. Next Image에는 해당 버킷의 프로젝트 경로만 허용한다. 기존 외부 URL은 그대로 유지한다.

파일 업로드는 기존처럼 로컬 작업으로 수행하며, 관리자 화면은 이미지 경로 입력을 제공한다. 웹 서버에 AWS 자격 증명을 추가할 필요가 없다. 코드 변경은 사이트 배포 후 적용된다.

## 접근 설정

버킷 소유권은 `BucketOwnerEnforced`이며 공개 ACL은 차단한다. 버킷 정책은 `images/projects/*`에 HTTPS 공개 읽기만 허용한다. 익명 업로드·삭제·파일 목록 조회는 허용하지 않는다. 다른 버킷과 계정 전체의 공개 접근 설정은 변경하지 않는다.

참고: [AWS S3 버킷 정책](https://docs.aws.amazon.com/AmazonS3/latest/userguide/example-bucket-policies.html), [퍼블릭 액세스 차단](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html).
