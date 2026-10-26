import * as THREE from 'three';

const Z=new THREE.Vector3(0,0,1),Y=new THREE.Vector3(0,1,0);
// A stable world-space front, generally facing into the cloud. It never reads
// the camera, so looking around cannot turn every logo into a billboard.
export function appOrientation(index,position,time=0){
  const inward=position.clone().normalize().negate();
  const base=new THREE.Quaternion().setFromUnitVectors(Z,inward);
  const wobble=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(time*.07+index)*.12,Math.cos(time*.09+index)*.16,Math.sin(time*.08+index)*.1));
  return base.multiply(wobble);
}

export function appFrontPose(position,orientation,radius,aspect,fov){
  const normal=Z.clone().applyQuaternion(orientation),up=Y.clone().applyQuaternion(orientation);
  const distance=Math.max(3.1,radius/(Math.tan(THREE.MathUtils.degToRad(fov/2))*Math.min(aspect,1)*.30));
  return {position:position.clone().addScaledVector(normal,distance),target:position.clone(),up,normal,distance};
}

export function sampleFlight(start,end,t){
  const k=THREE.MathUtils.smootherstep(t,0,1),lift=Math.sin(k*Math.PI)*Math.min(start.position.distanceTo(end.position)*.08,.7);
  const position=start.position.clone().lerp(end.position,k).addScaledVector(start.up,lift);
  const from=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(start.position,start.target,start.up));
  const to=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(end.position,end.target,end.up));
  const orientation=from.slerp(to,k),distance=THREE.MathUtils.lerp(start.position.distanceTo(start.target),end.position.distanceTo(end.target),k);
  return {position,target:position.clone().add(new THREE.Vector3(0,0,-distance).applyQuaternion(orientation)),up:Y.clone().applyQuaternion(orientation)};
}
