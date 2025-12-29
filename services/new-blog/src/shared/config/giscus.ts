// Giscus 설정
// https://giscus.app/ 에서 설정을 확인하고 업데이트하세요

export const GISCUS_CONFIG = {
  // GitHub 저장소 정보
  repo: 'vallista/vallista-land', // username/repo-name 형식
  repoId: 'R_kgDOJqXqXQ', // GitHub 저장소 ID (giscus.app에서 확인)

  // Discussions 카테고리
  category: 'Announcements', // Discussions 카테고리 이름
  categoryId: 'DIC_kwDOJqXqXc4CbqXq', // 카테고리 ID (giscus.app에서 확인)

  // 매핑 설정
  mapping: 'pathname' as const, // pathname, url, title, og:title 중 선택

  // 기능 설정
  strict: '0', // 엄격 모드 (0: 비활성화, 1: 활성화)
  reactionsEnabled: '1', // 반응 버튼 (0: 비활성화, 1: 활성화)
  emitMetadata: '0', // 메타데이터 전송 (0: 비활성화, 1: 활성화)
  inputPosition: 'bottom' as const, // 입력 위치 (top, bottom)

  // 테마 및 언어
  theme: 'preferred_color_scheme' as const, // light, dark, preferred_color_scheme
  lang: 'ko', // 언어 코드

  // 로딩 설정
  loading: 'lazy' as const // lazy, eager
}

// 환경별 설정
export const getGiscusConfig = () => {
  // 개발 환경에서는 다른 설정을 사용할 수 있습니다
  if (process.env.NODE_ENV === 'development') {
    return {
      ...GISCUS_CONFIG
      // 개발 환경 특별 설정
    }
  }

  return GISCUS_CONFIG
}
