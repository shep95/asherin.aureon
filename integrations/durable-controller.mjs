// Durable, bounded worker state machine for provider research.
// It does not claim to produce authenticated connectors, autonomous AI decisions, or completed releases.
import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
import {evaluateCompletion} from './completion-gate.mjs';

export const STATES=Object.freeze(['pending','running','retryable','blocked','review_required','verified_complete']);
const safeInteger=(x,fallback)=>Number.isSafeInteger(x)&&x>=0?x:fallback;
export function createLedger(catalog) {
 if(!catalog||!Array.isArray(catalog.apis))throw new TypeError('catalog.apis required');
 const ids=new Set();
 return {schemaVersion:1,revision:0,createdAt:new Date().toISOString(),tasks:catalog.apis.map(api=>{
  if(typeof api.id!=='string'||!api.id||ids.has(api.id))throw new Error('invalid or duplicate provider');
  ids.add(api.id);
  return {id:api.id,state:'pending',attempts:0,nextAttemptAt:null,reason:null,history:[],review:{approved:false},release:{state:'blocked'},stages:[]};
 })};
}
export function applyEvent(ledger,id,event,now=new Date().toISOString()){
 const t=ledger.tasks.find(x=>x.id===id);if(!t)throw new Error('unknown task');
 if(!['started','retry','blocked','review','complete'].includes(event.type))throw new Error('invalid event');
 if(event.type==='started'){
  if(!['pending','retryable'].includes(t.state))throw new Error('invalid start transition');
  if(t.nextAttemptAt&&t.nextAttemptAt>now)throw new Error('retry not due');
  t.state='running';t.attempts++;t.reason=null;
 } else {
  if(t.state!=='running'&&event.type!=='complete')throw new Error('task not running');
  if(event.type==='complete'){
   if(!evaluateCompletion(t).complete)throw new Error('COMPLETION_BLOCKED: unverified stages or release');
   t.state='verified_complete';
  }else if(event.type==='retry'){
   const seconds=safeInteger(event.delaySeconds,0);
   if(seconds>3600)throw new Error('invalid retry delay');
   t.state='retryable';t.nextAttemptAt=new Date(Date.parse(now)+seconds*1000).toISOString();t.reason=String(event.reason||'retry requested').slice(0,300);
  }else if(event.type==='blocked'){
   t.state='blocked';t.reason=String(event.reason||'requires investigation').slice(0,300);
  }else {
   t.state='review_required';t.reason=String(event.reason||'manual review required').slice(0,300);
  }
 }
 t.history.push({type:event.type,at:now,reason:t.reason});
 if(t.history.length>30)t.history.shift();
 ledger.revision++;
 return t;
}
export function eligibleTasks(ledger,now=new Date().toISOString(),limit=10){
 return ledger.tasks.filter(t=>t.state==='pending'||(t.state==='retryable'&&(!t.nextAttemptAt||t.nextAttemptAt<=now))).slice(0,limit);
}
export function status(ledger){
 const states=Object.fromEntries(STATES.map(x=>[x,0]));
 for(const task of ledger.tasks){if(!(task.state in states))throw new Error('unknown state '+task.state);states[task.state]++}
 return {total:ledger.tasks.length,revision:ledger.revision,states};
}
export async function writeCheckpoint(path,ledger){
 await mkdir(dirname(path),{recursive:true});
 const temp=path+'.'+randomUUID()+'.tmp';
 await writeFile(temp,JSON.stringify(ledger,null,2),'utf8');
 await rename(temp,path);
}
export async function loadCheckpoint(path){const ledger=JSON.parse(await readFile(path,'utf8'));if(!Array.isArray(ledger.tasks))throw new Error('invalid checkpoint');return ledger}
export function recoverInterrupted(ledger){
 for(const task of ledger.tasks)if(task.state==='running'){task.state='retryable';task.nextAttemptAt=null;task.reason='interrupted execution; requires recheck';task.history.push({type:'recovered',at:new Date().toISOString()});ledger.revision++}
 return ledger;
}
