const SAVED_EMAIL_KEY = 'tibia-pts:saved-login-email-v1';

/** Lembrar o e-mail no login é conveniência (2026-08-26, pedido do usuário). A SENHA não
 * entra aqui (2026-08-27, revisão de segurança do próprio usuário): localStorage é texto
 * puro, legível por qualquer script que rode na página (ex: uma dependência comprometida),
 * e não tem como ser revogado como uma sessão pode. A senha fica pro que já existe de mais
 * seguro pra isso: 1) o gerenciador de senha do NAVEGADOR (autoComplete="current-password"
 * deixa Chrome/Firefox/Edge oferecerem salvar/preencher — fora do alcance do JS da página);
 * 2) a sessão do Supabase Auth, persistida sozinha (createClient() usa persistSession:true
 * por padrão, ver supabase-client.ts) — quem já logou uma vez nem volta a ver a tela de
 * login até fazer logout ou o token expirar. */
export function readSavedEmail(): string | null {
  try {
    return localStorage.getItem(SAVED_EMAIL_KEY);
  } catch {
    return null;
  }
}

export function writeSavedEmail(email: string | null): void {
  try {
    if (email) localStorage.setItem(SAVED_EMAIL_KEY, email);
    else localStorage.removeItem(SAVED_EMAIL_KEY);
  } catch {
    // localStorage indisponível — segue sem persistir.
  }
}

const OLD_SAVED_LOGIN_KEY = 'tibia-pts:saved-login-v1';

/** Migração 1x (2026-08-27) — a versão anterior salvava e-mail+senha em texto puro sob essa
 * chave. Remove qualquer vestígio dela do localStorage de quem usou o "Salvar login" antes
 * do fix de segurança, migrando só o e-mail (não sensível) pra chave nova. Roda 1x no
 * carregamento do módulo, não a cada render. */
(function migrateOldSavedLogin() {
  try {
    const raw = localStorage.getItem(OLD_SAVED_LOGIN_KEY);
    if (!raw) return;
    localStorage.removeItem(OLD_SAVED_LOGIN_KEY);
    const parsed = JSON.parse(raw) as { email?: string };
    if (parsed.email && !localStorage.getItem(SAVED_EMAIL_KEY)) {
      localStorage.setItem(SAVED_EMAIL_KEY, parsed.email);
    }
  } catch {
    // localStorage indisponível ou dado corrompido — nada a fazer.
  }
})();
