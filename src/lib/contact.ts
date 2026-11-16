// Canais públicos de contato da OCTOPUS IA.
// Preencha WHATSAPP_NUMBER (só dígitos, com DDI 55 e DDD) quando o número da empresa existir.
export const CONTACT = {
  email: "contato@octopusia.org",
  privacyEmail: "privacidade@octopusia.org",
  whatsappNumber: "",
  legalName: "OCTOPUS IA SISTEMAS LTDA",
  cnpj: "",
  city: "Belo Horizonte · MG",
  site: "octopusia.org"
} as const;

export function whatsappLink(message = "Olá! Vim pelo site da OCTOPUS IA e quero conversar sobre um projeto.") {
  if (!CONTACT.whatsappNumber) return null;
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
