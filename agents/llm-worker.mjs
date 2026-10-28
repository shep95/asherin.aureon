// Server-side LLM agent execution with strict, reviewable JSON receipts.
// Never execute model-generated shell commands or publish output automatically.
const types=new Set(['research','planning','implementation','design','quality','deployment']);
export function buildAgentRequest({role,task,context=''}) {
 if(!types.has(role))throw new Error('unsupported role');
 if(typeof task!=='string'||!task.trim()||task.length>20000)throw new Error('invalid task');
 if(typeof context!=='string'||context.length>60000)throw new Error('invalid context');
 return [{role:'system',content:'You are an Aureon '+role+' worker. Preserve exact user scope. Respond ONLY as a JSON object with keys summary, actions, tests, blockers. actions are recommendations or patches to review, NEVER claims of execution. Never claim completion without observed tool evidence. Do not output secrets.'},{role:'user',content:JSON.stringify({task,context})}];
}
export function parseAgentResponse(value){
 let r;try{r=JSON.parse(value)}catch{throw new Error('invalid structured model response')}
 if(!r||typeof r.summary!=='string'||!Array.isArray(r.actions)||!Array.isArray(r.tests)||!Array.isArray(r.blockers))throw new Error('invalid agent schema');
 if([...r.actions,...r.tests,...r.blockers].some(x=>typeof x!=='string'))throw new Error('invalid agent entries');
 return {summary:r.summary,actions:r.actions,tests:r.tests,blockers:r.blockers,status:'draft_unverified'};
}
export async function runAgent({role,task,context='',apiKey=process.env.AUREON_LLM_API_KEY,model=process.env.AUREON_LLM_MODEL,endpoint=process.env.AUREON_LLM_ENDPOINT,fetchImpl=fetch}){
 if(!apiKey||!model||!endpoint)throw new Error('server-side model configuration missing');
 const url=new URL(endpoint);
 if(url.protocol!=='https:'||url.username||url.password||url.hash||url.search)throw new Error('invalid agent endpoint');
 if(!url.pathname.endsWith('/chat/completions'))throw new Error('expected chat completions endpoint');
 const messages=buildAgentRequest({role,task,context});
 const response=await fetchImpl(url,{method:'POST',redirect:'error',signal:AbortSignal.timeout(90000),headers:{'content-type':'application/json',authorization:'Bearer '+apiKey},body:JSON.stringify({model,messages,temperature:0.2})});
 if(!response.ok)throw new Error('model request failed with HTTP '+response.status);
 const data=await response.json();
 const message=data?.choices?.[0]?.message?.content;
 if(typeof message!=='string')throw new Error('missing agent response');
 return parseAgentResponse(message);
}
