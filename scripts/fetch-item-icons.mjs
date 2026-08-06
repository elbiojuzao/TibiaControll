/**
 * Baixa os ícones dos itens (sprites do jogo) direto do TibiaWiki (tibia.fandom.com)
 * pra src/assets/item-icons/, gerando um manifest.json (nome do item -> arquivo local).
 *
 * Reusável: roda de novo a qualquer momento (ex: depois de adicionar itens novos em
 * boss-items-data.ts) — já baixados são pulados, e o manifest é atualizado incrementalmente.
 *
 * Uso: node scripts/fetch-item-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'src/services/lootdrop/boss-items-data.ts');
const OUT_DIR = path.join(ROOT, 'src/assets/item-icons');
const MANIFEST_FILE = path.join(OUT_DIR, 'manifest.json');

function extractItemNames(source) {
  const items = new Set();
  const blockRe = /:\s*\[([^\]]*)\]/g;
  let m;
  while ((m = blockRe.exec(source))) {
    const strRe = /'([^']+)'/g;
    let s;
    while ((s = strRe.exec(m[1]))) items.add(s[1]);
  }
  return Array.from(items);
}

function titleCase(name) {
  return name.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function safeFilename(name) {
  return name.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') + '.gif';
}

async function fetchWithRetry(url, options, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

async function fetchFileUrl(candidate) {
  const fileTitle = `File:${candidate.replace(/ /g, '_')}.gif`;
  const api = `https://tibia.fandom.com/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url&format=json`;
  const res = await fetchWithRetry(api);
  const json = await res.json();
  const page = Object.values(json.query?.pages ?? {})[0];
  return page?.imageinfo?.[0]?.url ?? null;
}

/** Nome mais próximo na wiki via busca full-text — usado quando o título exato não existe
 * (ex: nossa base tem "SoulCore Undertaker", a wiki chama a página de "Undertaker Soul Core"). */
async function searchClosestTitle(name) {
  const api = `https://tibia.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&srlimit=1&format=json`;
  const res = await fetchWithRetry(api);
  const json = await res.json();
  return json.query?.search?.[0]?.title ?? null;
}

async function lookupImageUrl(name) {
  for (const candidate of new Set([name, titleCase(name)])) {
    const url = await fetchFileUrl(candidate);
    if (url) return url;
  }
  const closest = await searchClosestTitle(name);
  if (closest) return fetchFileUrl(closest);
  return null;
}

async function main() {
  const source = fs.readFileSync(DATA_FILE, 'utf8');
  const items = extractItemNames(source);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const manifest = fs.existsSync(MANIFEST_FILE)
    ? JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'))
    : {};

  const misses = [];
  let downloaded = 0;

  for (const name of items) {
    const filename = safeFilename(name);
    const outPath = path.join(OUT_DIR, filename);

    if (manifest[name] && fs.existsSync(path.join(OUT_DIR, manifest[name]))) {
      continue; // já baixado numa execução anterior
    }

    try {
      const url = await lookupImageUrl(name);
      if (!url) {
        misses.push(name);
        console.log(`[MISS] ${name}`);
        continue;
      }

      const imgRes = await fetchWithRetry(url);
      const buf = Buffer.from(await imgRes.arrayBuffer());
      fs.writeFileSync(outPath, buf);
      manifest[name] = filename;
      downloaded++;
      console.log(`[OK] ${name} -> ${filename} (${buf.length} bytes)`);
      // salva o progresso a cada item — se a rede cair no meio, nada se perde
      fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2) + '\n');
    } catch (err) {
      misses.push(name);
      console.log(`[ERRO] ${name}: ${err.message}`);
    }

    await new Promise((r) => setTimeout(r, 120)); // educado com a API da Fandom
  }

  console.log(`\nBaixados agora: ${downloaded}. Total no manifest: ${Object.keys(manifest).length}. Faltando: ${misses.length}.`);
  if (misses.length) {
    console.log('\nItens sem imagem encontrada (revisar manualmente):');
    misses.forEach((m) => console.log(' - ' + m));
  }
}

main();
