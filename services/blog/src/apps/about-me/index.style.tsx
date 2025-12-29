export const header = 'about-me-header'
export const wrapper = 'about-me-wrapper'
export const title = 'about-me-title'
export const subTitle = 'about-me-subtitle'

// CSS 스타일을 동적으로 생성
const styles = `
.${header} {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 0 24px;
  box-sizing: border-box;
}

.${wrapper} {
  max-width: 800px;
  width: 100%;
}

.${title} {
  margin-bottom: 32px;
}

.${subTitle} {
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  box-sizing: border-box;
}

.text-span {
  font-size: 48px;
  font-weight: 800;
  line-height: 1.2;
  display: block;
  margin-bottom: 8px;
}

.text-h1 {
  font-size: 48px;
  font-weight: 800;
  line-height: 56px;
  margin: 0;
}

.text-highlight {
  color: #ff4757;
}

.text-p {
  font-size: 20px;
  font-weight: 400;
  line-height: 32px;
  margin: 0;
}

.text-bold {
  font-weight: 700;
  font-size: 20px;
}

@media screen and (max-width: 1024px) {
  .${header} {
    padding: 0 16px;
  }
  
  .container {
    padding: 0 16px;
  }
  
  .text-span,
  .text-h1 {
    font-size: 32px;
    line-height: 40px;
  }
  
  .text-p,
  .text-bold {
    font-size: 16px;
    line-height: 24px;
  }
}
`

// 스타일을 DOM에 주입
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = styles
  document.head.appendChild(styleElement)
}
