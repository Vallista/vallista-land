import styled from '@emotion/styled'

export const Loading = (articleHeight: number, seriesHeight: number) => styled.div`
  height: calc(100vh - ${articleHeight + seriesHeight}px);
`
