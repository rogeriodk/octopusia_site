import fs from "node:fs/promises";
import {sanitizeValue} from "./sanitize-report.mjs";

const baseUrl=process.env.HOMOLOG_BASE_URL;
const expectedSha=process.env.EXPECTED_GIT_SHA||null;
if(!baseUrl) throw new Error("HOMOLOG_BASE_URL não configurada.");

const started=Date.now();
const cases=[];

async function run(name,path,validate){
  const start=Date.now();
  try{
    const response=await fetch(new URL(path,baseUrl),{signal:AbortSignal.timeout(8000),cache:"no-store"});
    const body=await response.text();
    cases.push({name,path,durationMs:Date.now()-start,status:validate(response,body)?"PASS":"FAIL"});
  }catch(error){
    cases.push({name,path,durationMs:Date.now()-start,status:"FAIL",error:String(error)});
  }
}

await run("health","/health",(response,body)=>{
  if(!response.ok) return false;
  const payload=JSON.parse(body);
  return payload.ok&&payload.service==="octopus-ia-site"&&(!expectedSha||payload.commit===expectedSha);
});

await run("home","/",(response,body)=>response.ok&&body.includes("IA que entende")&&body.includes("OCTOPUS IA"));

await run("ai-readiness","/api/ai",(response,body)=>{
  if(!response.ok) return false;
  const payload=JSON.parse(body);
  return payload.ok===true&&typeof payload.configured==="boolean"&&typeof payload.model==="string";
});

const failed=cases.filter(x=>x.status==="FAIL").length;
const report=sanitizeValue({
  schemaVersion:1,
  kind:"smoke",
  environment:"homologacao",
  commit:expectedSha,
  baseUrl,
  startedAt:new Date(started).toISOString(),
  finishedAt:new Date().toISOString(),
  durationMs:Date.now()-started,
  summary:{total:cases.length,passed:cases.length-failed,failed,warned:0},
  cases
});
await fs.mkdir("runtime-reports",{recursive:true});
await fs.writeFile("runtime-reports/latest-smoke.json",JSON.stringify(report,null,2));
if(failed) process.exit(1);
