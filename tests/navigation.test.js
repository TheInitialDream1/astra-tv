import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { appOrientation,appFrontPose,sampleFlight } from '../src/navigation.js';
import { appDrift } from '../src/app-orbits.js';
const Z=new THREE.Vector3(0,0,1),Y=new THREE.Vector3(0,1,0);

test('application fronts occupy different world directions, including side and back',()=>{
  const normals=Array.from({length:6},(_,i)=>{const p=appDrift(i,0);return Z.clone().applyQuaternion(appOrientation(i,new THREE.Vector3(p.x,p.y,p.z)));});
  assert.ok(normals.some(n=>n.z<-.4)&&normals.some(n=>n.z>.4));
  assert.ok(normals.some(n=>Math.abs(n.x)>.7));
  assert.ok(normals[0].dot(normals[3])<.3);
});
test('front navigation lands on the glyph normal and frames portrait and landscape',()=>{
  for(const aspect of [.45,1,1.8])for(let i=0;i<6;i++){
    const p=appDrift(i,0),position=new THREE.Vector3(p.x,p.y,p.z),orientation=appOrientation(i,position);
    const pose=appFrontPose(position,orientation,.48,aspect,76);
    assert.ok(pose.position.clone().sub(pose.target).normalize().dot(pose.normal)>.999999);
    assert.ok(pose.target.distanceTo(position)<1e-9&&pose.distance>=3.1);
    assert.ok(Math.abs(pose.up.dot(pose.normal))<1e-6);
  }
});
test('camera flights preserve exact endpoints and remain finite through a full turn',()=>{
  const start={position:new THREE.Vector3(0,0,2),target:new THREE.Vector3(),up:Y.clone()};
  const end={position:new THREE.Vector3(0,0,1),target:new THREE.Vector3(0,0,5),up:Y.clone().negate()};
  for(let i=0;i<=100;i++){const p=sampleFlight(start,end,i/100);assert.ok([...p.position,...p.target,...p.up].every(Number.isFinite));assert.ok(p.position.distanceTo(p.target)>.9);assert.ok(Math.abs(p.up.length()-1)<1e-8);}
  assert.ok(sampleFlight(start,end,0).position.distanceTo(start.position)<1e-9);
  const final=sampleFlight(start,end,1);assert.ok(final.position.distanceTo(end.position)<1e-9&&final.target.distanceTo(end.target)<1e-9);
});
