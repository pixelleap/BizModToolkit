import fs from 'node:fs'; import cp from 'node:child_process';
const root='D:/Workspace/module-board', projectId='acf23cd5-fc51-49e8-87d3-8723e6c8e9da';
const m=JSON.parse(fs.readFileSync(root+'/data/modules.json','utf8'));
const en=JSON.parse(fs.readFileSync(root+'/tools/option-en.json','utf8'));
const jobs=[];
for(const card of m) for(const o of card.options){
 const concept=en[o.id]; if(!concept) throw new Error('missing '+o.id);
 const prompt=`Flat 2D vector game UI icon: ${concept}. Match the rounded flat style, line weight and warm off-white #F7F5F0 background of the reference image. Simple geometric shapes, clean crisp edges, subtle soft paper texture, centered with generous padding. Absolutely no text, no letters, no numbers, no Chinese characters, no labels, no captions, no typography, no signage, no currency symbols, no logos, no watermark. 16:9`;
 const args=['node','create','image','--project-id',projectId,'--title','选项图2 · '+card.title+' / '+o.title,'--model','seedream_4.7','--mode','i2i','--ref','node:node_6emx8avbj0','--prompt',prompt,'--ratio','16:9','--resolution','2K','--count','1','--format','json'];
 const d=JSON.parse(cp.execFileSync('dreamina-canvas',args,{encoding:'utf8',maxBuffer:10*1024*1024}));
 if(!d.ok) throw new Error(o.id+' '+JSON.stringify(d));
 jobs.push({optionId:o.id,moduleId:card.id,moduleTitle:card.title,optionTitle:o.title,imageId:'optimg_'+o.id,nodeId:d.data.node.nodeId,status:'empty'});
 if(jobs.length%10===0) console.log('created',jobs.length);
}
fs.writeFileSync(root+'/tools/option-image-jobs-en.json',JSON.stringify(jobs,null,2)); console.log('done',jobs.length);
