import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { DashboardPage } from '@/modules/dashboard';
import { LootLogPage } from '@/modules/dashboard/LootLogPage';
import { SplitCalculatorPage } from '@/modules/split-calculator';
import { TimersPage } from '@/modules/timers';
import { TierCalculatorPage } from '@/modules/tier-calculator';
import { CharmPlannerPage } from '@/modules/charm-planner';
import { HistoricoPage } from '@/modules/calendar-historico';
import { ServiceirosPage } from '@/modules/serviceiros';
import { SettingsPage } from '@/modules/settings';
import { LoginPage } from '@/modules/login';

export function AppRouter() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
