import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/modules/dashboard';
import { LootLogPage } from '@/modules/dashboard/LootLogPage';
import { SplitCalculatorPage } from '@/modules/split-calculator';
import { TimersPage } from '@/modules/timers';
import { TierCalculatorPage } from '@/modules/tier-calculator';
import { CharmPlannerPage } from '@/modules/charm-planner';
import { CalendarioPage } from '@/modules/calendar-historico';
import { ServiceirosPage } from '@/modules/serviceiros';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="loot-log" element={<LootLogPage />} />
          <Route path="split" element={<SplitCalculatorPage />} />
          <Route path="timers" element={<TimersPage />} />
          <Route path="tier-calculator" element={<TierCalculatorPage />} />
          <Route path="charm-planner" element={<CharmPlannerPage />} />
          <Route path="calendario" element={<CalendarioPage />} />
          <Route path="serviceiros" element={<ServiceirosPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
