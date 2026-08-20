const namedEntities={amp:"&",quot:'"',apos:"'",lt:"<",gt:">",nbsp:" "};

export function decodeHtmlEntities(value){
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi,(_,hex)=>String.fromCodePoint(Number.parseInt(hex,16)))
    .replace(/&#(\d+);/g,(_,decimal)=>String.fromCodePoint(Number.parseInt(decimal,10)))
    .replace(/&(amp|quot|apos|lt|gt|nbsp);/gi,(_,name)=>namedEntities[name.toLowerCase()]??_);
}

export function htmlToText(html){
  const withoutExecutable=String(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ")
    .replace(/<[^>]+>/g," ");
  return decodeHtmlEntities(withoutExecutable).replace(/\s+/g," ").trim();
}
