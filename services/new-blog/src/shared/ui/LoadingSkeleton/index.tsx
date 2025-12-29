import {
  loadingAnimation,
  articleHeaderSkeleton,
  articleCardSkeleton,
  sidebarMenuSkeleton
} from './LoadingSkeleton.css'

// 아티클 헤더 스켈레톤
export const ArticleHeaderSkeleton = () => {
  return (
    <div className={articleHeaderSkeleton.wrap}>
      <div className={`${articleHeaderSkeleton.titleIcon} ${loadingAnimation}`} />
      <div className={`${articleHeaderSkeleton.title} ${loadingAnimation}`} />
      <div className={`${articleHeaderSkeleton.date} ${loadingAnimation}`} />
      <div className={articleHeaderSkeleton.tags}>
        <div className={`${articleHeaderSkeleton.tag} ${loadingAnimation}`} />
        <div className={`${articleHeaderSkeleton.tag} ${loadingAnimation}`} />
        <div className={`${articleHeaderSkeleton.tag} ${loadingAnimation}`} />
      </div>
    </div>
  )
}

// 아티클 카드 스켈레톤
export const ArticleCardSkeleton = () => {
  return (
    <div className={articleCardSkeleton.card}>
      <div className={`${articleCardSkeleton.image} ${loadingAnimation}`} />
      <div className={articleCardSkeleton.content}>
        <div className={`${articleCardSkeleton.meta} ${loadingAnimation}`} />
        <div className={`${articleCardSkeleton.title} ${loadingAnimation}`} />
        <div className={`${articleCardSkeleton.description} ${loadingAnimation}`} />
        <div className={articleCardSkeleton.tags}>
          <div className={`${articleCardSkeleton.tag} ${loadingAnimation}`} />
          <div className={`${articleCardSkeleton.tag} ${loadingAnimation}`} />
        </div>
      </div>
    </div>
  )
}

// 사이드바 메뉴 스켈레톤
export const SidebarMenuSkeleton = () => {
  return (
    <div className={sidebarMenuSkeleton.container}>
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className={`${sidebarMenuSkeleton.item} ${loadingAnimation}`} />
      ))}
    </div>
  )
}
