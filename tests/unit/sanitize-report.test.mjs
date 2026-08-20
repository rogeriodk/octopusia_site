import test from "node:test";
import assert from "node:assert/strict";
import {sanitizeValue} from "../../scripts/sanitize-report.mjs";

test("sanitizer removes personal and secret values",()=>{
  const x=sanitizeValue({
    email:"pessoa@empresa.com.br",
    text:"CPF 123.456.789-10 telefone (31) 99884-5570",
    authorization:"Bearer abcdef123456",
    nested:{api_key:"sk-abcdefghijklmnopqrstuvwxyz"}
  });
  assert.equal(x.email,"[REDACTED_EMAIL]");
  assert.match(x.text,/\[REDACTED_CPF\]/);
  assert.match(x.text,/\[REDACTED_PHONE\]/);
  assert.equal(x.authorization,"[REDACTED]");
  assert.equal(x.nested.api_key,"[REDACTED]");
});

test("sanitizer preserves non-sensitive technical identifiers",()=>{
  const commit="abeaf47461302cafe2239733da83cb06378c5c7a";
  const x=sanitizeValue({commit,runId:"17345678910",applicationVersion:"0.1.0",message:"telefone (31) 99884-5570"});
  assert.equal(x.commit,commit);
  assert.equal(x.runId,"17345678910");
  assert.equal(x.applicationVersion,"0.1.0");
  assert.match(x.message,/\[REDACTED_PHONE\]/);
});
