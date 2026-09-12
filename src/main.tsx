import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/base.css';
import './styles/boot.css';
import './styles/document.css';
import './styles/puzzle.css';
import './styles/case.css';
import './styles/reveal.css';
import './styles/detail.css';
import './styles/solved.css';
import './styles/contradiction.css';
import './styles/title.css';
import './styles/results.css';
const rootEl = document.getElementById('root');

if (!rootEl) {
  throw new Error('Root element missing from index.html');
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
