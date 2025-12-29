import { DEFINE_SIDEBAR_WIDTH } from './components/Sidebar/utils'
import { DEFINE_NAVBAR_WIDTH } from './components/NavBar/utils'
import { COLOR_TOKENS } from '@vallista/design-system'

export const wrapper = 'layout-wrapper'
export const main = 'layout-main'
export const mainFolded = 'layout-main-folded'
export const article = 'layout-article'

// CSS 스타일을 동적으로 생성
const styles = `
.${wrapper} {
  min-height: 100vh;
}

.${main} {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: calc(100vw - ${DEFINE_NAVBAR_WIDTH + DEFINE_SIDEBAR_WIDTH}px);
  height: 100vh;
  margin-left: ${DEFINE_NAVBAR_WIDTH + DEFINE_SIDEBAR_WIDTH}px;
}

.${mainFolded} {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: calc(100vw - ${DEFINE_NAVBAR_WIDTH}px);
  height: 100vh;
  margin-left: ${DEFINE_NAVBAR_WIDTH}px;
}

.${article} {
  box-sizing: border-box;
  margin: 0 auto;
}

.${article} a {
  cursor: pointer;
  border-bottom: 2px solid ${COLOR_TOKENS.HIGHLIGHT.RED};
  font-weight: 600;
  text-decoration: none;
  color: ${COLOR_TOKENS.PRIMARY.BLACK};
  transition: all 0.1s ease-out;
}

@media screen and (max-width: 1024px) {
  .${main}, .${mainFolded} {
    margin-left: 0;
    width: 100vw;
    height: auto;
  }
  
  .${article} {
    width: 100vw;
  }
}

@media screen and (min-width: 1025px) {
  .${main}, .${mainFolded} {
    overflow-y: scroll;
    -webkit-overflow-scrolling: touch;
  }
}
`

// 스타일을 DOM에 주입
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = styles
  document.head.appendChild(styleElement)
}
