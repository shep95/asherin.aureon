export const AGENTS=Object.freeze([
{id:'orchestrator',tasks:['schedule','triage','dependencies']},
{id:'api-research',tasks:['provider_spec','country_mapping']},
{id:'integration-engineer',tasks:['api_adapter','auth_flow']},
{id:'frontend-designer',tasks:['visual_review','ui_accessibility']},
{id:'quality-engineer',tasks:['unit_test','integration_test','security_review']},
{id:'deployment-engineer',tasks:['source_sync','deployment','smoke_test']},
{id:'search-engineer',tasks:['search_index','source_validation']},
{id:'terminal-engineer',tasks:['cloud_terminal','sandbox_isolation']}
]);
export function assignAgent(type){const a=AGENTS.find(x=>x.tasks.includes(type));if(!a)throw new Error('unassigned task type');return a.id}
export function verifyAgentReceipt(receipt){
 if(!AGENTS.some(x=>x.id===receipt?.agent))throw new Error('unknown agent');
 if(!receipt?.taskId)throw new Error('missing task');
 if(!['review_required','blocked','verified'].includes(receipt?.status))throw new Error('invalid receipt state');
 if(receipt.status==='verified'&&(!receipt.artifact||!receipt.verification))throw new Error('missing verification evidence');
 if(receipt.status!=='verified'&&!receipt.reason)throw new Error('missing blocker explanation');
 return true;
}
export function processInspections(catalog,inspection){
 if(catalog.apis.length!==inspection.providers.length)throw new Error('catalog is incomplete');
 const indexed=new Map(inspection.providers.map(p=>[p.provider,p]));
 if(indexed.size!==catalog.apis.length)throw new Error('duplicate providers');
 return catalog.apis.map(p=>{
  const x=indexed.get(p.id);if(!x)throw new Error('provider not inspected');
  const receipt={taskId:p.id,agent:assignAgent('provider_spec'),status:x.status==='codegen_unreviewed'?'review_required':'blocked',reason:x.status==='codegen_unreviewed'?'requires auth, tests, and release review':String(x.reason||'unverified specification')};
  verifyAgentReceipt(receipt);return receipt;
 });
}
