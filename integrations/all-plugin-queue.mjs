// Build a complete, deterministic work queue for EVERY discovered API.
// This is task orchestration data, not a claim of automatically deployed plugins.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
export const STAGES=Object.freeze(['research','plan','optimize_plan','implement','unit_test','integration_test','narrative_review','narrative_patch_plan','patch','regression_test','visual_qa','security_qa','release_review']);
export function makeQueue({apis,countries}){
 if(!Array.isArray(apis)||!Array.isArray(countries))throw new TypeError('discovery arrays required');
 const seen=new Set();
 return {schemaVersion:1,generatedAt:new Date().toISOString(),countriesIndexed:countries.length,total:apis.length,tasks:apis.map((a,i)=>{
  if(!a?.id||seen.has(a.id))throw new Error('missing or duplicate API id '+a?.id);
  seen.add(a.id);
  return {id:a.id,ordinal:i+1,name:a.name,openApiUrl:a.openApiUrl??null,countryCoverage:'unverified',auth:'unverified',state:'pending_research',iteration:0,stages:STAGES.map((stage,j)=>({stage,state:j===0?'ready':'blocked',evidence:null})),release:{state:'blocked',reason:'requires verified provider integration and authorization'}};
 })};
}
export function advanceTask(task,stage,evidence){
 if(!evidence||typeof evidence!=='object'||!evidence.artifact||!evidence.verification)throw new Error('verifiable evidence required');
 const i=task.stages.findIndex(x=>x.stage===stage);if(i<0)throw new Error('unknown stage');
 if(task.stages[i].state!=='ready')throw new Error('stage not ready');
 task.stages[i]={stage,state:'verified',evidence};
 if(i+1<task.stages.length)task.stages[i+1].state='ready';
 else task.state='awaiting_release_authorization';
 return task;
}
export async function main(path='integrations/data/discovery.json'){
 const discovery=JSON.parse(await readFile(path,'utf8'));
 const queue=makeQueue(discovery);
 await mkdir('integrations/data',{recursive:true});
 await writeFile('integrations/data/all-plugin-tasks.json',JSON.stringify(queue,null,2));
 console.log(JSON.stringify({total:queue.total,countries:queue.countriesIndexed,ready:queue.tasks.filter(t=>t.state==='pending_research').length,completed:0}));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])main().catch(e=>{console.error(e);process.exitCode=1});
