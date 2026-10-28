import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {processInspections,AGENTS} from './runner.mjs';
export async function runCatalog(catalogPath,manifestPath,outputPath){
 const catalog=JSON.parse(await readFile(catalogPath,'utf8'));
 const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
 const receipts=processInspections(catalog,manifest);
 const report={generatedAt:new Date().toISOString(),agents:AGENTS.map(a=>a.id),total:receipts.length,reviewRequired:receipts.filter(r=>r.status==='review_required').length,blocked:receipts.filter(r=>r.status==='blocked').length,verified:receipts.filter(r=>r.status==='verified').length,receipts};
 await mkdir('integrations/data',{recursive:true});
 await writeFile(outputPath,JSON.stringify(report,null,2));
 return {total:report.total,reviewRequired:report.reviewRequired,blocked:report.blocked,verified:report.verified};
}
if(process.argv[1]?.endsWith('/run-catalog.mjs'))runCatalog('integrations/data/discovery.json','integrations/data/operation-manifests.json','integrations/data/agent-receipts.json').then(console.log).catch(e=>{console.error(e);process.exitCode=1});
