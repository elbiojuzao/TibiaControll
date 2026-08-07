/** Helpers compartilhados entre os leitores de abas da planilha do usuário
 * (xp-sheet.ts, boss-hunt-sheet.ts) — parser de CSV e de número no formato
 * usado nas planilhas dele ("+004.682.898" / "-449.889.808"). */

/** Parser CSV simples, mas correto pra campos entre aspas (padrão de export do Google Sheets) */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

/** "077.648.574" -> 77648574 ; "-449.889.808" -> -449889808 */
export function parseBrNumber(raw: string): number {
  const cleaned = (raw ?? '').trim().replace(/\./g, '');
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
}
