// Aureon completion gate. Fail closed: only evidence-backed completed stages count.
export const REQUIRED_STAGES=Object.freeze(['research','plan','optimize_plan','implement','unit_test','integration_test','narrative_review','narrative_patch_plan','patch','regression_test','visual_qa','security_qa','release_review']);
const proof=x=>!!x&&typeof x==='object'&&typeof x.artifact==='string'&&x.artifact.trim().length>0&&typeof x.verification==='string'&&x.verification.trim().length>0;
export function evaluateCompletion(task){
 if(!task||!Array.isArray(task.stages)||!task.release)return {complete:false,reason:'missing task or stage ledger'};
 for(const stage of REQUIRED_STAGES){
  const matches=task.stages.filter(s=>s.stage===stage);
  if(matches.length!==1)return {complete:false,reason:'missing or duplicate stage: '+stage};
  if(matches[0].state!=='verified'||!proof(matches[0].evidence))return {complete:false,reason:'unverified stage: '+stage};
 }
 if(task.release.state!=='verified'||!proof(task.release.evidence))return {complete:false,reason:'release lacks verification'};
 return {complete:true,reason:'all evidence gates verified'};
}
export function enforceTaskCompletion(task){
 const result=evaluateCompletion(task);
 if(!result.complete)throw new Error('COMPLETION_BLOCKED: '+result.reason);
 return Object.freeze({...task,state:'completed'});
}
export function enforceBatchCompletion(queue){
 if(!queue||!Array.isArray(queue.tasks)||!Number.isSafeInteger(queue.total)||queue.tasks.length!==queue.total)throw new Error('COMPLETION_BLOCKED: invalid or incomplete queue');
 const seen=new Set();
 for(const task of queue.tasks){
  if(!task.id||seen.has(task.id))throw new Error('COMPLETION_BLOCKED: duplicate or missing task identity');
  seen.add(task.id);
  enforceTaskCompletion(task);
 }
 return {complete:true,total:queue.total,verified:seen.size};
}
export function pendingWork(queue){
 if(!queue?.tasks)return [];
 return queue.tasks.filter(t=>!evaluateCompletion(t).complete).map(t=>({id:t.id,reason:evaluateCompletion(t).reason}));
}
