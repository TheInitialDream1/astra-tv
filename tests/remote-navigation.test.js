import test from 'node:test';
import assert from 'node:assert/strict';
import { apps } from '../src/catalog.js';
import { appHome,appDrift } from '../src/app-orbits.js';
import { orderedRoutes,reachable,directionalChoice,chooseEntry,directions } from '../src/remote-navigation.js';

test('30 distinct preview apps have complete logos and stable interior homes',()=>{
  assert.equal(apps.length,30);assert.equal(new Set(apps.map(a=>a.id)).size,30);
  const homes=apps.map((a,i)=>{assert.ok(a.icon.path&&a.name&&a.group);return appHome(i);});
  appHome(60);assert.deepEqual(apps.map((_,i)=>appHome(i)),homes);
  for(let t=0;t<600;t+=10){for(let i=0;i<30;i++){const p=appDrift(i,t);assert.ok(Object.values(p).every(Number.isFinite));assert.ok(Math.hypot(p.x/6.2,p.y/5.1,p.z/6.1)<=.960001);const q=appDrift(i,t+.02);assert.ok(Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z)<.012);}}
});
test('holding each individual direction visits all 30 applications before repeating',()=>{
  const routes=orderedRoutes(apps.length);
  for(const key of Object.keys(directions))for(let start=0;start<30;start++){
    const visited=new Set();let current=start;
    for(let press=0;press<30;press++){assert.ok(!visited.has(current),`${key} repeats at press ${press}`);visited.add(current);current=routes[current][key];}
    assert.equal(visited.size,30);assert.equal(current,start);assert.equal(reachable(routes,start).size,30);
  }
});
test('previous and next undo one another, including the 30-to-1 boundary',()=>{
  const routes=orderedRoutes(30);
  for(let i=0;i<30;i++){assert.equal(routes[routes[i].ArrowRight].ArrowLeft,i);assert.equal(routes[routes[i].ArrowDown].ArrowUp,i);}
  assert.equal(routes[29].ArrowRight,0);assert.equal(routes[0].ArrowUp,29);
});
test('directional dialogs choose nearby aligned controls and wrap at an edge',()=>{
  const items=[{id:0,x:0,y:0},{id:1,x:100,y:0},{id:2,x:5,y:90},{id:3,x:120,y:100}];
  assert.equal(directionalChoice(items,items[0],'ArrowRight'),1);
  assert.equal(directionalChoice(items,items[0],'ArrowDown'),2);
  assert.equal(directionalChoice(items,items[1],'ArrowRight'),3);
  assert.equal(directionalChoice(items,items[0],'ArrowLeft'),1);
  assert.equal(directionalChoice(items,items[0],'ArrowLeft',false),null);
});
test('first entry starts at app 1, and later entry resumes the previous selection',()=>{
  assert.equal(chooseEntry(30),0);assert.equal(chooseEntry(30,18),18);assert.equal(chooseEntry(30,99),0);assert.equal(chooseEntry(0),-1);
});
