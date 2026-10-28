// Run a real model call for one bounded backlog assignment.
// The GitHub Actions GITHUB_TOKEN is used for GitHub Models inference only.
// This worker saves proposals as artifacts, never executes model-generated commands.
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {runAgent} from './llm-worker.mjs';
const ROLE=process.env.AUREON_ROLE||'research';
const TASK=process.env.AUREON_TASK||'Investigate one blocked provider specification and identify next verifiable implementation step.';
const MODEL=process.env.AUREON_LLM_MODEL||'openai/gpt-4.1';
const KEY=process.env.AUREON_LLM_API_KEY||process.env.GITHUB_TOKEN;
const ENDPOINT=process.env.AUREON_LLM_ENDPOINT||'https://models.github.ai/inference/chat/completions';
if(!KEY)throw new Error('No model credentials available. Cannot run AI worker.');
const report=await runAgent({role:ROLE,task:TASK,context:'Repository: shep95/asherin.aureon. This worker can propose code and tests, but does not self-certify or deploy.',model:MODEL,apiKey:KEY,endpoint:ENDPOINT});
await mkdir('agent-results',{recursive:true});
const output={createdAt:new Date().toISOString(),role:ROLE,task:TASK,...report};
await writeFile('agent-results/latest.json',JSON.stringify(output,null,2));
console.log(JSON.stringify({role:ROLE,status:output.status,actions:output.actions.length,tests:output.tests.length,blockers:output.blockers.length}));
