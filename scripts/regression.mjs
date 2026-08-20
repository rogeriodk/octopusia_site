import fs from "node:fs/promises";
import {sanitizeValue} from "./sanitize-report.mjs";
import {htmlToText} from "./html-text.mjs";

const baseUrl=process.env.HOMOLOG_BASE_URL;
const expectedSha=process.env.EXPECTED_GIT_SHA||null;
if(!baseUrl) throw new Error("HOMOLOG_BASE_URL não configurada.");

const started=Date.now();
const scenarios=[
  {name:"hero",contains:["IA que entende","Soluções que"]},
  {name:"solutions",contains:["IA Jurídica","Documentos & Engenharia"]},
  {
    name:"interactive-area",
    contains:["Área de IA Interativa"],
    testIds:["ai-interactive","ai-quick-prompts","ai-input-form"]
  }
];
const cases=[];

for(const scenario of scenarios){
  const t=Date.now();
  try{
    const response=await fetch(new URL("/",baseUrl),{signal:AbortSignal.timeout(10000)});
    const rawBody=await response.text();
    const visibleText=htmlToText(rawBody);
    const missingContent=(scenario.contains||[]).filter(expected=>!visibleText.includes(expected));
    const missingTestIds=(scenario.testIds||[]).filter(testId=>!rawBody.includes(`data-testid="${testId}"`));
    const warnings=[
      ...missingContent.map(value=>`Conteúdo ausente: ${value}`),
      ...missingTestIds.map(value=>`Contrato funcional ausente: ${value}`)
    ];
    cases.push({
      name:scenario.name,
      path:"/",
      durationMs:Date.now()-t,
      status:response.ok&&!warnings.length?"PASS":"FAIL",
      warnings
    });
  }catch(error){
    cases.push({name:scenario.name,path:"/",durationMs:Date.now()-t,status:"FAIL",error:String(error)});
  }
}

const failed=cases.filter(x=>x.status==="FAIL").length;
const report=sanitizeValue({
  schemaVersion:1,
  kind:"regression",
  environment:"homologacao",
  commit:expectedSha,
  startedAt:new Date(started).toISOString(),
  finishedAt:new Date().toISOString(),
  durationMs:Date.now()-started,
  summary:{total:cases.length,passed:cases.length-failed,failed,warned:0},
  cases
});
await fs.mkdir("runtime-reports",{recursive:true});
await fs.writeFile("runtime-reports/latest-regression.json",JSON.stringify(report,null,2));
if(failed) process.exit(1);
