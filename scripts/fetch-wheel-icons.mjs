/**
 * Baixa os ícones reais dos perks da Roda de Destino do tibiawiki.com.br pra
 * src/assets/wheel-icons/, um arquivo por perk, nomeado com o mesmo `id` usado em
 * wheel-perks-data.ts. URLs confirmadas direto na página
 * https://www.tibiawiki.com.br/wiki/Wheel_of_Destiny (2026-09-02, pedido do usuário: "as
 * imagens dos bonus não estão aparecendo") — mesmo padrão de fetch-charm-icons.mjs.
 *
 * Reusável: roda de novo a qualquer momento — ícone já baixado é pulado.
 * Uso: node scripts/fetch-wheel-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'src/assets/wheel-icons');

/** id (igual ao usado em wheel-perks-data.ts) -> URL exata da imagem. A maioria vem do
 * tibiawiki.com.br; os ícones de Dedication Perk + Conviction genérico (Life/Mana Leech,
 * Skill Boost) vêm do tibia.fandom.com (static.wikia.nocookie.net) — 2026-09-03, pedido do
 * usuário: "os perks de mana leech e life leech estão errados esta aparecendo uma bolinha
 * azul e uma gota vermelha" — confirmados via captura de tela ampliada direto do canvas do
 * tibiapal.com (ícone real: uma garra/tentáculo vermelho pra Life Leech, roxo/magenta pra
 * Mana Leech — nada a ver com o emoji genérico usado antes). */
const WHEEL_ICON_URLS = {
  // Dedication Perks (tibia.fandom.com — precisa da query completa /revision/latest?cb=...,
  // senão o CDN da wikia devolve 404)
  hitpoints: 'https://static.wikia.nocookie.net/tibia/images/8/85/Hit_Points_Icon.gif/revision/latest?cb=20221114171144&path-prefix=en&format=original',
  mana: 'https://static.wikia.nocookie.net/tibia/images/7/7a/Mana_Icon.gif/revision/latest?cb=20221114171145&path-prefix=en&format=original',
  hitpoints_mana: "https://static.wikia.nocookie.net/tibia/images/4/49/Hit_Points_%26_Mana_Icon.gif/revision/latest?cb=20221114171143&path-prefix=en&format=original",
  capacity: 'https://static.wikia.nocookie.net/tibia/images/8/8a/Capacity_Icon.gif/revision/latest?cb=20221114171140&path-prefix=en&format=original',
  mitigation: 'https://static.wikia.nocookie.net/tibia/images/d/d2/Mitigation_Icon_Wheel.gif/revision/latest?cb=20221118162812&path-prefix=en&format=original',
  // Conviction genérico (tibia.fandom.com) — sem estágio, sem escolha, o mesmo ícone pra
  // qualquer domínio/vocação
  lifeleech: 'https://static.wikia.nocookie.net/tibia/images/a/ab/Life_Leech_Icon.gif/revision/latest?cb=20221115113422&path-prefix=en&format=original',
  manaleech: 'https://static.wikia.nocookie.net/tibia/images/6/61/Mana_Leech_Icon.gif/revision/latest?cb=20221115113424&path-prefix=en&format=original',
  skillboost: 'https://static.wikia.nocookie.net/tibia/images/a/a2/Skill_Boost_Icon.gif/revision/latest?cb=20251026204354&path-prefix=en&format=original',
  // Augmentations — Knight
  fierce_berserk: 'https://www.tibiawiki.com.br/images/5/58/Augmented_Fierce_Berserk.gif',
  front_sweep: 'https://www.tibiawiki.com.br/images/2/21/Augmented_Front_Sweep.gif',
  groundshaker: 'https://www.tibiawiki.com.br/images/6/66/Augmented_Groundshaker.gif',
  intense_wound_cleansing: 'https://www.tibiawiki.com.br/images/b/b3/Augmented_Intense_Wound_Cleansing.gif',
  shield_slam: 'https://www.tibiawiki.com.br/images/5/57/Augmented_Shield_Slam.gif',
  // Augmentations — Druid
  forked_spells: 'https://www.tibiawiki.com.br/images/5/58/Augmented_Forked_Spells.gif',
  heal_friend: 'https://www.tibiawiki.com.br/images/2/29/Augmented_Heal_Friend.gif',
  mass_healing: 'https://www.tibiawiki.com.br/images/2/2e/Augmented_Mass_Healing.gif',
  natures_embrace: "https://www.tibiawiki.com.br/images/7/7e/Augmented_Nature's_Embrace.gif",
  strong_ice_wave: 'https://www.tibiawiki.com.br/images/9/97/Augmented_Strong_Ice_Wave.gif',
  terra_wave: 'https://www.tibiawiki.com.br/images/3/33/Augmented_Terra_Wave.gif',
  // Augmentations — Paladin
  divine_dazzle: 'https://www.tibiawiki.com.br/images/e/e5/Augmented_Divine_Dazzle.gif',
  divine_caldera: 'https://www.tibiawiki.com.br/images/0/06/Augmented_Divine_Caldera.gif',
  ethereal_barrage: 'https://www.tibiawiki.com.br/images/e/e8/Augmented_Ethereal_Barrage.gif',
  strong_ethereal_spear: 'https://www.tibiawiki.com.br/images/5/52/Augmented_Strong_Ethereal_Spear.gif',
  divine_barrage: 'https://www.tibiawiki.com.br/images/0/0b/Augmented_Divine_Barrage.gif',
  // Augmentations — Sorcerer
  death_echo: 'https://www.tibiawiki.com.br/images/1/10/Augmented_Death_Echo.gif',
  energy_wave: 'https://www.tibiawiki.com.br/images/7/70/Augmented_Energy_Wave.gif',
  focus_spells: 'https://www.tibiawiki.com.br/images/c/ca/Augmented_Focus_Spells.gif',
  great_fire_wave: 'https://www.tibiawiki.com.br/images/6/69/Augmented_Great_Fire_Wave.gif',
  special_spells: 'https://www.tibiawiki.com.br/images/b/b8/Augmented_Special_Spells.gif',
  // Conviction único por vocação (sem estágio 2, custo fixo 575 pts)
  battle_healing: 'https://www.tibiawiki.com.br/images/a/af/Battle_Healing.gif',
  battle_instinct: 'https://www.tibiawiki.com.br/images/a/ad/Battle_Instinct.gif',
  positional_tactics: 'https://www.tibiawiki.com.br/images/6/6e/Positional_Tactics.gif',
  ballistic_mastery: 'https://www.tibiawiki.com.br/images/6/6d/Ballistic_Mastery.gif',
  healing_link: 'https://www.tibiawiki.com.br/images/f/f3/Healing_Link.gif',
  runic_mastery: 'https://www.tibiawiki.com.br/images/2/21/Runic_Mastery.gif',
  focus_mastery: 'https://www.tibiawiki.com.br/images/c/c0/Focus_Mastery.gif',
  // Revelation Perks
  executioners_throw: "https://www.tibiawiki.com.br/images/7/70/Executioner's_Throw.gif",
  combat_mastery: 'https://www.tibiawiki.com.br/images/0/08/Combat_Mastery.gif',
  avatar_of_steel: 'https://www.tibiawiki.com.br/images/4/42/Avatar_of_Steel.gif',
  divine_grenade: 'https://www.tibiawiki.com.br/images/b/be/Divine_Grenade.gif',
  divine_empowerment: 'https://www.tibiawiki.com.br/images/f/f6/Divine_Empowerment.gif',
  avatar_of_light: 'https://www.tibiawiki.com.br/images/3/3e/Avatar_of_Light.gif',
  blessing_of_the_grove: 'https://www.tibiawiki.com.br/images/b/b3/Blessing_of_the_Grove.gif',
  twin_bursts: 'https://www.tibiawiki.com.br/images/0/0d/Twin_Bursts.gif',
  avatar_of_nature: 'https://www.tibiawiki.com.br/images/5/58/Avatar_of_Nature.gif',
  beam_mastery: 'https://www.tibiawiki.com.br/images/1/16/Beam_Mastery.gif',
  lord_of_destruction: 'https://www.tibiawiki.com.br/images/f/f9/Lord_of_Destruction.gif',
  avatar_of_storm: 'https://www.tibiawiki.com.br/images/9/9a/Avatar_of_Storm.gif',
  gift_of_life: 'https://www.tibiawiki.com.br/images/7/7f/Gift_of_Life.gif',
};

async function fetchWithRetry(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetch(url);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let downloaded = 0;
  const misses = [];

  for (const [id, url] of Object.entries(WHEEL_ICON_URLS)) {
    const outPath = path.join(OUT_DIR, `${id}.gif`);
    if (fs.existsSync(outPath)) continue;

    try {
      const res = await fetchWithRetry(url);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(outPath, buf);
      downloaded++;
      console.log(`[OK] ${id} (${buf.length} bytes)`);
    } catch (err) {
      misses.push(id);
      console.log(`[ERRO] ${id}: ${err.message}`);
    }

    await new Promise((r) => setTimeout(r, 120));
  }

  console.log(`\nBaixados agora: ${downloaded}. Faltando: ${misses.length}.`);
  if (misses.length) {
    console.log('\nÍcones sem imagem baixada (revisar manualmente):');
    misses.forEach((m) => console.log(' - ' + m));
  }
}

main();
