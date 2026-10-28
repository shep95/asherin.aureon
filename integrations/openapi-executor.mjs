// Explicit opt-in API execution, restricted to reviewed OpenAPI operations.
// No arbitrary URL inputs, no auto-publication, no credentials returned to callers.
const METHODS=new Set(['get','head','post','put','patch','delete']);
export function compileOperations(spec) {
 if(!spec||typeof spec!=='object'||(!spec.openapi&&!spec.swagger))throw new TypeError('validated OpenAPI specification required');
 const servers=Array.isArray(spec.servers)?spec.servers: [];
 const origin=servers.find(x=>typeof x.url==='string'&&/^https:\/\//.test(x.url))?.url;
 if(!origin)throw new Error('explicit HTTPS server required; Swagger 2 base URLs need separate review');
 const base=new URL(origin);
 if(base.username||base.password||base.hash||!/^https:$/.test(base.protocol))throw new Error('invalid server');
 const operations=[];
 for(const [path,group] of Object.entries(spec.paths||{})){
  if(!path.startsWith('/')||path.includes('..')||path.includes('?')||path.includes('#'))continue;
  for(const [method,op] of Object.entries(group||{})){
   if(!METHODS.has(method)||!op||typeof op!=='object')continue;
   const parameters=[...(group.parameters||[]),...(op.parameters||[])].filter(p=>p&&typeof p.name==='string');
   const required=parameters.filter(p=>p.required).map(p=>({name:p.name,in:p.in}));
   const id=op.operationId || method+' '+path;
   operations.push({id,method:method.toUpperCase(),path,server:base.origin,basePath:base.pathname.replace(/\/$/,''),
    required,securityDeclared:!!(op.security||spec.security),reviewed:false,enabled:false});
  }
 }
 return operations;
}
export async function invokeReviewedOperation(operation,{pathParams={},query={},headers={},body,credential,fetchImpl=fetch}={}){
 if(!operation?.reviewed||!operation?.enabled)throw new Error('operation not approved');
 if(!METHODS.has(String(operation.method).toLowerCase()))throw new Error('unapproved method');
 if(!/^https:\/\//.test(operation.server))throw new Error('insecure server');
 const base=new URL(operation.server);
 if(!operation.allowedOrigin||operation.allowedOrigin!==base.origin)throw new Error('server origin not approved');
 let path=operation.path;
 const placeholders=[...path.matchAll(/\{([^}]+)\}/g)].map(m=>m[1]);
 for(const key of placeholders){
  if(!Object.hasOwn(pathParams,key))throw new Error('missing path parameter '+key);
  const v=String(pathParams[key]);if(v.length>500)throw new Error('path parameter too long');
  path=path.replace('{'+key+'}',encodeURIComponent(v));
 }
 if(/\{[^}]*\}/.test(path))throw new Error('unresolved path parameter');
 const url=new URL(operation.basePath+path,base.origin);
 if(url.origin!==operation.allowedOrigin)throw new Error('origin changed');
 for(const [key,value] of Object.entries(query)) {
  if(!/^[\w.\[\]-]{1,100}$/.test(key))throw new Error('invalid query parameter');
  url.searchParams.set(key,String(value));
 }
 const requestHeaders={'accept':'application/json'};
 if(credential!==undefined) {
  if(!operation.allowCredential||typeof credential!=='string')throw new Error('credential injection not approved');
  requestHeaders.authorization='Bearer '+credential;
 }
 if(Object.keys(headers).length)throw new Error('arbitrary headers forbidden');
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
 try{
  const r=await fetchImpl(url,{method:operation.method,headers:requestHeaders,redirect:'error',signal:controller.signal,
   ...(body===undefined?{}:{body:JSON.stringify(body)})});
  if(!r.ok)throw new Error('upstream HTTP '+r.status);
  const len=Number(r.headers?.get?.('content-length')||0);if(len>2_000_000)throw new Error('response exceeds limit');
  const text=await r.text();if(text.length>2_000_000)throw new Error('response exceeds limit');
  try{return JSON.parse(text)}catch{return text}
 }finally{clearTimeout(timer)}
}
