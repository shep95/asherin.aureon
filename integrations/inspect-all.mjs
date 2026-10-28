// Batch inspection of all API candidates, with bounded network activity and auditable outcomes.
// Catalog metadata is not a working integration; this runner never labels it complete.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const q=JSON.parse(await readFile('integrations/data/all-plugin-tasks.json','utf8'));
const concurrency=Number(process.env.WORKERS||8), max=Number(process.env.MAX_API_INSPECTIONS||q.tasks.length);
const result=Array(Math.min(q.tasks.length,max)); let cursor=0;
function digest(value){return createHash('sha256').update(JSON.stringify(value)).digest('hex')}
async function inspect(task){
 const base={id:task.id,source:task.openApiUrl,checkedAt:new Date().toISOString(),state:'blocked',operations:0,reason:null};
 if(!task.openApiUrl){base.reason='no discoverable OpenAPI document';return base}
 try{
  const u=new URL(task.openApiUrl);if(u.protocol!=='https:'||u.username||u.password)throw Error('untrusted specification URL');
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),7000);
  try{
   const res=await fetch(u,{signal:controller.signal,headers:{accept:'application/json, application/yaml, text/yaml'}});
   if(!res.ok)throw Error('http '+res.status);
   const declaredLength=Number(res.headers.get('content-length')||0);if(declaredLength>3_000_000)throw Error('specification too large');
   const body=await res.text();if(body.length>3_000_000)throw Error('specification too large');
   let spec;try{spec=JSON.parse(body)}catch{throw Error('non-JSON OpenAPI document requires YAML parser')}
   if(!spec.openapi&&!spec.swagger)throw Error('not an OpenAPI document');
   const routes=Object.values(spec.paths||{});const methods=new Set(['get','post','put','patch','delete','head','options','trace']);
   const count=routes.reduce((n,route)=>n+Object.keys(route||{}).filter(k=>methods.has(k)).length,0);
   if(!count)throw Error('no operations');
   return {...base,state:'spec_inspected_not_connected',reason:null,operations:count,specVersion:spec.openapi||spec.swagger,sha256:digest(spec)};
  }finally{clearTimeout(timer)}
 }catch(e){return {...base,reason:String(e.message).slice(0,140)}}
}
async function work(){while(cursor<result.length){const i=cursor++;result[i]=await inspect(q.tasks[i])}}
await Promise.all(Array.from({length:Math.min(concurrency,result.length)},work));
const summary=result.reduce((a,x)=>(a[x.state]=(a[x.state]||0)+1,a),{});
await mkdir('integrations/data',{recursive:true});
await writeFile('integrations/data/spec-inspection.json',JSON.stringify({createdAt:new Date().toISOString(),total:result.length,summary,results:result},null,2));
console.log(JSON.stringify({total:result.length,summary,samples:result.slice(0,4)}));
