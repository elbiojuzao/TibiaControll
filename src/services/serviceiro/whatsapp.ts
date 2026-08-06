/** Monta o link do WhatsApp (wa.me exige só dígitos no telefone, com DDI) */
export function buildWhatsAppLink(phoneNumber: string, message: string): string {
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  const params = message.trim() ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digitsOnly}${params}`;
}
