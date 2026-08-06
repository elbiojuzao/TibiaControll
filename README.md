# Tibia Party Manager

Sistema web de gestão para Partys (PTs) de Tibia — split loot, timers de mecânica e log de drops.

## Módulos

| Módulo | Status | Descrição |
|--------|--------|-----------|
| **Dashboard / Log de Drops** | ✅ MVP | Tabela de itens raros por party (mock local) |
| **Split Loot** | 🔧 Modelado | Calculadora com algoritmo de matchmaking |
| **Timers** | 🔧 Modelado | Presets de bosses mockados |
| **Calculadora Tier** | ✅ MVP | Custo em gold para subir tiers na Exaltation Forge (rota Fusão 65% x Convergência 100%) |
| **Charm Planner** | ✅ MVP | Planejador de Major/Minor Charms — custo em pontos por nível escolhido |
| **Histórico (Calendário)** | ✅ MVP | Calendário com hover mostrando Hunts, bosses e drops de cada dia |

## Stack

- React 19 + TypeScript + Vite
- React Router
- Repositórios com interface (mock → API futura)

## Estrutura

```
src/
├── types/           # Entidades de domínio (Account, Member, LootDrop, Hunt, Split, Boss)
├── services/
│   ├── api/         # Cliente HTTP (pronto para Supabase/Node)
│   ├── repositories/# Interfaces + implementações mock
│   └── split/       # Lógica de cálculo de split
├── mocks/data/      # Dados locais simulando o banco
├── modules/         # Dashboard, Split, Timers
├── hooks/           # useAccount, useLootDrops
└── components/      # Layout compartilhado
```

## Executar

```bash
npm install
npm run dev
```

Login demo automático: `demo@pt.com` / `demo123`

## Integração futura com API

1. Implementar repositórios HTTP em `services/repositories/http/`
2. Definir `VITE_USE_MOCK=false` no `.env`
3. Configurar `VITE_API_URL` apontando para o backend

## Tabela de Drops (por party)

Espelha a planilha original:

| Coluna | Campo |
|--------|-------|
| Data | `date` |
| EK / ED / MS / RP | `party.ek`, `party.ed`, ... |
| 5º Player / Service | `party.fifthPlayer`, `party.service` |
| Valor cada / Total | `unitValue`, `totalValue` |
| Fragador | `looter` |
| Item / Boss | `itemName`, `bossName` |
| Vendido / Venda | `sold`, `saleDate` |
