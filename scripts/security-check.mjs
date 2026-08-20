import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { sanitizeValue } from "./sanitize-report.mjs";

const result=spawnSync("npm",["audit","--omit=dev","--audit-level=high","--json"],{encoding:"utf8",maxBuffer:10*1024*1024});
let parsed=null;
try{parsed=JSON.parse(result.stdout||"{}");}catch{}

const counts=parsed?.metadata?.vulnerabilities||{};
const vulnerabilities=Object.entries(parsed?.vulnerabilities||{}).map(([name,detail])=>({
  package:name,
  severity:detail?.severity||"unknown",
  direct:Boolean(detail?.isDirect),
  range:detail?.range||null,
  fixAvailable:Boolean(detail?.fixAvailable)
}));
const scanError=!parsed||Boolean(parsed?.error);
const blocking=(Number(counts.high||0)+Number(counts.critical||0))>0;
const report=sanitizeValue({
  schemaVersion:1,
  kind:"security",
  environment:"homologacao",
  commit:process.env.GIT_SHA||process.env.GITHUB_SHA||null,
  runId:process.env.GITHUB_RUN_ID||null,
  createdAt:new Date().toISOString(),
  scanStatus:scanError?"ERROR":"SUCCESS",
  blocking,
  summary:{low:Number(counts.low||0),moderate:Number(counts.moderate||0),high:Number(counts.high||0),critical:Number(counts.critical||0),total:Number(counts.total||0)},
  vulnerabilities
});
await fs.mkdir("runtime-reports",{recursive:true});
await fs.writeFile("runtime-reports/latest-security.json",JSON.stringify(report,null,2));
if(scanError){console.error("npm audit não retornou JSON válido.");process.exit(2);}
if(blocking){console.error(`Vulnerabilidades bloqueantes: high=${report.summary.high} critical=${report.summary.critical}`);process.exit(1);}
console.log(`Security gate OK: high=${report.summary.high} critical=${report.summary.critical}`);
