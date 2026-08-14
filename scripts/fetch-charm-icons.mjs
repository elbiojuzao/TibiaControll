/**
 * Baixa os ícones das runas de Charm do TibiaWiki (tibiawiki.com.br) pra
 * src/assets/charm-icons/, um arquivo por charm nomeado com o charmId (mesmo id usado em
 * charm-data.ts). Lista fixa de 25 charms (14 major + 11 minor) com URL exata confirmada
 * direto na página https://www.tibiawiki.com.br/wiki/Charms — diferente de
 * fetch-item-icons.mjs, não precisa de resolução dinâmica de nome porque o sistema de
 * Charms do Tibia é estável (não cresce toda hora como a lista de itens de boss).
 *
 * Reusável: roda de novo a qualquer momento — ícone já baixado é pulado.
 *
 * Uso: node scripts/fetch-charm-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'src/assets/charm-icons');

/** charmId (igual ao gerado em charm-data.ts) -> URL exata da imagem no tibiawiki.com.br */
const CHARM_ICON_URLS = {
  // Major
  carnage: 'https://www.tibiawiki.com.br/images/3/30/Carnage_Icon.gif',
  curse: 'https://www.tibiawiki.com.br/images/e/e3/Curse_Icon.gif',
  'divine-wrath': 'https://www.tibiawiki.com.br/images/c/cc/Divine_Wrath_Icon.gif',
  dodge: 'https://www.tibiawiki.com.br/images/2/25/Dodge_Icon.gif',
  enflame: 'https://www.tibiawiki.com.br/images/7/74/Enflame_Icon.gif',
  freeze: 'https://www.tibiawiki.com.br/images/7/72/Freeze_Icon.gif',
  'low-blow': 'https://www.tibiawiki.com.br/images/8/8c/Low_Blow_Icon.gif',
  overpower: 'https://www.tibiawiki.com.br/images/2/2b/Overpower_Icon.gif',
  overflux: 'https://www.tibiawiki.com.br/images/2/20/Overflux_Icon.gif',
  parry: 'https://www.tibiawiki.com.br/images/a/a8/Parry_Icon.gif',
  poison: 'https://www.tibiawiki.com.br/images/5/59/Poison_Icon.gif',
  'savage-blow': 'https://www.tibiawiki.com.br/images/e/e6/Savage_Blow_Icon.gif',
  wound: 'https://www.tibiawiki.com.br/images/d/d9/Wound_Icon.gif',
  zap: 'https://www.tibiawiki.com.br/images/2/2f/Zap_Icon.gif',
  // Minor
  'adrenaline-burst': 'https://www.tibiawiki.com.br/images/1/1d/Adrenaline_Burst_Icon.gif',
  bless: 'https://www.tibiawiki.com.br/images/6/6c/Bless_Icon.gif',
  cleanse: 'https://www.tibiawiki.com.br/images/9/92/Cleanse_Icon.gif',
  cripple: 'https://www.tibiawiki.com.br/images/9/9c/Cripple_Icon.gif',
  'fatal-hold': 'https://www.tibiawiki.com.br/images/b/b8/Fatal_Hold_Icon.gif',
  gut: 'https://www.tibiawiki.com.br/images/f/f0/Gut_Icon.gif',
  numb: 'https://www.tibiawiki.com.br/images/0/03/Numb_Icon.gif',
  scavenge: 'https://www.tibiawiki.com.br/images/5/5f/Scavenge_Icon.gif',
  'vampiric-embrace': 'https://www.tibiawiki.com.br/images/4/41/Vampiric_Embrace_Icon.gif',
  'void-s-call': 'https://www.tibiawiki.com.br/images/c/c6/Void%27s_Call_Icon.gif',
  'void-inversion': 'https://www.tibiawiki.com.br/images/7/79/Void_Inversion_Icon.gif',
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

  for (const [charmId, url] of Object.entries(CHARM_ICON_URLS)) {
    const outPath = path.join(OUT_DIR, `${charmId}.gif`);
    if (fs.existsSync(outPath)) continue; // já baixado numa execução anterior

    try {
      const res = await fetchWithRetry(url);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(outPath, buf);
      downloaded++;
      console.log(`[OK] ${charmId} (${buf.length} bytes)`);
    } catch (err) {
      misses.push(charmId);
      console.log(`[ERRO] ${charmId}: ${err.message}`);
    }

    await new Promise((r) => setTimeout(r, 120)); // educado com o servidor da wiki
  }

  console.log(`\nBaixados agora: ${downloaded}. Faltando: ${misses.length}.`);
  if (misses.length) {
    console.log('\nCharms sem imagem baixada (revisar manualmente):');
    misses.forEach((m) => console.log(' - ' + m));
  }
}

main();
