import{mkdirSync,readdirSync,readFileSync,writeFileSync}from'node:fs';
import{join}from'node:path';
const I=process.env.MAKEFUN_INPUT_DIR??'/input',O=process.env.MAKEFUN_OUTPUT_DIR??'/output';
function run(p:Buffer,q:Buffer):{out:Buffer;code:number}{
const s=new Int32Array(256),c=new Int32Array(64),m=new Int32Array(256),o=Buffer.alloc(65536),n=p.length;
let sp=0,cp=0,pc=0,t=0,l=0,ip=0,a=0,b=0,v=0,g='';
const d=(k:number)=>({out:o.subarray(0,l),code:k});
while(1){
if(t>=1e6)return d(10);
if(pc<0||pc>=n)return d(9);
const e=p[pc];
switch(e){
case 0:return d(0);
case 1:if(pc+2>n)return d(9);if(sp>=256)return d(3);b=p[pc+1];s[sp++]=b<128?b:b-256;pc+=2;break;
case 2:if(pc+5>n)return d(9);if(sp>=256)return d(3);s[sp++]=p.readInt32LE(pc+1);pc+=5;break;
case 3:if(sp<1)return d(2);sp--;pc++;break;
case 4:if(sp<1)return d(2);if(sp>=256)return d(3);s[sp]=s[sp-1];sp++;pc++;break;
case 5:if(sp<2)return d(2);v=s[sp-1];s[sp-1]=s[sp-2];s[sp-2]=v;pc++;break;
case 6:if(sp<2)return d(2);if(sp>=256)return d(3);s[sp]=s[sp-2];sp++;pc++;break;
case 7:if(sp<3)return d(2);v=s[sp-3];s[sp-3]=s[sp-2];s[sp-2]=s[sp-1];s[sp-1]=v;pc++;break;
case 16:if(sp<2)return d(2);s[sp-2]=(s[sp-2]+s[sp-1])|0;sp--;pc++;break;
case 17:if(sp<2)return d(2);s[sp-2]=(s[sp-2]-s[sp-1])|0;sp--;pc++;break;
case 18:if(sp<2)return d(2);s[sp-2]=Math.imul(s[sp-2],s[sp-1]);sp--;pc++;break;
case 19:if(sp<2)return d(2);a=s[sp-2];b=s[sp-1];if(!b)return d(4);s[sp-2]=(a/b)|0;sp--;pc++;break;
case 20:if(sp<2)return d(2);a=s[sp-2];b=s[sp-1];if(!b)return d(4);s[sp-2]=a%b;sp--;pc++;break;
case 21:if(sp<2)return d(2);a=s[sp-2];b=s[sp-1];if(!b)return d(4);s[sp-2]=((a>>>0)/(b>>>0))|0;sp--;pc++;break;
case 22:if(sp<2)return d(2);a=s[sp-2];b=s[sp-1];if(!b)return d(4);s[sp-2]=((a>>>0)%(b>>>0))|0;sp--;pc++;break;
case 23:if(sp<1)return d(2);s[sp-1]=(-s[sp-1])|0;pc++;break;
case 24:if(sp<2)return d(2);s[sp-2]&=s[sp-1];sp--;pc++;break;
case 25:if(sp<2)return d(2);s[sp-2]|=s[sp-1];sp--;pc++;break;
case 26:if(sp<2)return d(2);s[sp-2]^=s[sp-1];sp--;pc++;break;
case 27:if(sp<1)return d(2);s[sp-1]=~s[sp-1];pc++;break;
case 28:if(sp<2)return d(2);s[sp-2]<<=(s[sp-1]&31);sp--;pc++;break;
case 29:if(sp<2)return d(2);s[sp-2]>>=(s[sp-1]&31);sp--;pc++;break;
case 30:if(sp<2)return d(2);s[sp-2]=(s[sp-2]>>>(s[sp-1]&31))|0;sp--;pc++;break;
case 32:if(sp<2)return d(2);s[sp-2]=s[sp-2]===s[sp-1]?1:0;sp--;pc++;break;
case 33:if(sp<2)return d(2);s[sp-2]=s[sp-2]<s[sp-1]?1:0;sp--;pc++;break;
case 34:if(sp<2)return d(2);s[sp-2]=(s[sp-2]>>>0)<(s[sp-1]>>>0)?1:0;sp--;pc++;break;
case 48:if(pc+3>n)return d(9);pc=pc+3+p.readInt16LE(pc+1);break;
case 49:if(pc+3>n)return d(9);if(sp<1)return d(2);v=s[--sp];pc=v===0?pc+3+p.readInt16LE(pc+1):pc+3;break;
case 50:if(pc+3>n)return d(9);if(sp<1)return d(2);v=s[--sp];pc=v!==0?pc+3+p.readInt16LE(pc+1):pc+3;break;
case 51:if(pc+3>n)return d(9);if(cp>=64)return d(7);c[cp++]=pc+3;pc=p.readUInt16LE(pc+1);break;
case 52:if(cp<1)return d(8);pc=c[--cp];break;
case 64:if(sp<1)return d(2);a=s[sp-1];if(a<0||a>255)return d(6);s[sp-1]=m[a];pc++;break;
case 65:if(sp<2)return d(2);a=s[sp-1];v=s[sp-2];if(a<0||a>255)return d(6);m[a]=v;sp-=2;pc++;break;
case 80:if(sp<1)return d(2);g=String(s[--sp]);if(l+g.length>65536)return d(11);l+=o.write(g,l,'ascii');pc++;break;
case 81:if(sp<1)return d(2);if(l+1>65536)return d(11);o[l++]=s[--sp]&255;pc++;break;
case 82:if(sp>=256)return d(3);s[sp++]=ip<q.length?q[ip++]:-1;pc++;break;
case 83:if(sp<1)return d(2);return d(s[--sp]&255);
default:return d(5);
}
t++;
}
}
for(const id of readdirSync(I).sort()){
const p=readFileSync(join(I,id,'program.bin'));
let q:Buffer;
try{q=readFileSync(join(I,id,'input.bin'))}catch{q=Buffer.alloc(0)}
const r=run(p,q);
mkdirSync(join(O,id),{recursive:true});
writeFileSync(join(O,id,'stdout.bin'),r.out);
writeFileSync(join(O,id,'exit.txt'),`${r.code}\n`);
}
