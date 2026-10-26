import test from 'node:test';
import assert from 'node:assert/strict';
import { GestureMachine } from '../src/gesture.js';

function hand(id, x, ratio) {
  const landmarks = Array.from({ length: 21 }, () => ({ x, y: .5, z: 0 }));
  landmarks[0] = { x, y: .8 }; landmarks[9] = { x, y: .5 };
  landmarks[4] = { x, y: .4 }; landmarks[8] = { x: x + ratio * .3, y: .4 };
  return { id, landmarks };
}
test('a pinch needs to close, with hysteresis preventing jitter from dropping a grab', () => {
  const g = new GestureMachine();
  assert.equal(g.update([hand('Left', .4, .4)]).mode, 'point');
  assert.equal(g.update([hand('Left', .4, .25)]).mode, 'grab');
  assert.equal(g.update([hand('Left', .4, .4)]).mode, 'grab');
  assert.equal(g.update([hand('Left', .4, .56)]).mode, 'point');
});
test('two pinches produce a scale gesture and a larger measured separation on expansion', () => {
  const g = new GestureMachine();
  const first = g.update([hand('Left', .4, .1), hand('Right', .6, .1)]);
  const second = g.update([hand('Left', .2, .1), hand('Right', .8, .1)]);
  assert.equal(first.mode, 'scale'); assert.equal(second.mode, 'scale');
  assert.ok(second.distance > first.distance * 2);
});
test('hand detection order changes do not switch the primary hand', () => {
  const g = new GestureMachine(), left = hand('Left', .2, .1), right = hand('Right', .8, .1);
  assert.equal(g.update([left,right]).primary.id, 'Left');
  assert.equal(g.update([right,left]).primary.id, 'Left');
});
test('lost tracking releases the grab, including its hysteresis memory', () => {
  const g = new GestureMachine(); g.update([hand('Left', .4, .2)]);
  assert.equal(g.update([]).mode, 'idle');
  assert.equal(g.update([hand('Left', .4, .4)]).mode, 'point');
});
test('one remaining pinched hand transitions from scale to grab', () => {
  const g = new GestureMachine(); g.update([hand('Left', .2, .1), hand('Right', .8, .1)]);
  assert.equal(g.update([hand('Right', .8, .1)]).mode, 'grab');
});
test('invalid results are ignored and mirrored pointer coordinates stay inside the screen', () => {
  const g = new GestureMachine();
  assert.equal(g.update([{ id: 'bad', landmarks: [] }]).mode, 'idle');
  const result = g.update([hand('Left', -.3, .6)]);
  assert.equal(result.primary.x, 1);
  assert.ok(result.primary.y >= 0 && result.primary.y <= 1);
});

import { WaveDetector } from '../src/gesture.js';
const palm=(x,extra={})=>({id:'Left',open:true,pinch:false,palmX:x,palmY:.5,...extra});
test('a deliberate open-palm sideways wave summons once with cooldown',()=>{
  const wave=new WaveDetector(),xs=[.3,.36,.43,.51,.55,.5,.43,.35];
  const result=xs.map((x,i)=>wave.update([palm(x)],i*90));
  assert.equal(result.filter(Boolean).length,1);
  assert.equal(xs.some((x,i)=>wave.update([palm(x)],800+i*90)),false);
  assert.equal(xs.some((x,i)=>wave.update([palm(x)],3400+i*90)),true);
});
test('a still palm, one-way motion, and pinching do not summon',()=>{
  const sequences=[Array(15).fill(.5),[.2,.24,.28,.32,.36,.4,.44,.48,.52]];
  for(const xs of sequences){const wave=new WaveDetector();assert.equal(xs.some((x,i)=>wave.update([palm(x)],i*90)),false);}
  const wave=new WaveDetector();assert.equal([.3,.4,.5,.6,.5,.4,.3].some((x,i)=>wave.update([palm(x,{pinch:true})],i*100)),false);
});
test('lost frames cannot join unrelated palm movements into a wave',()=>{
  const wave=new WaveDetector();[.3,.4,.5].forEach((x,i)=>wave.update([palm(x)],i*100));
  wave.update([],300);assert.equal([.5,.4,.3].some((x,i)=>wave.update([palm(x)],500+i*100)),false);
});
test('the complete landmark pipeline recognizes an extended-palm wave',()=>{
  const g=new GestureMachine();
  function openHand(x){
    const landmarks=Array.from({length:21},()=>({x,y:.6,z:0}));landmarks[0]={x,y:.8,z:0};
    for(const [tip,pip] of [[8,6],[12,10],[16,14],[20,18]]){landmarks[pip]={x,y:.46,z:0};landmarks[tip]={x,y:.25,z:0};}
    landmarks[4]={x:x+.15,y:.51,z:0};return {id:'Left',landmarks};
  }
  const results=[.3,.36,.43,.51,.55,.5,.43,.35].map((x,i)=>g.update([openHand(x)],i*90));
  assert.ok(results.every(r=>r.mode==='point'&&r.primary.open));assert.equal(results.filter(r=>r.wave).length,1);
});

test('a relaxed pinch works and its 3D ratio is independent of palm tilt',()=>{
  const g=new GestureMachine(),h=hand('Left',.4,.7);
  const world=Array.from({length:21},()=>({x:0,y:0,z:0}));world[0]={x:0,y:.07,z:0};world[9]={x:0,y:0,z:0};world[4]={x:0,y:0,z:0};world[8]={x:.023,y:0,z:0};
  h.worldLandmarks=world;const first=g.update([h]);assert.equal(first.mode,'grab');
  h.worldLandmarks=world.map(p=>({x:p.x,y:-p.z,z:p.y}));const tilted=g.update([h]);assert.equal(tilted.mode,'grab');assert.ok(Math.abs(first.primary.ratio-tilted.primary.ratio)<1e-8);
});
test('two open palms can enter space scaling without pinching',()=>{
  const g=new GestureMachine();
  const palm=x=>{const h=hand(x<.5?'Left':'Right',x,.8);for(const [tip,pip] of [[8,6],[12,10],[16,14],[20,18]]){h.landmarks[tip]={x,y:.2,z:0};h.landmarks[pip]={x,y:.5,z:0};}return h;};
  const close=g.update([palm(.4),palm(.6)],0),wide=g.update([palm(.2),palm(.8)],100);
  assert.equal(close.mode,'scale');assert.equal(wide.mode,'scale');assert.ok(wide.distance>close.distance*2);
});
