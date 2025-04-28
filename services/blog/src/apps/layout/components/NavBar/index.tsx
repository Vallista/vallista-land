import { Bottom } from './Bottom'
import { Top } from './Top'

import * as Styled from './index.style'

/**
 * 화면 좌측에 위치하는 1 Depth 네비게이션 바 영역
 *
 * @description {@link NavCategory}와 {@link NavFooter}를 기반으로 네비게이션 바 영역을 구성합니다.
 * @see {@link NavCategory}
 * @see {@link NavFooter}
 */
export const NavBar = () => {
  return (
    <Styled._Container>
      <Styled._Section>
        <Top />
        <Bottom />
      </Styled._Section>
    </Styled._Container>
  )
}
