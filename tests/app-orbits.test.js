import test from 'node:test';
import assert from 'node:assert/strict';
import {appDrift,PinchLauncher} from '../src/app-orbits.js';
const point=(id='Right')=>({id,pinch:false});
const pinch=(id='Right')=>({id,pinch:true});
test('apps occupy interior positions at different radii and both front and back depths',()=>{
  for(let t=0;t<=600;t+=5){
    const positions=Array.from({length:6},(_,i)=>appDrift(i,t));
    assert.equal(new Set(positions.map(p=>`${p.x},${p.y},${p.z}`)).size,6);
    assert.ok(Math.min(...positions.map(p=>p.z))<-3&&Math.max(...positions.map(p=>p.z))>1.5);
    for(const p of positions)assert.ok(Math.hypot(p.x/6.2,p.y/5.1,p.z/6.1)<=.960001);
    const radii=positions.map(p=>Math.hypot(p.x,p.y,p.z));
    assert.ok(Math.max(...radii)-Math.min(...radii)>1,'apps must fill a volume rather than a common shell');
  }
});
test('independent three-dimensional drift stays continuous and slow',()=>{
  for(let i=0;i<6;i++){
    const first=appDrift(i,0),later=appDrift(i,5);
    assert.ok(Math.hypot(later.x-first.x,later.y-first.y,later.z-first.z)>.1);
    for(let t=0;t<300;t+=.5){const a=appDrift(i,t),b=appDrift(i,t+.02);assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<.012);}
  }
});
test('pointing then pinching opens the selected target on the first pinch frame',()=>{
  const l=new PinchLauncher();assert.equal(l.update({pointers:[point()],pointerId:'Right',target:3},0),-1);
  assert.equal(l.update({pointers:[pinch()],pointerId:'Right',target:3},65),3);
});
test('holding a pinch does not repeatedly reopen the app',()=>{
  const l=new PinchLauncher();l.update({pointers:[point()],pointerId:'Right',target:1},0);assert.equal(l.update({pointers:[pinch()],pointerId:'Right',target:1},65),1);
  for(let t=100;t<3000;t+=65)assert.equal(l.update({pointers:[pinch()],pointerId:'Right',target:1},t),-1);
});
test('a hand already pinched on entry cannot activate an unselected app',()=>{
  const l=new PinchLauncher();assert.equal(l.update({pointers:[pinch()],pointerId:'Right',target:1},0),-1);assert.equal(l.update({pointers:[pinch()],pointerId:'Right',target:1},900),-1);
});
test('dialog dismissal with the same held pinch requires release and a new pinch',()=>{
  const l=new PinchLauncher();l.update({pointers:[point()],pointerId:'Right',target:1},0);l.update({pointers:[pinch()],pointerId:'Right',target:1},65);
  l.update({pointers:[pinch()],pointerId:'Right',target:1,enabled:false},500);
  assert.equal(l.update({pointers:[pinch()],pointerId:'Right',target:1},1200),-1);
  l.update({pointers:[point()],pointerId:'Right',target:1},1300);assert.equal(l.update({pointers:[pinch()],pointerId:'Right',target:1},1400),1);
});
test('the other hand cannot pinch-open the target armed by the pointing hand',()=>{
  const l=new PinchLauncher();l.update({pointers:[point('Right'),point('Left')],pointerId:'Right',target:4},0);
  assert.equal(l.update({pointers:[point('Right'),pinch('Left')],pointerId:'Right',target:4},65),-1);
});
test('two-hand zoom cancels a staggered activation before the second pinch arrives',()=>{
  const l=new PinchLauncher();l.update({pointers:[point('Right'),point('Left')],pointerId:'Right',target:2},0);
  assert.equal(l.update({pointers:[pinch('Right'),point('Left')],pointerId:'Right',target:2},65),-1);
  assert.equal(l.update({pointers:[pinch('Right'),pinch('Left')],pointerId:'Right',target:2},130),-1);
  assert.equal(l.update({pointers:[pinch('Right'),point('Left')],pointerId:'Right',target:2},300),-1);
});
test('losing the target before pinching disarms activation',()=>{
  const l=new PinchLauncher();l.update({pointers:[point()],pointerId:'Right',target:3},0);l.update({pointers:[point()],pointerId:'Right',target:-1},65);
  assert.equal(l.update({pointers:[pinch()],pointerId:'Right',target:-1},130),-1);
});
