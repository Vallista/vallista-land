import { useQuery, UseQueryOptions } from '@tanstack/react-query'

interface UsePageQueryOptions<T> extends Omit<UseQueryOptions<T>, 'staleTime' | 'enabled' | 'queryKey' | 'queryFn'> {
  staleTime?: number
  enabled?: boolean
}

/**
 * 페이지별 쿼리를 위한 공통 훅
 * 기본 staleTime과 에러 처리를 포함합니다.
 */
export function usePageQuery<T>(
  queryKey: (string | number | boolean | null | undefined)[],
  queryFn: () => Promise<T>,
  options: UsePageQueryOptions<T> = {}
) {
  const { staleTime = 1000 * 60 * 5, enabled = true, ...restOptions } = options // 기본 5분

  return useQuery<T>({
    queryKey,
    queryFn,
    staleTime,
    enabled,
    ...restOptions
  })
}

/**
 * 콘텐츠 페이지를 위한 특화된 훅
 * 로딩, 에러, 빈 상태를 쉽게 처리할 수 있습니다.
 */
export function useContentPageQuery<T>(
  queryKey: (string | number | boolean | null | undefined)[],
  queryFn: () => Promise<T>,
  options: UsePageQueryOptions<T> = {}
) {
  const query = usePageQuery<T>(queryKey, queryFn, options)

  return {
    ...query,
    isEmpty:
      !query.isLoading && !query.error && (!query.data || (Array.isArray(query.data) && query.data.length === 0)),
    hasContent:
      !query.isLoading && !query.error && query.data && (Array.isArray(query.data) ? query.data.length > 0 : true)
  }
}
