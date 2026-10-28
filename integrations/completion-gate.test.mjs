import test from 'node:test';import assert from 'node:assert/strict';import {REQUIRED_STAGES,evaluateCompletion,enforceTaskCompletion,enforceBatchCompletion,pendingWork} from './completion-gate.mjs';
const evidence={artifact:'build/verified.json',verification:'run-123'};
const full=()=>({id:'provider-a',stages:REQUIRED_STAGES.map(stage=>({stage,state:'verified',evidence:{...evidence}})),release:{state:'verified',evidence:{...evidence}}});
test('missing evidence rejects completion',()=>{const task=full();task.stages[3].evidence=null;assert.equal(evaluateCompletion(task).complete,false);assert.throws(()=>enforceTaskCompletion(task),/COMPLETION_BLOCKED/)});
test('generated operation manifests cannot pass',()=>{const task={id:'provider-a',stages:[{stage:'implement',state:'verified',evidence}],release:{state:'blocked'}};assert.equal(evaluateCompletion(task).complete,false)});
test('all stages and release evidence permit completion',()=>{assert.equal(enforceTaskCompletion(full()).state,'completed')});
test('cannot claim batch completed if any one provider is incomplete',()=>{const a=full(),b=full();b.id='provider-b';b.stages[5].state='blocked';const queue={total:2,tasks:[a,b]};assert.throws(()=>enforceBatchCompletion(queue),/COMPLETION_BLOCKED/);assert.equal(pendingWork(queue).length,1)});
test('batch counts and duplicate identities fail closed',()=>{assert.throws(()=>enforceBatchCompletion({total:2,tasks:[full()]}),/COMPLETION_BLOCKED/);assert.throws(()=>enforceBatchCompletion({total:2,tasks:[full(),full()]}),/COMPLETION_BLOCKED/)});
