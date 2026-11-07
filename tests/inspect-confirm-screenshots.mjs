/**
 * Dependency-free screenshot audit for the latest pair of *-demo-confirm.png files.
 * Read-only: it never launches the app or modifies evidence.  The pixel detector
 * finds the narrow, light print sheet (the selected 5x15 layout has ratio 1:3),
 * then reports intersection with the expected summary and bottom action-bar zones.
 *
 * Usage: node tests/inspect-confirm-screenshots.mjs [evidence-directory]
 */
import {inflateSync} from 'node:zlib';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {resolve,join,basename} from 'node:path';

const root=resolve(import.meta.dirname,'journey-evidence');
const wanted=['1280x800-demo-confirm.png','1920x1200-demo-confirm.png'];
const dirs=process.argv[2]?[resolve(process.argv[2])]:readdirSync(root).map(x=>join(root,x)).filter(x=>statSync(x).isDirectory()).sort().reverse();
const dir=dirs.find(d=>wanted.every(n=>{try{return statSync(join(d,n)).isFile()}catch{return false}}));
if(!dir)throw Error('No evidence directory contains both '+wanted.join(' and '));

function png(file){
 const b=readFileSync(file);if(b.toString('hex',0,8)!=='89504e470d0a1a0a')throw Error('Not PNG: '+file);
 let p=8,w,h,depth,type,raw=[];while(p<b.length){const n=b.readUInt32BE(p),tag=b.toString('ascii',p+4,p+8),d=b.subarray(p+8,p+8+n);p+=12+n;if(tag==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);depth=d[8];type=d[9]}else if(tag==='IDAT')raw.push(d);else if(tag==='IEND')break}
 if(depth!==8||![2,6].includes(type))throw Error(`Unsupported PNG depth/type ${depth}/${type}`);const c=type===6?4:3,stride=w*c,z=inflateSync(Buffer.concat(raw)),out=Buffer.alloc(h*stride);let q=0;
 for(let y=0;y<h;y++){const f=z[q++],row=y*stride,prev=(y-1)*stride;for(let x=0;x<stride;x++){const a=x>=c?out[row+x-c]:0,bb=y?out[prev+x]:0,cc=y&&x>=c?out[prev+x-c]:0,v=z[q++];out[row+x]=(v+(f===1?a:f===2?bb:f===3?Math.floor((a+bb)/2):f===4?paeth(a,bb,cc):0))&255}}
 return {w,h,c,p:out};
}
function paeth(a,b,c){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c}
function intersect(a,b){const x=Math.max(a.x,b.x),y=Math.max(a.y,b.y),r=Math.min(a.x+a.width,b.x+b.width),d=Math.min(a.y+a.height,b.y+b.height);return Math.max(0,r-x)*Math.max(0,d-y)}
function detect(im){
 // The generated composition can contain several near-white photo cells rather
 // than one white outer sheet. Find connected light regions and union the large
 // cells in the left preview column. This intentionally reports visible pixels:
 // clipped cells therefore produce a visibly truncated bound.
 const mask=new Uint8Array(im.w*im.h),seen=new Uint8Array(mask.length);for(let y=0;y<im.h;y++)for(let x=0;x<im.w;x++){const j=y*im.w+x,i=j*im.c,r=im.p[i],g=im.p[i+1],b=im.p[i+2];mask[j]=+(r>200&&g>195&&b>185&&Math.max(r,g,b)-Math.min(r,g,b)<55)}
  const parts=[];for(let sy=0;sy<im.h;sy++)for(let sx=0;sx<im.w;sx++){const s=sy*im.w+sx;if(!mask[s]||seen[s])continue;let q=[s],head=0,minx=sx,maxx=sx,miny=sy,maxy=sy,n=0;seen[s]=1;while(head<q.length){const j=q[head++],x=j%im.w,y=(j/im.w)|0;n++;minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y);for(const k of [j-1,j+1,j-im.w,j+im.w])if(k>=0&&k<mask.length&&!seen[k]&&mask[k]&&Math.abs(k%im.w-x)<=1){seen[k]=1;q.push(k)}}if(n>im.w*im.h*.003&&maxx<im.w*.7&&minx>im.w*.02)parts.push({x:minx,y:miny,width:maxx-minx+1,height:maxy-miny+1,pixels:n})}
 if(!parts.length)return null;return parts.reduce((u,p)=>{const r=Math.max(u.x+u.width,p.x+p.width),b=Math.max(u.y+u.height,p.y+p.height),x=Math.min(u.x,p.x),y=Math.min(u.y,p.y);return{x,y,width:r-x,height:b-y,components:(u.components??1)+1}},parts[0]);
}
for(const name of wanted){const im=png(join(dir,name)),preview=detect(im);const actionbar={x:Math.round(im.w*.0375),y:Math.round(im.h-.12*im.h-.02*im.h),width:Math.round(im.w*.925),height:Math.round(im.h*.12)};const summary={x:Math.round(im.w*.64),y:Math.round(im.h*.18),width:Math.round(im.w*.32),height:Math.round(im.h*.58)};console.log(JSON.stringify({file:basename(dir)+'/'+name,dimensions:{width:im.w,height:im.h},preview,estimatedZones:{summary,actionbar},pixelIntersection:preview?{summary:intersect(preview,summary),actionbar:intersect(preview,actionbar)}:null,note:'Zone bounds are estimates; preview bounds are pixel-detected. For authoritative CSS bounds, record getBoundingClientRect in the journey runner.'},null,2))}
