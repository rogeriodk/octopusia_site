import fs from "node:fs/promises";
import { sanitizeValue } from "./sanitize-report.mjs";
const names=["install","typecheck","lint","unit","build","security","docker"];
const cases=names.map(name=>({name,status:(process.env[`STEP_${name.toUpperCase()}`]||"skipped").toUpperCase()}));
const report=sanitizeValue({schemaVersion:1,kind:"ci",environment:"homologacao",commit:process.env.GIT_SHA||null,runId:process.env.GITHUB_RUN_ID||null,applicationVersion:"0.1.0",createdAt:new Date().toISOString(),summary:{total:cases.length,passed:cases.filter(x=>x.status==="SUCCESS").length,failed:cases.filter(x=>x.status==="FAILURE").length,warned:cases.filter(x=>x.status==="SKIPPED").length},cases});
await fs.mkdir("runtime-reports",{recursive:true});await fs.writeFile("runtime-reports/latest-ci.json",JSON.stringify(report,null,2));
