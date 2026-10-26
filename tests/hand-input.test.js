import test from 'node:test';
import assert from 'node:assert/strict';
import { AdaptivePointer,pickHandTarget,HandIdentityTracker,ScaleFilter,WarpIntent } from '../src/hand-input.js';
import { volumeSeeds } from '../src/nebula-volume.js';

test('stationary tremor is reduced while a deliberate movement responds within two frames',()=>{
  const f=new AdaptivePointer();let raw=0,filtered=0;
  for(let i=0;i<120;i++){const x=500+(i%2?4:-4),p=f.update({x,y:300},i*33);if(i>20){raw+=(x-500)**2;filtered+=(p.x-500)**2;}}
  assert.ok(filtered<raw*.5);
  f.update({x:800,y:300},4000);const moved=f.update({x:800,y:300},4033);assert.ok(moved.x>770);
  const held=f.update({x:720,y:350},4066,true);assert.deepEqual(held,moved);
});
test('magnetic targets tolerate hand error and resist switching between nearby icons',()=>{
  const targets=[{id:0,x:200,y:200,radius:18},{id:1,x:310,y:200,radius:18}];
  assert.equal(pickHandTarget(targets,{x:250,y:200}),0);
  assert.equal(pickHandTarget(targets,{x:260,y:200},0),0);
  assert.equal(pickHandTarget(targets,{x:300,y:200},0),1);
  assert.equal(pickHandTarget(targets,{x:700,y:500},0),-1);
});
test('hand identity survives handedness noise and reversed detection order',()=>{
  const t=new HandIdentityTracker(),h=(x,label)=>({handedness:label,landmarks:Array.from({length:21},()=>({x,y:.5,z:0}))});
  const initial=t.update([h(.2,'Left'),h(.8,'Right')],0),next=t.update([h(.79,'Left'),h(.21,'Right')],33);
  assert.equal(next[0].id,initial[1].id);assert.equal(next[1].id,initial[0].id);assert.notEqual(next[0].id,next[1].id);
  t.update([],100);const restored=t.update([h(.22,'Right')],180);assert.equal(restored[0].id,initial[0].id);
  t.update([],500);assert.notEqual(t.update([h(.22,'Left')],800)[0].id,initial[0].id);
});
test('small zoom noise is filtered while intentional expansion remains responsive',()=>{
  const f=new ScaleFilter();f.update(.5,0);for(let i=1;i<15;i++)assert.ok(Math.abs(f.update(.5+(i%2?.004:-.004),i*33)-.5)<.002);
  assert.ok(f.update(.85,500)>.8);
});
test('warp requires a deliberate hand expansion and triggers only once per gesture',()=>{
  const intent=new WarpIntent();assert.equal(intent.update(.2,0,0),false);assert.equal(intent.update(.21,100,0),false);assert.equal(intent.update(.28,250,.1),true);assert.equal(intent.update(.4,350,.2),false);
  assert.equal(intent.update(.18,1500,0),false);assert.equal(intent.update(.26,1750,.1),true);
  intent.reset();assert.equal(intent.update(.3,0,.9),false);assert.equal(intent.update(.5,200,.9),false);
});
test('each particle density level fills all spatial octants without lanes',()=>{
  const seeds=volumeSeeds(42000);
  for(const quality of [.4,.8,1]){
    const bins=Array(64).fill(0),count=Math.floor(42000*quality);
    for(let i=0;i<count;i++){const j=i*3,index=Math.floor(seeds[j]*4)+Math.floor(seeds[j+1]*4)*4+Math.floor(seeds[j+2]*4)*16;bins[index]++;}
    assert.ok(Math.min(...bins)>count/64*.75);assert.ok(Math.max(...bins)<count/64*1.25);
  }
});
