import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RequireAuth } from '@/components/auth/RequireAuth';

// Cada página vira um chunk próprio, carregado só quando a rota é visitada (2026-08-27,
// bundle único passou de 500kB — ver memória "pendencias-proxima-sessao"). Antes todo
// módulo (Dashboard, Split, Timers, Calculadora Tier, Charm Planner, Histórico,
// Serviceiros, Configurações, Login) ia no mesmo chunk inicial, mesmo os que a maioria das
// visitas nunca abre. LoginPage fica de fora do lazy: é sempre a 1ª tela vista por quem não
// tem sessão, não faz sentido esperar um chunk extra pra ela.
import { LoginPage } from '@/modules/login';
const DashboardPage = lazy(() => import('@/modules/dashboard').then((m) => ({ default: m.DashboardPage })));
const LootLogPage = lazy(() => import('@/modules/dashboard/LootLogPage').then((m) => ({ default: m.LootLogPage })));
const SplitCalculatorPage = lazy(() => import('@/modules/split-calculator').then((m) => ({ default: m.SplitCalculatorPage })));
const TimersPage = lazy(() => import('@/modules/timers').then((m) => ({ default: m.TimersPage })));
const TierCalculatorPage = lazy(() => import('@/modules/tier-calculator').then((m) => ({ default: m.TierCalculatorPage })));
const CharmPlannerPage = lazy(() => import('@/modules/charm-planner').then((m) => ({ default: m.CharmPlannerPage })));
const HistoricoPage = lazy(() => import('@/modules/calendar-historico').then((m) => ({ default: m.HistoricoPage })));
const ServiceirosPage = lazy(() => import('@/modules/serviceiros').then((m) => ({ default: m.ServiceirosPage })));
const SettingsPage = lazy(() => import('@/modules/settings').then((m) => ({ default: m.SettingsPage })));

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="loading">Carregando...</div>}>
        <Routes>
          <Route path="login" element={<LoginPage />} />

          {/* Módulos exclusivos de conta (login real via Supabase Auth) e módulos livres
              (calculadoras/ferramentas, sem dado de party) convivem sob o mesmo AppLayout —
              só os 5 primeiros exigem RequireAuth. */}
          <Route element={<AppLayout />}>
            <Route index element={<RequireAuth><DashboardPage /></RequireAuth>} />
            <Route path="loot-log" element={<RequireAuth><LootLogPage /></RequireAuth>} />
            <Route path="calendario" element={<RequireAuth><HistoricoPage /></RequireAuth>} />
            <Route path="serviceiros" element={<RequireAuth><ServiceirosPage /></RequireAuth>} />
            <Route path="configuracoes" element={<RequireAuth><SettingsPage /></RequireAuth>} />

            <Route path="split" element={<SplitCalculatorPage />} />
            <Route path="timers" element={<TimersPage />} />
            <Route path="tier-calculator" element={<TierCalculatorPage />} />
            <Route path="charm-planner" element={<CharmPlannerPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
