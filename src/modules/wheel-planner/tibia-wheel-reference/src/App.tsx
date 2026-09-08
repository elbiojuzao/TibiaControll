/* 
 * This file is part of Tibia Wheel.
 * Copyright (c) 2022 Maciej Sopyło
 * 
 * Tibia Wheel is free software: you can redistribute it and/or modify  
 * it under the terms of the GNU Lesser General Public License as published by  
 * the Free Software Foundation, version 3.
 *
 * Tibia Wheel is distributed in the hope that it will be useful, but 
 * WITHOUT ANY WARRANTY; without even the implied warranty of 
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU 
 * General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License 
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import { RootContextProvider } from './context';
import { Wheel } from './components/Wheel';

import { VocationSelector } from './components/VocationSelector';
import { Summary } from './components/Summary';
import { SelectionPanel } from './components/SelectionPanel';
import { WheelPresets } from './components/WheelPresets';

/** Layout em 3 colunas (2026-09-05, pedido do usuário, baseado num print de referência do
 * tibiapal.com): painel de adicionar/remover pontos do perk selecionado na ESQUERDA
 * (SelectionPanel), roda no CENTRO, soma de todos os buffs pegos na DIREITA (Summary).
 * `.wheel-layout-3col` (global.css) empilha em 1 coluna no mobile.
 *
 * As 3 colunas são `<div>`s SEMPRE presentes no DOM (mesmo vazias), não os componentes
 * direto — `SelectionPanel` (sem perk selecionado) e `Summary` (sem nenhum ponto gasto)
 * podem renderizar `null`/nada. Sem um elemento fixo ocupando cada slot, o grid de 3
 * colunas (`grid-template-columns` explícito) faz auto-placement só com os filhos que
 * EXISTEM no DOM — com só 1 filho real (a coluna central), o grid o empurrava pra 1ª
 * coluna (280px, estreita), espremendo/cortando a roda (bug real visto em 2026-09-05: a
 * roda aparecia cortada à esquerda quando nenhum perk estava selecionado). */
export const App: React.FC = () => {
  return <>
    <RootContextProvider>
      <div className="wheel-layout-3col">
        <div><SelectionPanel /></div>
        <div className="wheel-center-column">
          <VocationSelector />
          <Wheel/>
        </div>
        <div><Summary /></div>
      </div>
      {/* Presets salvos (2026-09-08, pedido do usuário) — não é código original, ver
          WheelPresets.tsx. Fica embaixo das 3 colunas, ocupando a largura toda. */}
      <WheelPresets/>
    </RootContextProvider>
  </>;
};
