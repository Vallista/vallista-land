import styled from '@emotion/styled'

export const Loading = (articleHeight: number, seriesHeight: number) => styled.div`
  height: calc(100vh - ${articleHeight + seriesHeight}px);

  @media screen and (max-width: 1024px) {
    height: calc((var(--vh, 1vh) * 100) - ${articleHeight + seriesHeight}px);
  }
`
