import type { DedicationPerkId, GenericConvictionId, WheelAugmentation, WheelRevelationPerk, WheelUniqueConviction, WheelVocation } from '@/types';

/** Catálogo de perks da Roda de Destino — conteúdo e POSIÇÃO extraídos DIRETO do
 * tibiapal.com em 2026-09-03 (simulação de hover em cada uma das 36 fatias do canvas, pras
 * 4 vocações — ver wheel-slice-content.ts pro mapeamento fatia→perk). Nomes/textos em
 * português seguem tibiawiki.com.br. Ícones reais baixados por scripts/fetch-wheel-icons.mjs
 * (ver wheel-icons.ts). Perks de resistência elemental (fire/energy/ice/earth/holydeath) e a
 * 6ª augmentation do Druid (Nature's Embrace) foram removidos daqui: não aparecem em
 * NENHUMA das 36 fatias da roda real — não fazem parte do Wheel of Destiny, só do catálogo
 * geral da vocação. */

export const DEDICATION_PERKS: { id: DedicationPerkId; name: string; description: string; icon: string }[] = [
  { id: 'hitpoints', name: 'Hit Points', description: 'Aumenta o HP máximo (3/2/1/1 por ponto, proporcional ao ganho de HP por level da vocação).', icon: '❤️' },
  { id: 'mana', name: 'Mana', description: 'Aumenta a Mana máxima (1/3/6/6 por ponto, proporcional ao ganho de mana por level da vocação).', icon: '💧' },
  { id: 'hitpoints_mana', name: 'Hit Points & Mana', description: 'Combinação dos dois perks acima — aumenta HP e Mana máximos ao mesmo tempo.', icon: '💗' },
  { id: 'capacity', name: 'Capacity', description: 'Aumenta a capacidade máxima (5/4/2/2 por ponto, proporcional ao ganho de capacidade por level da vocação).', icon: '🎒' },
  { id: 'mitigation', name: 'Mitigation', description: 'Aumenta a mitigação multiplicativamente em 0,075% por ponto investido.', icon: '🛡️' },
];

export const GENERIC_CONVICTION_PERKS: { id: GenericConvictionId; name: string; description: string; icon: string }[] = [
  { id: 'manaleech', name: 'Mana Leech', description: 'Concede 0,25% de mana leech.', icon: '🔵' },
  { id: 'lifeleech', name: 'Life Leech', description: 'Concede 0,75% de life leech.', icon: '🩸' },
  { id: 'skillboost', name: 'Boost de Skill Principal', description: 'Concede um bônus na skill ofensiva principal da vocação (sword/axe/club, distance ou magic level).', icon: '⚔️' },
  { id: 'vesselresonance', name: 'Vessel Resonance', description: 'Concede +1 dano/cura se o tamanho do gem socketado bater com a Vessel Resonance do domínio (+2 se for um Greater Gem).', icon: '💠' },
];

/** Conviction Perk único da vocação — ocupa sempre 1 fatia do anel 4 (200 pontos, teto real
 * do anel). Cada vocação tem exatamente 2. */
export const VOCATION_UNIQUE_CONVICTIONS: Record<WheelVocation, WheelUniqueConviction[]> = {
  knight: [
    { id: 'battle_healing', name: 'Battle Healing', description: 'Aumenta em 10% o efeito de suas magias de cura. Esse bônus é duplicado enquanto estiver empunhando um escudo.' },
    { id: 'battle_instinct', name: 'Battle Instinct', description: 'Ganhe +6 de shielding e +1 sword/axe/club fighting quando 5 criaturas estão nos SQMs adjacentes. Para cada criatura adicional, até um máximo de 8, +6 de shielding e +1 de weapon skill.' },
  ],
  paladin: [
    { id: 'positional_tactics', name: 'Positional Tactics', description: 'Ganhe +3 distance fighting enquanto nenhum monstro estiver a 1 sqm de distância. Caso contrário, ganhe +3 holy e +3 healing magic level.' },
    { id: 'ballistic_mastery', name: 'Ballistic Mastery', description: 'O dano crítico extra com crossbow aumenta em 10%. Enquanto empunhar um bow, seus ataques e magias ganham +4% de pierce físico e holy.' },
  ],
  druid: [
    { id: 'healing_link', name: 'Healing Link', description: "Se você curar alguém com Nature's Embrace ou Heal Friend, também se cura em 10% do valor curado." },
    { id: 'runic_mastery', name: 'Runic Mastery', description: 'Ao usar uma rune, 25% de chance de aumentar seu magic level em 10% (ou 20% se a rune for da sua própria vocação) pra aquele efeito específico.' },
  ],
  sorcerer: [
    { id: 'focus_mastery', name: 'Focus Mastery', description: "Empodera o dano da próxima magia em 35% por 12s após conjurar uma Focus Spell (Hell's Core/Rage of the Skies); reduz o cooldown de grupo dessas magias em 2s." },
    { id: 'runic_mastery', name: 'Runic Mastery', description: 'Ao usar uma rune, 25% de chance de aumentar seu magic level em 10% (ou 20% se a rune for da sua própria vocação) pra aquele efeito específico.' },
  ],
};

/** As 5 augmentations de spell por vocação que realmente ocupam fatias da roda (confirmado
 * por extração direta — o Druid tem uma 6ª augmentation no catálogo geral, Nature's Embrace,
 * mas ela NÃO aparece em nenhuma das 36 fatias da Wheel of Destiny). Cada uma ocupa 2 fatias
 * (posições exatas em wheel-slice-content.ts); o texto de estágio 1/2 é sempre mostrado
 * junto, igual ao painel do tibiapal. */
export const VOCATION_AUGMENTATIONS: Record<WheelVocation, WheelAugmentation[]> = {
  knight: [
    { id: 'fierce_berserk', ability: 'Fierce Berserk', stage1: 'Redução de 30 pontos do custo de mana.', stage2: 'Adicional de 10% ao valor base de dano.' },
    { id: 'front_sweep', ability: 'Front Sweep', stage1: 'Aumenta em 40% o dano base da magia.', stage2: 'Aumenta a área de efeito, atingindo 2 quadrados adicionais nas laterais (5 SQM afetados).' },
    { id: 'groundshaker', ability: 'Groundshaker', stage1: 'Redução de 2 segundos de cooldown.', stage2: 'Adicional de 12,5% ao valor base de dano.' },
    { id: 'intense_wound_cleansing', ability: 'Intense Wound Cleansing', stage1: 'Adicional de 125% ao valor base de cura.', stage2: 'Redução de 60 segundos de cooldown.' },
    { id: 'shield_slam', ability: 'Shield Slam', stage1: 'Adicional de 15% de Life Leech.', stage2: 'Reduz em 25% o dano do próximo ataque hostil recebido.' },
  ],
  paladin: [
    { id: 'divine_caldera', ability: 'Divine Caldera', stage1: 'Redução de 20 pontos do custo de mana.', stage2: 'Adicional de 10% ao valor base de dano.' },
    { id: 'ethereal_barrage', ability: 'Ethereal Barrage', stage1: 'Adicional de 10% de Life Leech nessa magia.', stage2: 'Adicional de 10% de chance de dano crítico nessa magia.' },
    { id: 'divine_dazzle', ability: 'Divine Dazzle', stage1: 'Estende-se para 2 alvos adicionais no chain.', stage2: 'Aumenta a duração e reduz o cooldown em 8 segundos.' },
    { id: 'strong_ethereal_spear', ability: 'Strong Ethereal Spear', stage1: 'Redução de 2 segundos de cooldown.', stage2: 'Adicional de 380% ao valor base de dano.' },
    { id: 'divine_barrage', ability: 'Divine Barrage', stage1: 'Adicional de 8% ao dano base da magia.', stage2: 'Adicional de 12% ao dano base da magia.' },
  ],
  druid: [
    { id: 'forked_spells', ability: 'Forked Spells', stage1: 'Reduz o cooldown de Forked Thorns e Forked Glacier em 2 segundos.', stage2: 'Permite atingir 1 alvo adicional com Forked Thorns e Forked Glacier.' },
    { id: 'strong_ice_wave', ability: 'Strong Ice Wave', stage1: 'Adicional de 6% ao dano base da magia.', stage2: 'Aumenta a área de efeito da magia.' },
    { id: 'heal_friend', ability: 'Heal Friend', stage1: 'Adicional de 4% ao valor base de cura.', stage2: 'Adicional de 6% ao valor base de cura.' },
    { id: 'mass_healing', ability: 'Mass Healing', stage1: 'Adicional de 4% ao valor base de cura.', stage2: 'Expansão da área afetada.' },
    { id: 'terra_wave', ability: 'Terra Wave', stage1: 'Adicional de 6,5% ao valor base de dano.', stage2: 'Adicional de 10% de Life Leech nessa magia.' },
  ],
  sorcerer: [
    { id: 'energy_wave', ability: 'Energy Wave', stage1: 'Aumenta a área de efeito da magia.', stage2: 'Adicional de 10% ao dano base da magia.' },
    { id: 'focus_spells', ability: 'Focus Spells', stage1: "Adicional de 5% ao dano base de Hell's Core e Rage of the Skies.", stage2: "Redução de 4 segundos no cooldown secundário de foco (Hell's Core e Rage of the Skies)." },
    { id: 'great_fire_wave', ability: 'Great Fire Wave', stage1: 'Adicional de 15% de dano crítico extra nessa magia.', stage2: 'Adicional de 5% ao dano base da magia.' },
    { id: 'death_echo', ability: 'Death Echo', stage1: 'Reduz o cooldown da magia em 2 segundos.', stage2: 'Adicional de 12% ao dano base da magia.' },
    { id: 'special_spells', ability: 'Special Spells', stage1: 'Reduz o cooldown de Lightning, Strong Energy Strike e Strong Flame Strike em 4 segundos.', stage2: 'Adicional de 50% ao dano base de Lightning, Strong Energy Strike e Strong Flame Strike.' },
  ],
};

/** Os 4 Revelation Perks por vocação (1 fixo por domínio da roda) — texto/números reais
 * combinando tibia.fandom.com (estágios do Executioner's Throw/Divine Grenade/Divine
 * Empowerment, mais detalhados em inglês) e tibiawiki.com.br (Lord of Destruction/Beam
 * Mastery/Blessing of the Grove/Gift of Life, com números atualizados — ex: Lord of
 * Destruction mudou de 2/3/4% pra 6/7/8% numa atualização mais recente). Cada estágio
 * (250/500/1000 pontos investidos no domínio) também soma um bônus global de "Damage and
 * Healing" (+4/+9/+20, cumulativo entre todos os Revelation desbloqueados).
 *
 * ORDEM DO ARRAY = DOMÍNIO (índice 0-3, consumido direto por
 * `VOCATION_REVELATION_PERKS[vocation][domain]`) — corrigido em 2026-09-03, pedido do
 * usuário: "o gift sempre é no lado esquerdo em cima, e o avatar sempre é no sul direita".
 * Confirmado via zoom no canvas do tibiapal (CSS scale + reposicionar, o painel de hover do
 * Revelation é bugado e sempre mostra "Gift of Life" independente do domínio, não dá pra
 * confiar nele — só o ÍCONE desenhado é confiável): **Gift of Life está SEMPRE no domínio 0
 * (Verde/topo-esquerda)** e o **Avatar da vocação SEMPRE no domínio 3 (Roxo/baixo-direita)**
 * — confirmado nas 4 vocações (mesmo padrão de posição, o array de cada vocação foi escrito
 * na mesma ordem). Os 2 perks exclusivos da vocação ficam nos domínios 1 (Vermelho/
 * topo-direita) e 2 (Turquesa/baixo-esquerda) — verificado pixel a pixel pro Knight
 * (domínio1=Executioner's Throw, domínio2=Combat Mastery) e Paladin (domínio1=Divine
 * Grenade, domínio2=Divine Empowerment); Druid/Sorcerer seguem o mesmo padrão estrutural
 * (não reverificados pixel a pixel, mas a mesma ordem de autoria do array). */
export const VOCATION_REVELATION_PERKS: Record<WheelVocation, WheelRevelationPerk[]> = {
  knight: [
    { id: 'gift_of_life', name: 'Gift of Life', description: 'Se um ataque te mataria mas o excedente de dano for menor que 20/25/30% do seu HP máximo, você se regenera em 20/25/30% do HP máximo (Sorcerer/Druid também recuperam mana) antes do dano ser aplicado, e reduz todos os cooldowns em 60s.', stage1: '20% de HP', stage2: '25% de HP', stage3: '30% de HP' },
    { id: 'executioners_throw', name: "Executioner's Throw", description: 'Lança sua arma no alvo, causando dano físico e ricocheteando em até 2/3/4 inimigos próximos. +100/125/150% de dano em alvos com menos de 30% de HP.', stage1: '2 alvos, cooldown 18s', stage2: '3 alvos, cooldown 14s', stage3: '4 alvos, cooldown 10s' },
    { id: 'combat_mastery', name: 'Combat Mastery', description: 'Reduz o dano recebido conforme sua vida diminui (1% de redução a cada 14/12/10% de HP perdido, dobrado com escudo); aumenta o dano causado conforme a vida do alvo diminui (1% a cada 14/12/10% de HP perdido pelo alvo, dobrado com arma de 2 mãos).', stage1: '1% a cada 14% de HP faltando', stage2: '1% a cada 12% de HP faltando', stage3: '1% a cada 10% de HP faltando' },
    { id: 'avatar_of_steel', name: 'Avatar of Steel', description: 'Transforma o jogador num avatar poderoso que reduz o dano recebido e aumenta o dano causado (combate corpo a corpo).', stage1: 'Estágio 1', stage2: 'Estágio 2', stage3: 'Estágio 3' },
  ],
  paladin: [
    { id: 'gift_of_life', name: 'Gift of Life', description: 'Se um ataque te mataria mas o excedente de dano for menor que 20/25/30% do seu HP máximo, você se regenera em 20/25/30% do HP máximo antes do dano ser aplicado, e reduz todos os cooldowns em 60s.', stage1: '20% de HP', stage2: '25% de HP', stage3: '30% de HP' },
    { id: 'divine_grenade', name: 'Divine Grenade', description: 'Planta um marcador que explode após 3s causando dano holy. +16% de dano base por estágio adicional.', stage1: 'Cooldown 26s', stage2: 'Cooldown 20s', stage3: 'Cooldown 14s' },
    { id: 'divine_empowerment', name: 'Divine Empowerment', description: 'Cria um campo 3x3 de energia holy por 5s — enquanto estiver nele, seu dano causado aumenta.', stage1: '+8% dano, cooldown 32s', stage2: '+10% dano, cooldown 28s', stage3: '+12% dano, cooldown 24s' },
    { id: 'avatar_of_light', name: 'Avatar of Light', description: 'Transforma o jogador num avatar poderoso que reduz o dano recebido e aumenta o dano causado (à distância).', stage1: 'Estágio 1', stage2: 'Estágio 2', stage3: 'Estágio 3' },
  ],
  druid: [
    { id: 'gift_of_life', name: 'Gift of Life', description: 'Se um ataque te mataria mas o excedente de dano for menor que 20/25/30% do seu HP máximo, você se regenera em 20/25/30% do HP e mana máximos antes do dano ser aplicado, e reduz todos os cooldowns em 60s.', stage1: '20% de HP/Mana', stage2: '25% de HP/Mana', stage3: '30% de HP/Mana' },
    { id: 'blessing_of_the_grove', name: 'Blessing of the Grove', description: 'Magias de cura passam a curar criticamente; cura aumentada contra alvos com menos de 60% de HP (dobrado abaixo de 30%).', stage1: '+5% cura (60% HP) / +10% (30% HP)', stage2: '+7,5% / +15%', stage3: '+10% / +20%' },
    { id: 'twin_bursts', name: 'Twin Bursts', description: 'Desbloqueia Ice Burst/Terra Burst (compartilham cooldown) — anel de dano de gelo ou terra ao redor do personagem. +20/40/60% de dano por estágio adicional, com redução de cooldown.', stage1: '+20% dano', stage2: '+40% dano', stage3: '+60% dano' },
    { id: 'avatar_of_nature', name: 'Avatar of Nature', description: 'Transforma o jogador num avatar poderoso que reduz o dano recebido e aumenta o dano causado (suporte/cura).', stage1: 'Estágio 1', stage2: 'Estágio 2', stage3: 'Estágio 3' },
  ],
  sorcerer: [
    { id: 'gift_of_life', name: 'Gift of Life', description: 'Se um ataque te mataria mas o excedente de dano for menor que 20/25/30% do seu HP máximo, você se regenera em 20/25/30% do HP e mana máximos antes do dano ser aplicado, e reduz todos os cooldowns em 60s.', stage1: '20% de HP/Mana', stage2: '25% de HP/Mana', stage3: '30% de HP/Mana' },
    { id: 'beam_mastery', name: 'Beam Mastery', description: 'Fortalece magias de feixe (beam) — cada alvo atingido pelo feixe central aumenta o dano e reduz o cooldown de todas as magias em 1s (máx 3s); quadrados adjacentes recebem uma fração do dano central.', stage1: '+10% dano por alvo (máx 30%), adjacentes 25%', stage2: '+12% (máx 36%), adjacentes 40%', stage3: '+14% (máx 42%), adjacentes 70%' },
    { id: 'lord_of_destruction', name: 'Lord of Destruction', description: 'Melhora os bônus das Elemental Stances: Master of Flames (base power fogo), Master of Thunder (crit chance energia), Master of Decay (crit extra damage death).', stage1: '+6% / +6% / +45%', stage2: '+7% / +7% / +52,5%', stage3: '+8% / +8% / +60%' },
    { id: 'avatar_of_storm', name: 'Avatar of Storm', description: 'Transforma o jogador num avatar poderoso que reduz o dano recebido e aumenta o dano causado (mágico).', stage1: 'Estágio 1', stage2: 'Estágio 2', stage3: 'Estágio 3' },
  ],
};

export const VOCATION_LABEL: Record<WheelVocation, string> = {
  knight: 'Knight',
  paladin: 'Paladin',
  druid: 'Druid',
  sorcerer: 'Sorcerer',
};

export const VOCATION_ICON: Record<WheelVocation, string> = {
  knight: '⚔️',
  paladin: '🏹',
  druid: '❄️',
  sorcerer: '🔥',
};

/** Bônus global de "Damage and Healing" — soma a cada ESTÁGIO de Revelation desbloqueado,
 * de QUALQUER domínio (cumulativo). Dado real da TibiaWiki. */
export const REVELATION_DAMAGE_HEALING_BONUS = { stage1: 4, stage2: 9, stage3: 20 } as const;

/** Marcos de pontos totais pra estágios de Revelation, por domínio (dado real da
 * TibiaWiki: 250/500/1000 pontos investidos no MESMO domínio). */
export const REVELATION_STAGE_THRESHOLDS = { stage1: 250, stage2: 500, stage3: 1000 } as const;
