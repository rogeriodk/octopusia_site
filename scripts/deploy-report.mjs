import fs from "node:fs/promises";
import { sanitizeValue } from "./sanitize-report.mjs";

const names=["config","trigger","health","smoke","regression"];
const cases=names.map(name=>({name,status:(process.env[`STEP_${name.toUpperCase()}`]||"skipped").toUpperCase()}));
let observation=null;
try{observation=JSON.parse(await fs.readFile("runtime-reports/health-observation.json","utf8"));}catch{}

const baseUrl=process.env.HOMOLOG_BASE_URL||null;
const configStatus=cases.find(x=>x.name==="config")?.status;
let diagnosis="OK";
if(configStatus!=="SUCCESS"){
  diagnosis=baseUrl?"MISSING_EASYPANEL_DEPLOY_URL":"MISSING_HOMOLOG_BASE_URL";
}else if(cases.find(x=>x.name==="trigger")?.status!=="SUCCESS") diagnosis="DEPLOY_TRIGGER";
else if(cases.find(x=>x.name==="health")?.status!=="SUCCESS"){
  if(!observation?.reachable) diagnosis="HEALTH_ENDPOINT_UNREACHABLE";
  else if(observation?.service && observation.service!=="octopus-ia-site") diagnosis="SERVICE_MISMATCH";
  else if(observation?.commit && observation.commit!==process.env.EXPECTED_GIT_SHA) diagnosis="REVISION_MISMATCH";
  else diagnosis="HEALTH_CHECK_FAILED";
}else if(cases.find(x=>x.name==="smoke")?.status!=="SUCCESS") diagnosis="SMOKE_TEST_FAILURE";
else if(cases.find(x=>x.name==="regression")?.status!=="SUCCESS") diagnosis="REGRESSION_FAILURE";

const report=sanitizeValue({
  schemaVersion:1,
  kind:"deploy",
  environment:"homologacao",
  commit:process.env.EXPECTED_GIT_SHA||null,
  runId:process.env.GITHUB_RUN_ID||null,
  baseUrl,
  configuration:{homologBaseUrlPresent:Boolean(baseUrl)},
  createdAt:new Date().toISOString(),
  diagnosis,
  summary:{
    total:cases.length,
    passed:cases.filter(x=>x.status==="SUCCESS").length,
    failed:cases.filter(x=>x.status==="FAILURE").length,
    warned:cases.filter(x=>x.status==="SKIPPED").length
  },
  cases,
  healthObservation:observation
});
await fs.mkdir("runtime-reports",{recursive:true});
await fs.writeFile("runtime-reports/latest-deploy.json",JSON.stringify(report,null,2));
