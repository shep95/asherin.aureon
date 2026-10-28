// Convert discovered OpenAPI descriptions into per-provider operation manifests.
// Operation metadata is never an authenticated or production-ready integration.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {compileOperations} from './openapi-executor.mjs';
const source=JSON.parse(await readFile('integrations/data/discovery.json','utf8'));
const limit=Math.min(source.apis.length,Number(process.env.MAX_PROVIDERS||source.apis.length));
const work=source.apis.slice(0,limit);const results=new Array(work.length);let next=0;
const digest=s=>createHash('sha256').update(s).digest('hex');
async function inspect(item){
 const base={provider:item.id,status:'blocked',operations:[],reason:null,specSource:item.openApiUrl};
 if(!item.openApiUrl)return {...base,reason:'no specification URL'};
 let u;try{u=new URL(item.openApiUrl);if(u.protocol!=='https:'||u.hostname!=='api.apis.guru')throw Error('source outside trusted catalog')}catch(e){return {...base,reason:String(e.message)}}
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),11000);
 try{
  const r=await fetch(u,{signal:controller.signal,redirect:'error'});
  if(!r.ok)throw Error('http '+r.status);
  const raw=await r.text();if(raw.length>3_000_000)throw Error('spec too large');
  const spec=JSON.parse(raw);
  let ops=[];try{ops=compileOperations(spec)}catch(e){throw Error('review required: '+e.message)}
  if(!ops.length)throw Error('no supported operations');
  return {...base,status:'codegen_unreviewed',reason:null,sha256:digest(raw),operations:ops};
 }catch(e){return {...base,reason:String(e.message).slice(0,180)}}finally{clearTimeout(timeout)}
}
async function runWorker(){while(next<work.length){const index=next++;results[index]=await inspect(work[index])}}
await Promise.all(Array.from({length:Math.min(Number(process.env.WORKERS||20),work.length)},runWorker));
const summary={total:results.length,generated:results.filter(r=>r.status==='codegen_unreviewed').length,blocked:results.filter(r=>r.status!=='codegen_unreviewed').length,operations:results.reduce((s,r)=>s+r.operations.length,0)};
await mkdir('integrations/data',{recursive:true});
await writeFile('integrations/data/operation-manifests.json',JSON.stringify({generatedAt:new Date().toISOString(),summary,providers:results},null,2));
console.log(JSON.stringify(summary));
