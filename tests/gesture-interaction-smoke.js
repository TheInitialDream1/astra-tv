import { desktop,handleHands } from '../src/spatial-main.js';
import { apps } from '../src/catalog.js';

const results=[],output=document.querySelector('#result');
const check=(name,value)=>{results.push([name,Boolean(value)]);output.textContent=results.map(([name,ok])=>`${ok?'PASS':'FAIL'}: ${name}`).join('\n');};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function palm(id,x){
  const landmarks=Array.from({length:21},()=>({x,y:.5,z:0}));landmarks[0]={x,y:.78,z:0};
  for(const [tip,pip] of [[8,6],[12,10],[16,14],[20,18]]){landmarks[tip]={x,y:.25,z:0};landmarks[pip]={x,y:.5,z:0};}
  landmarks[4]={x:x+.12,y:.5,z:0};return {id,landmarks};
}
const palms=distance=>[palm('Left',.5-distance/2),palm('Right',.5+distance/2)];
let stream;
try{
  desktop.reset();await wait(80);handleHands(palms(.17));await wait(80);handleHands(palms(.36));
  check('two open palms expanding trigger the real desktop warp',Boolean(desktop.warp));
  stream=setInterval(()=>handleHands(palms(.36)),33);await wait(1350);clearInterval(stream);
  check('holding hands apart after arrival keeps the camera inside',!desktop.warp&&desktop.approach>.98&&desktop.targetApproach>.98&&desktop.camera.position.length()<2);
  handleHands([]);await wait(150);
  const chosen=desktop.nodes.findIndex((n,i)=>{const p=desktop.project(i);return p.visible&&n.reveal>.65&&desktop.handTarget(p.x,p.y)===i;});
  if(chosen<0)throw new Error('No readable target in the test view');
  const target=desktop.project(chosen),x=.88-target.x/desktop.width*.76,y=.1+target.y/desktop.height*.8;
  const pointing=palm('Right',x);pointing.landmarks[8]={x,y,z:0};pointing.landmarks[4]={x:x+.14,y,z:0};
  handleHands([pointing]);await wait(80);
  check('pointing at a glyph magnetically selects that app in the actual UI',desktop.hovered===chosen&&document.querySelector('#hand-target').textContent.includes(apps[chosen].name));
  const pinched=structuredClone(pointing);pinched.landmarks[4]={...pinched.landmarks[8]};handleHands([pinched]);
  stream=setInterval(()=>handleHands([pinched]),33);await wait(1800);clearInterval(stream);
  check('one pinch flies to the app and opens its real preview dialog',document.querySelector('#app-dialog').open&&document.querySelector('#preview-name').textContent===apps[chosen].name);
  document.querySelector('#app-dialog').close();await wait(80);handleHands([pinched]);await wait(80);
  check('a held pinch cannot reopen an app after returning',!document.querySelector('#app-dialog').open);
  handleHands(palms(.4));await wait(60);handleHands(palms(.26));await wait(60);handleHands(palms(.18));
  check('two-hand contraction updates zoom while the return camera is still flying',Boolean(desktop.flight)&&desktop.targetApproach<.5);
  await wait(600);handleHands([]);
  check('the combined desktop gesture flow finishes without an open dialog',!document.querySelector('dialog[open]'));
}catch(error){check(error.stack||error.message,false);}finally{clearInterval(stream);handleHands([]);desktop.dispose();}
