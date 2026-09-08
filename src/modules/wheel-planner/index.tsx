import { App as TibiaWheelApp } from './tibia-wheel-reference/src/App';
import { contextToBinary } from './tibia-wheel-reference/src/utils';
import './tibia-wheel-reference/src/section-colors.css';

/** Roda de Destino — por pedido explícito do usuário (2026-09-04), esta página é o código
 * do projeto de referência tibia-wheel (gitlab.com/klhio/tibia-wheel, LGPL v3) copiado SEM
 * alterações de lógica/JSX dentro de `tibia-wheel-reference/`. Qualquer mudança futura de
 * comportamento/visual acontece lá dentro, não aqui.
 *
 * Este arquivo é só o encaixe no nosso router — e 1 ajuste que depende de contexto de
 * onde a página é aberta, não de lógica interna do wheel:
 *
 * 1) Nível padrão: o `RootContextProvider` deles calcula `pointsMax = level - 50` a partir
 *    de um campo "level" (pensado pra colar o nível REAL do personagem) que começa em 0 —
 *    ou seja, sem setar um nível manualmente, `pointsLeft` fica sempre 0 e o botão direito
 *    da fatia (que preenche no máximo, ou gasta o que sobrar se não tiver o suficiente — já
 *    implementado em `WheelSlice.tsx`, comportamento pedido pelo usuário em 2026-09-04) nunca
 *    tem ponto pra gastar. Nosso planner não pede nível de personagem (decisão já tomada
 *    antes: "não precisa ter restrição de pontos") — level 4050 dá pointsMax=4000, a roda
 *    inteira liberada. Setado via hash da própria URL (mesmo mecanismo de compartilhamento
 *    de build que o `RootContextProvider` já lê sozinho em `parseHash()`), só quando a
 *    página abre sem nenhum build salvo no link — não pisa num hash de build compartilhado.
 *    Feito no CORPO do componente (não no topo do módulo) pra reaplicar toda vez que a
 *    página é montada de novo — o hash é limpo ao navegar pra outra rota do app, então um
 *    ajuste só-na-1ª-vez (topo do módulo, que só roda 1x por sessão) pararia de funcionar na
 *    2ª visita à página. Usa `history.replaceState` (não `location.hash =`) porque atribuir
 *    direto em `location.hash` dispara um evento de navegação que o BrowserRouter do app
 *    escuta e reage ENQUANTO este componente ainda está renderizando (React acusava "Cannot
 *    update a component while rendering a different component"); `replaceState` muda a URL
 *    sem disparar esse evento, e o `RootContextProvider` deles lê `location.hash` direto (não
 *    escuta evento), então continua funcionando igual. */
export function WheelPlannerPage() {
  if (!location.hash) {
    history.replaceState(null, '', '#' + contextToBinary({ level: 4050, vocation: 'knight', perks: {} }));
  }

  return (
    <div style={{ background: 'var(--color-bg)', margin: '-2rem', padding: '2rem' }}>
      <TibiaWheelApp />
    </div>
  );
}
