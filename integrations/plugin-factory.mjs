// Plugin scaffold generator: no credentials and no published connections.
export function generatePluginScaffold({id,name,openApiUrl,authType='none',countries=['GLOBAL']}) {
 if(!/^[a-z][a-z0-9-]{2,63}$/.test(id))throw new Error('invalid id');
 if(typeof name!=='string'||!name.trim())throw new Error('invalid name');
 if(!['none','api_key','oauth2'].includes(authType))throw new Error('invalid auth');
 const url=new URL(openApiUrl);if(url.protocol!=='https:'||url.username||url.password||url.hash)throw new Error('invalid OpenAPI URL');
 if(!Array.isArray(countries)||countries.length===0||!countries.every(c=>c==='GLOBAL'||/^[A-Z]{2}$/.test(c)))throw new Error('invalid country list');
 return Object.freeze({id,name,openApiUrl,authType,countries:[...new Set(countries)],state:'scaffold_not_connected',credentialReference:authType==='none'?null:'required_server_side',approvalRequired:true,operations:[],risk:'unreviewed'});
}
