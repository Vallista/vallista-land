import * as Styled from './index.style'
import { Copyright } from './Copyright'
import { Contents } from './Contents'

/**
 * Footer 영역
 *
 * @description {@link rawData}를 기반으로 Footer 영역을 구성합니다.
 * @see {@link rawData}
 */
export const Footer = () => {
  return (
    <Styled._Wrap>
      <Contents />
      <Copyright />
    </Styled._Wrap>
  )
}
