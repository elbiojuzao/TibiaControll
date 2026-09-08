/**
 * Ícones reais dos mods do Ateliê de Gemas (2026-09-05, pedido do usuário: "tem alguns
 * mods que tu não tem a imagem retire dessa print lembrando que este arco prata bronze e
 * dourado não vai utilizar na roda apenas o conteudo interno"). Não é código do
 * gitlab.com/klhio/tibia-wheel original.
 *
 * As imagens vêm direto do CDN oficial do jogo (`static.tibia.com`, o mesmo host que o
 * cliente/tibiapal.com usa), não de asset nenhum nosso: `icons-skillwheel-basicmods.png`
 * (49 ícones, 30x30 cada, em ordem == BASIC_MODS) e `icons-skillwheel-suprememods.png`
 * (94 ícones, 35x35 cada, em ordem == SUPREME_MODS). Cada sprite sheet já vem SEM o arco
 * prata/bronze/dourado (aquele arco é desenhado pela UI do jogo em cima do ícone, não faz
 * parte do sprite) — exatamente o "conteúdo interno" que o usuário pediu, então só
 * precisou fatiar a tira em PNGs individuais (ver
 * `scratch-tibia-wheel/gem-atelier/sprites/`), sem nenhum recorte/edição adicional.
 */
const basicModules = import.meta.glob<string>('/src/assets/gem-mod-icons/basic-*.png', {
  eager: true,
  import: 'default',
});

const supremeModules = import.meta.glob<string>('/src/assets/gem-mod-icons/supreme-*.png', {
  eager: true,
  import: 'default',
});

export function basicModIconUrl(modIndex: number): string | undefined {
  return basicModules[`/src/assets/gem-mod-icons/basic-${modIndex}.png`];
}

export function supremeModIconUrl(modIndex: number): string | undefined {
  return supremeModules[`/src/assets/gem-mod-icons/supreme-${modIndex}.png`];
}
