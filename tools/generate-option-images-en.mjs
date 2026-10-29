import fs from 'node:fs'; import path from 'node:path'; import cp from 'node:child_process';
const root='D:/Workspace/module-board', projectId='acf23cd5-fc51-49e8-87d3-8723e6c8e9da';
const jobsPath=root+'/tools/option-image-jobs-en.json', outDir=root+'/option-images-en'; fs.mkdirSync(outDir,{recursive:true});
let jobs=JSON.parse(fs.readFileSync(jobsPath,'utf8'));
const cli=a=>JSON.parse(cp.execFileSync('dreamina-canvas',a,{encoding:'utf8',maxBuffer:20*1024*1024}));
for(let i=0;i<jobs.length;i+=6){
 const batch=jobs.slice(i,i+6), runArgs=['node','run','--project-id',projectId];
 for(const j of batch){ if(!j.submitId) j.submitId=crypto.randomUUID(); runArgs.push('--node-id',j.nodeId,'--submit-id',j.submitId); }
 const run=cli(runArgs); if(!run.ok) throw new Error(JSON.stringify(run));
 for(const item of run.data.items){ const j=batch.find(x=>x.nodeId===item.nodeId); if(!j)continue; let op;
  for(let k=0;k<3;k++){try{op=cli(['operation','wait',item.submitId,'--project-id',projectId,'--timeout','5m','--interval','3s']);if(op.ok)break;}catch(e){op=null}}
  if(!op||!op.ok||op.data.state!=='succeeded'){j.status='failed';fs.writeFileSync(jobsPath,JSON.stringify(jobs,null,2));console.log('FAIL',j.optionTitle);continue;}
  const r=(op.data.resources||[]).find(x=>x.state==='succeeded'); if(!r){j.status='failed';continue;}
  j.resourceId=r.resourceId;j.width=r.width;j.height=r.height; const out=path.join(outDir,j.optionId+'.jpg');
  try{cp.execFileSync('dreamina-canvas',['resource','download',r.resourceId,'--project-id',projectId,'--output',out],{encoding:'utf8',maxBuffer:10*1024*1024});j.status='downloaded';j.path=out}catch(e){j.status='download_failed'}
  fs.writeFileSync(jobsPath,JSON.stringify(jobs,null,2)); console.log('OK',j.optionTitle);
 }
}
console.log('DONE',jobs.filter(j=>j.status==='downloaded').length,'/',jobs.length);
