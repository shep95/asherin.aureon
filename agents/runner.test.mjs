import test from 'node:test';
import assert from 'node:assert/strict';
import {AGENTS,assignAgent,verifyAgentReceipt,processInspections} from './runner.mjs';
test('eight defined routing agents',()=>{assert.equal(AGENTS.length,8);assert.equal(assignAgent('visual_review'),'frontend-designer');});
test('unknown jobs require explicit assignment',()=>assert.throws(()=>assignAgent('other'),/unassigned/));
test('receipts reject false verification',()=>assert.throws(()=>verifyAgentReceipt({agent:'quality-engineer',taskId:'x',status:'verified'}),/missing verification/));
test('all discovered providers receive an explicit work receipt',()=>{const result=processInspections({apis:[{id:'a'},{id:'b'}]},{providers:[{provider:'a',status:'codegen_unreviewed'},{provider:'b',status:'blocked',reason:'not found'}]});assert.equal(result.length,2);assert.equal(result[0].status,'review_required');assert.equal(result[1].status,'blocked');});
test('partial inspection and duplicate inspection fail closed',()=>{assert.throws(()=>processInspections({apis:[{id:'a'},{id:'b'}]},{providers:[{provider:'a'}]}));assert.throws(()=>processInspections({apis:[{id:'a'},{id:'b'}]},{providers:[{provider:'a'},{provider:'a'}]}));});
