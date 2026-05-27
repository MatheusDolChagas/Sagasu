/** Validação de email alinhada ao uso em formulários (RFC simplificado). */
export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function isValidEmail(value: string): boolean {
  const s = value.trim();
  if (s.length === 0) return false;
  return EMAIL_REGEX.test(s);
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
