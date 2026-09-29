import './styles/tokens.css';
import './styles/global.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { applyInitialTweaks } from './components/Tweaks';

applyInitialTweaks();

// WKWebView 네이티브 컨텍스트 메뉴 전역 차단
document.addEventListener('contextmenu', (e) => e.preventDefault());

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('root element not found');
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
