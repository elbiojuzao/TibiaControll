import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouter } from './App';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './styles/global.css';

// Rolar o mouse sobre um campo numérico focado mudava o valor sem querer (gerou erro
// de valor trocado 2x em uma semana, pedido do usuário 2026-09-12) — tira o foco assim
// que o scroll começa, então o resto da rolagem só move a página normalmente.
document.addEventListener('wheel', () => {
  const el = document.activeElement;
  if (el instanceof HTMLInputElement && el.type === 'number') el.blur();
}, { passive: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  </StrictMode>,
);
