# Design System — Chronom-SaaS reference

Extraído do print de referência enviado pelo usuário em 2026-08-16 (dashboard "Chronom-SaaS").
Objetivo: aplicar essa linguagem visual (dark SaaS moderno) no Tibia Party Manager inteiro,
mantendo o conteúdo/domínio do app (Tibia), só trocando cores, tipografia, espaçamento e
componentes de UI (cards, navbar, tabelas, badges, barras de progresso, gráficos).

## 1. Paleta de cores

### Base (fundo/superfícies)
| Token | Hex | Uso |
|---|---|---|
| `--color-bg` | `#12131c` | Fundo da página (mais escuro) |
| `--color-bg-elevated` | `#1a1b26` | Fundo de cards, navbar, modais |
| `--color-bg-hover` | `#22232f` | Hover de linha/item de lista |
| `--color-bg-input` | `#0f1019` | Fundo de input/select (mais escuro que o card) |
| `--color-border` | `#262838` | Borda padrão de card/divisor (sutil, quase invisível) |
| `--color-border-strong` | `#333650` | Borda de destaque (input focado, item ativo) |

### Texto
| Token | Hex | Uso |
|---|---|---|
| `--color-text` | `#eceef4` | Texto principal, números grandes |
| `--color-text-muted` | `#8b8fa3` | Labels, subtítulos, texto secundário |
| `--color-text-faint` | `#5c6079` | Texto terciário (timestamps antigos, placeholders) |

### Acento (marca/estado)
| Token | Hex | Uso |
|---|---|---|
| `--color-accent` | `#5b7fff` | Item de nav ativo, links, avatar, foco, "Today" |
| `--color-accent-soft` | `rgba(91,127,255,0.15)` | Fundo suave do acento (chip/badge) |
| `--color-success` | `#22c55e` | Positivo, uma das séries do gráfico (verde) |
| `--color-success-soft` | `rgba(34,197,94,0.15)` | — |
| `--color-warning` | `#f5a623` | Alerta médio, uma das séries do gráfico (âmbar) |
| `--color-warning-soft` | `rgba(245,166,35,0.15)` | — |
| `--color-danger` | `#ef4444` | Negativo, badges de % subindo, erros |
| `--color-danger-soft` | `rgba(239,68,68,0.15)` | — |

### Paleta categórica (badges de ícone, avatares por vetor/letra)
Usada em listas tipo "Open Alerts By Vector" (G/N/S/F/O) e ícones de card
("Latest Policy", "Resources Grouped by Policies"). Cada item pega a próxima cor da lista,
em ordem — não é fixo por nome.
```
--cat-1: #8b5cf6  (violeta)
--cat-2: #ef4444  (vermelho)
--cat-3: #f59e0b  (âmbar)
--cat-4: #3b82f6  (azul)
--cat-5: #14b8a6  (teal)
--cat-6: #ec4899  (rosa)
```

## 2. Tipografia

- Família: a mesma já usada no app (`'Segoe UI', system-ui, -apple-system, sans-serif`) — não trocar fonte, só peso/tamanho.
- Números "hero" (ex: gauge 70%, KPI grande): `2rem–2.2rem`, `font-weight: 700`.
- Números de lista/stat secundário (ex: "81,665"): `1.4rem`, `font-weight: 700`.
- Título de card: `0.9rem`, `font-weight: 600`, `--color-text`.
- Label/subtítulo: `0.75rem–0.8rem`, `--color-text-muted`.
- Nav (topbar): `0.85rem`, `font-weight: 500`, `--color-text-muted` (inativo) / `--color-text` + `--color-accent` (ativo).

## 3. Espaçamento & raio

| Token | Valor | Uso |
|---|---|---|
| `--radius-sm` | `6px` | Badge, input, botão pequeno |
| `--radius` | `12px` | Card padrão |
| `--radius-lg` | `16px` | Card grande/destaque (ex: gauge) |
| `--radius-pill` | `999px` | Badge pill, avatar |
| `--space-card` | `20px` | Padding interno de card |
| `--gap-grid` | `20px` | Gap entre cards no grid do dashboard |

Cards: fundo `--color-bg-elevated`, borda `1px solid --color-border`, raio `--radius` (ou `--radius-lg`
pros maiores), **sem sombra forte** (dark UI, sombra quase imperceptível ou nenhuma).

## 4. Componentes de referência

### Navbar (topo, substitui a sidebar atual)
- Barra horizontal fixa no topo, fundo `--color-bg-elevated`, borda inferior `1px solid --color-border`.
- Esquerda: logo/ícone + nome do workspace (aqui: nome da PT) com um chevron de "trocar conta" (preparação
  pro multi-conta que já existe no domínio — ver `[[integracao_supabase]]`).
- Centro/esquerda: itens de navegação em linha, ícone + label, item ativo com sublinhado azul (`--color-accent`)
  embaixo do texto + cor de texto clara; inativo em `--color-text-muted`.
- Direita: botões de ação secundários (ícones), e avatar circular (inicial do usuário, fundo `--color-accent`).
- **Diferença de escala**: a referência tem 6 itens de nav; este app tem 10 (Dashboard, Log de Drops, Split
  Loot, Timers, Calculadora Tier, Charm Planner, Histórico, Histórico de XP, Serviceiros, Configurações) — cabem
  numa barra com fonte/gap menores; usar ícone real (lucide/heroicon-style) no lugar dos emojis atuais deixaria
  mais parecido com a referência, mas isso é incremental, não bloqueia a v1.

### Card genérico
```
background: var(--color-bg-elevated);
border: 1px solid var(--color-border);
border-radius: var(--radius);
padding: var(--space-card);
```
Header do card: título à esquerda (`0.9rem`/600), controles/dropdowns/ícone-info à direita, sem borda
separando header do corpo (só espaçamento).

### Gráfico de barras empilhadas ("Daily Costs")
- Barras com até 3 segmentos empilhados, cada um numa cor da paleta de acento (`--color-accent`,
  `--color-warning`, `--color-success`), cantos superiores arredondados no segmento do topo.
- Linha pontilhada fina sobreposta pra comparação ("Last Month") em cinza claro translúcido.
- Legenda com bolinha colorida + label, alinhada embaixo do gráfico.
- Eixo Y à esquerda, ticks discretos, sem grid forte (linhas guia bem sutis ou nenhuma).

### Gauge circular ("Monthly Budget Usage")
- Arco de 270° aprox., trilho de fundo em `--color-bg-hover`/`--color-border`, progresso em `--color-accent`,
  ponta arredondada (`stroke-linecap: round`).
- Número grande centralizado (`2rem+`, 700), sem label dentro (label fica no header do card).

### Lista com badge de ícone ("Latest Policy", "Open Alerts By Vector")
- Item = badge quadrado arredondado (`--radius-sm`) com cor categórica de fundo + ícone/letra branca,
  título/nome à direita, subtítulo em `--color-text-muted` embaixo, e um valor/badge alinhado à direita
  (contagem, ou badge de % com seta ↗ vermelha pra negativo).

### Badge de percentual (tendência)
```
background: var(--color-danger-soft); /* ou success-soft se for positivo/bom */
color: var(--color-danger);
border-radius: var(--radius-sm);
padding: 2px 8px;
font-size: 0.72rem;
font-weight: 600;
```
Ícone de seta (↗/↘) antes do número.

### Barra de progresso (compliance highlights)
- Trilho fino (`4-6px` altura) em `--color-bg-hover`, preenchimento em gradiente/sólido conforme severidade
  (vermelho→âmbar→verde conforme a % — ou fixo numa cor por card, como no print), raio `--radius-pill`.
- % numérico alinhado à direita do título, acima da barra.

### Tabela ("The Number of Errors and Warnings")
- Sem bordas verticais, linha divisória horizontal bem sutil (`--color-border` a ~30% opacidade) ou nenhuma,
  hover de linha em `--color-bg-hover`.
- Primeira coluna com número/índice pequeno em badge circular sutil antes do nome.
- Colunas numéricas alinhadas à direita, badge de tendência (igual ao de lista) na última coluna.

## 5. Aplicação no domínio deste app (mapeamento)

Este app é um gerenciador de party de Tibia, domínio totalmente diferente do print de referência
(que é uma ferramenta de FinOps/CloudSec) — a ideia é reaproveitar só a **linguagem visual**, não o conteúdo.
Mapeamento sugerido pros cards existentes de cada módulo (ver `docs/architecture.json`/`.html` pra estrutura
atual completa):

- **Navbar**: sidebar atual (`AppLayout.tsx`) vira topbar, mesmos 10 itens + avatar/login no lugar do botão
  "Sair"/"Entrar" atual + `BoostedToday` (criatura/boss bostado do dia) vira um widget compacto no topbar
  (dropdown ao clicar num ícone, ex: 🔥), em vez de ocupar rodapé de sidebar.
- **Dashboard**: KPIs viram cards no estilo "Latest Policy"/lista com badge; "Drops no mês" e "TODOS os Itens
  não vendidos" mantêm formato de lista mas com o novo estilo de linha; "Meta XP Diária" pode usar o padrão de
  tabela da referência.
- **Log de Drops**: tabela reestilizada no padrão "The Number of Errors and Warnings".
- **Timers**: os cards de countdown (Global/Loop/Poções) podem usar o padrão de gauge circular pro tempo
  restante, em vez do bloco retangular atual — avaliar no momento da implementação (mudança mais estrutural,
  não obrigatória pra v1).
- **Split Loot / Calculadora Tier / Charm Planner / Histórico / Histórico de XP / Serviceiros / Configurações**:
  card genérico + badges/tabela conforme o conteúdo de cada um.

## 6. O que NÃO muda

- Lógica de negócio, rotas, nomes de campos, regras de cálculo — zero mudança funcional.
- Fonte (`--font-sans`) e breakpoints responsivos existentes.
- Ícones reais de item/boss/poção já implementados (pipelines do TibiaWiki) — só o estilo do *container*
  ao redor muda, não os ícones em si.
