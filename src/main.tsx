import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouter } from './App';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  </StrictMode>,
);
