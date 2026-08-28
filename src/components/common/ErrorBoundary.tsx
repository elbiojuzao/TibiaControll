import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Rede de segurança pro app inteiro (envolve <AppRouter /> em main.tsx) — sem isso, um
 * erro de render não previsto em QUALQUER componente derrubava a árvore inteira do React
 * pra tela branca, sem nenhuma mensagem (confirmado por auditoria em 2026-08-28: zero
 * Error Boundary no projeto até então). Class component porque componentDidCatch/
 * getDerivedStateFromError não têm equivalente em hooks. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary capturou um erro de render:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="estado-vazio" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <p className="texto-perigo" style={{ fontSize: '1rem' }}>⚠️ Algo deu errado.</p>
          <p>Tente recarregar a página. Se o problema continuar, avise quem cuida do app.</p>
          <button type="button" className="botao-primario" onClick={() => window.location.reload()}>
            Recarregar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
