const email=/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const cpf=/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const phone=/(?<!\d)(?:\+?55[\s.-]?)?(?:\(?\d{2}\)?[\s.-]?)?\d{4,5}[\s.-]?\d{4}(?!\d)/g;
const bearer=/\bBearer\s+[A-Za-z0-9._~+\/=\-]+/gi;
const apiKey=/\b(sk-[A-Za-z0-9_-]{10,}|gh[pousr]_[A-Za-z0-9_]{10,})\b/g;
export function sanitizeText(value){return String(value).replace(email,"[REDACTED_EMAIL]").replace(cpf,"[REDACTED_CPF]").replace(phone,"[REDACTED_PHONE]").replace(bearer,"Bearer [REDACTED_TOKEN]").replace(apiKey,"[REDACTED_TOKEN]");}
export function sanitizeValue(value){if(typeof value==="string")return sanitizeText(value);if(Array.isArray(value))return value.map(sanitizeValue);if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).map(([key,entry])=>[/token|secret|password|authorization|cookie|api[_-]?key/i.test(key)?key:key,/token|secret|password|authorization|cookie|api[_-]?key/i.test(key)?"[REDACTED]":sanitizeValue(entry)]));return value;}
