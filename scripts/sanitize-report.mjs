const email=/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const cpf=/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const phone=/(?<!\d)(?:\+?55[\s.-]?)?(?:\(?\d{2}\)?[\s.-]?)?\d{4,5}[\s.-]?\d{4}(?!\d)/g;
const bearer=/\bBearer\s+[A-Za-z0-9._~+\/=\-]+/gi;
const apiKey=/\b(sk-[A-Za-z0-9_-]{10,}|gh[pousr]_[A-Za-z0-9_]{10,})\b/g;
const sensitiveKey=/token|secret|password|authorization|cookie|api[_-]?key/i;
const safeIdentifierKey=/^(commit|sha|runId|applicationVersion|version|httpCode|service|environment|kind|status)$/i;

export function sanitizeText(value){
  return String(value)
    .replace(email,"[REDACTED_EMAIL]")
    .replace(cpf,"[REDACTED_CPF]")
    .replace(phone,"[REDACTED_PHONE]")
    .replace(bearer,"Bearer [REDACTED_TOKEN]")
    .replace(apiKey,"[REDACTED_TOKEN]");
}

export function sanitizeValue(value,key=""){
  if(sensitiveKey.test(key)) return "[REDACTED]";
  if(typeof value==="string"){
    if(safeIdentifierKey.test(key)) return value;
    return sanitizeText(value);
  }
  if(Array.isArray(value)) return value.map(entry=>sanitizeValue(entry,key));
  if(value&&typeof value==="object"){
    return Object.fromEntries(Object.entries(value).map(([entryKey,entry])=>[entryKey,sanitizeValue(entry,entryKey)]));
  }
  return value;
}
