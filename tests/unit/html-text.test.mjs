import test from "node:test";
import assert from "node:assert/strict";
import {decodeHtmlEntities,htmlToText} from "../../scripts/html-text.mjs";

test("decodes named and numeric HTML entities",()=>{
  assert.equal(decodeHtmlEntities("Documentos &amp; Engenharia"),"Documentos & Engenharia");
  assert.equal(decodeHtmlEntities("A&#38;B &#x26; C"),"A&B & C");
});

test("converts HTML source to normalized visible text",()=>{
  const html="<main><h3>Documentos &amp; Engenharia</h3><p>IA&nbsp;aplicada</p><script>ignore()</script></main>";
  assert.equal(htmlToText(html),"Documentos & Engenharia IA aplicada");
});
