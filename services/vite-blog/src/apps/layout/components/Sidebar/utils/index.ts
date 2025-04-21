import { DEFINE_NAVBAR_WIDTH } from '../../NavBar/utils'
import { ScrollStateType } from '../types'

export const DEFINE_SIDEBAR_LEFT_POSITION = DEFINE_NAVBAR_WIDTH
/** 사이드바 헤더의 높이 */
export const DEFINE_SIDEBAR_HEADER_HEIGHT = 43
/** 사이드바 검색창의 높이 */
export const DEFINE_SIDEBAR_SEARCH_HEIGHT = 38
/** 사이드바 헤더와 검색창의 높이 합 */
export const DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT =
  DEFINE_SIDEBAR_HEADER_HEIGHT + DEFINE_SIDEBAR_SEARCH_HEIGHT

/** 사이드바의 넓이 */
export const DEFINE_SIDEBAR_WIDTH = 240

export const DEFAULLT_SCROLL_STATE: ScrollStateType = 'HIDE'
