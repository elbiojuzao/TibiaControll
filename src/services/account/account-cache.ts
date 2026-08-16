import type { Account } from '@/types';

const STORAGE_KEY = 'tibia-pts:account-cache-v1';
const EVENT_NAME = 'tibia-pts:account-updated';

/** Cache local da conta (nome da party etc.) — pedido do usuário em 2026-08-16: editar o
 * nome da party em Configurações precisa refletir em qualquer lugar do app que já
 * mostra o nome (ex: topbar em AppLayout.tsx) sem precisar de F5. localStorage guarda o
 * último valor conhecido (evita flash do nome antigo ao trocar de página) e um evento
 * customizado (`window.dispatchEvent`) avisa outras instâncias de useAccount() montadas
 * na MESMA aba — o evento nativo `storage` do navegador só dispara em OUTRAS abas, não
 * serve pra isso sozinho. */
export function readCachedAccount(): Account | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Account) : null;
  } catch {
    return null;
  }
}

export function writeCachedAccount(account: Account): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
  } catch {
    // localStorage indisponível (modo privado, quota) — não é crítico, só perde o cache
  }
  window.dispatchEvent(new CustomEvent<Account>(EVENT_NAME, { detail: account }));
}

/** Chamar dentro de um useEffect; retorna a função de cleanup. */
export function onAccountCacheUpdate(callback: (account: Account) => void): () => void {
  const handler = (e: Event) => callback((e as CustomEvent<Account>).detail);
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
