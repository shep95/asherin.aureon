// Reconcile a full provider catalog with actually inspected operation manifests.
// Produces durable state; does not elevate generated operations to completed connectors.
import {readFile} from 'node:fs/promises';
import {createLedger,writeCheckpoint,status} from './durable-controller.mjs';
import {fileURLToPath} from 'node:url';
export function reconcile(catalog,manifests){
 const ledger=createLedger(catalog);
 const map=new Map((manifests.providers||[]).map(m=>[m.provider,m]));
 for(const task of ledger.tasks){
  const inspected=map.get(task.id);
  if(!inspected){task.state='blocked';task.reason='provider not present in inspection';continue}
  if(inspected.status==='codegen_unreviewed'){
   task.state='review_required';
   task.reason='operation codegen requires auth, operation-by-operation review, tests and release';
   task.research={status:'spec_parsed',specSource:inspected.specSource,sha256:inspected.sha256,operationCount:inspected.operations.length};
  }else{
   task.state='blocked';
   task.reason=inspected.reason||'API specification unavailable or unsupported';
   task.research={status:'blocked',specSource:inspected.specSource};
  }
 }
 ledger.revision++;
 return ledger;
}
export async function main(){
 const [catalog,manifest]=await Promise.all(['integrations/data/discovery.json','integrations/data/operation-manifests.json'].map(async p=>JSON.parse(await readFile(p,'utf8'))));
 if(catalog.apis.length!==manifest.providers.length)throw new Error('incomplete provider inspection: refuse silent truncation');
 const ledger=reconcile(catalog,manifest);
 const path='integrations/data/provider-ledger.json';
 await writeCheckpoint(path,ledger);
 console.log(JSON.stringify({...status(ledger),path}));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])main().catch(e=>{console.error(e);process.exitCode=1});
