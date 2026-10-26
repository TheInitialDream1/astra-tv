// A test-only frame, running the production spatial module and shell bridge.
import { desktop,handleHands } from '../src/spatial-main.js';
import { apps } from '../src/catalog.js';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const check=(name,ok,done=false)=>parent.postMessage({type:'astra-test-result',name,ok:Boolean(ok),done},location.origin);
function palm(id,x){const landmarks=Array.from({length:21},()=>({x,y:.5,z:0}));landmarks[0]={x,y:.78,z:0};for(const [tip,pip] of [[8,6],[12,10],[16,14],[20,18]]){landmarks[tip]={x,y:.25,z:0};landmarks[pip]={x,y:.5,z:0};}landmarks[4]={x:x+.12,y:.5,z:0};return {id,landmarks};}
const palms=distance=>[palm('Left',.5-distance/2),palm('Right',.5+distance/2)];
let stream;
try{
 await wait(100);check('TV shell renders one full-screen interactive particle frame',parent.document.querySelectorAll('iframe').length===1&&document.querySelector('#space canvas')&&parent.document.querySelector('#shortcut-input'));
 check('spatial engine is ready inside the television homepage',parent.document.querySelector('#tv-spatial-frame').dataset.ready==='true');
 desktop.reset();handleHands(palms(.17));await wait(80);handleHands(palms(.36));check('two open palms trigger warp directly on the TV homepage',desktop.warp);
 stream=setInterval(()=>handleHands(palms(.36)),33);await wait(1350);clearInterval(stream);handleHands([]);await wait(150);
 check('arrival keeps television controls visible around the live scene',desktop.approach>.98&&parent.document.querySelector('.tv-shell').dataset.depth==='near'&&parent.document.querySelector('#shortcut-cast').getBoundingClientRect().width>0);
 const chosen=desktop.nodes.findIndex((n,i)=>{const p=desktop.project(i);return p.visible&&n.reveal>.65&&desktop.handTarget(p.x,p.y)===i;});if(chosen<0)throw new Error('No readable app target in the current view');
 const p=desktop.project(chosen),x=.88-p.x/desktop.width*.76,y=.1+p.y/desktop.height*.8;
 const pointing=palm('Right',x);pointing.landmarks[8]={x,y,z:0};pointing.landmarks[4]={x:x+.14,y,z:0};handleHands([pointing]);await wait(80);
 const pinched=structuredClone(pointing);pinched.landmarks[4]={...pinched.landmarks[8]};handleHands([pinched]);stream=setInterval(()=>handleHands([pinched]),33);await wait(1800);clearInterval(stream);
 const modal=parent.document.querySelector('#tv-dialog');check('one pinch opens the television app dialog through the frame bridge',modal.open&&parent.document.querySelector('#dialog-title').textContent===apps[chosen].name&&!document.querySelector('#app-dialog').open);
 modal.close();await wait(150);handleHands([pinched]);await wait(100);check('returning to the scene with the same held pinch cannot reopen the dialog',!modal.open);
 parent.document.querySelector('#nav-films').click();await wait(100);check('leaving the homepage suspends the scene and blocks gesture launches',desktop.suspended);
 parent.document.querySelector('#nav-home').click();await wait(100);check('returning home reuses and resumes the same particle scene',!desktop.suspended&&parent.document.querySelectorAll('iframe').length===1,true);
}catch(error){check(error.stack||error.message,false,true);}finally{clearInterval(stream);handleHands([]);desktop.dispose();}
