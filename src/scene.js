import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { apps } from './catalog.js';
import { LivingNebula } from './nebula.js';
import { InteractionFX } from './interaction-fx.js';
import { createAppStars } from './app-stars.js';
import { appDrift } from './app-orbits.js';
import { appOrientation, appFrontPose, sampleFlight } from './navigation.js';
import { orderedRoutes, chooseEntry } from './remote-navigation.js';
import { pickHandTarget } from './hand-input.js';
import { WarpFX } from './warp-fx.js';

const TAU=Math.PI*2, V=()=>new THREE.Vector3();
const damp=(a,b,s,dt)=>THREE.MathUtils.damp(a,b,s,dt);
function makeStars(scene) {
  const pos=[],size=[],phase=[];
  for(let i=0;i<5600;i++){
    const r=35+Math.pow(Math.random(),.4)*170,a=Math.random()*TAU,z=Math.random()*2-1,s=Math.sqrt(1-z*z);
    pos.push(r*s*Math.cos(a),r*s*Math.sin(a),r*z);size.push(i%80===0?1.4:.2+Math.random()*.7);phase.push(Math.random()*TAU);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('aSize',new THREE.Float32BufferAttribute(size,1));geo.setAttribute('aPhase',new THREE.Float32BufferAttribute(phase,1));
  const mat=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uRatio:{value:1},uRush:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`attribute float aSize,aPhase;uniform float uTime,uRatio,uRush;varying float vAlpha;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*uRatio*135./max(20.,-mv.z),1.,5.);vAlpha=(.55+.25*sin(aPhase+uTime*.25))*(.8+uRush);}`,
    fragmentShader:`varying float vAlpha;void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;gl_FragColor=vec4(vec3(.49,.7,.83),exp(-r*r*60.)*vAlpha*1.3);}`});
  const stars=new THREE.Points(geo,mat);scene.add(stars);return stars;
}

export class ParticleDesktop {
  constructor(container,onFrame) {
    this.container=container;this.onFrame=onFrame;this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#010409');
    this.camera=new THREE.PerspectiveCamera(58,1,.1,600);this.camera.position.set(0,.35,23.5);
    this.renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;
    this.renderer.domElement.setAttribute('aria-label','全向能量空间，拖动环顾；点击飞到应用正面，捏合进入');container.append(this.renderer.domElement);
    this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));
    this.bloom=new UnrealBloomPass(new THREE.Vector2(100,100),.65,.35,1.0);this.composer.addPass(this.bloom);this.composer.addPass(new OutputPass());
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.enableDamping=true;this.controls.dampingFactor=.065;this.controls.enablePan=false;this.controls.enableZoom=false;this.controls.rotateSpeed=.75;
    this.controls.minPolarAngle=.045;this.controls.maxPolarAngle=Math.PI-.045;this.controls.target.set(0,0,0);
    this.controls.addEventListener('start',()=>{this.orbiting=true;});this.controls.addEventListener('end',()=>{this.orbiting=false;});
    this.universe=new THREE.Group();this.scene.add(this.universe);
    this.nebula=new LivingNebula(this.universe);this.fx=new InteractionFX(this.scene);this.warpFX=new WarpFX(this.scene);this.stars=makeStars(this.scene);this.warp=null;
    this.appDepth=new THREE.WebGLRenderTarget(1,1,{depthBuffer:true,stencilBuffer:false});this.appDepth.depthTexture=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);
    this.depthMaterial=new THREE.MeshDepthMaterial({side:THREE.DoubleSide});this.raycaster=new THREE.Raycaster();
    this.scene.add(new THREE.AmbientLight('#b0d5e8',1.4));const key=new THREE.DirectionalLight('#dff9ff',2.8);key.position.set(-4,6,10);this.scene.add(key);const rim=new THREE.PointLight('#43cfff',55,45,2);rim.position.set(7,-3,7);this.scene.add(rim);
    this.nodes=[];this.selected=-1;this.hovered=-1;this.activation=-1;this.modalOpen=false;this.focusedIndex=-1;this.flight=null;this.remoteMode=false;this.routes=null;this.lastRemote=-1;this.exploreDirection=this.camera.position.clone().normalize();
    this.approach=0;this.targetApproach=0;this.energy=0;this.pointer=new THREE.Vector2();this.pointerActive=false;
    this.paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.quality='standard';this.time=8;this.fxTime=0;this.frames=0;this.last=performance.now();this.lastPulse=-10;this.orbiting=false;this.driftTime=0;
    this.resize();this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);
    this.motionQuery=matchMedia('(prefers-reduced-motion: reduce)');this.motionHandler=e=>this.paused=e.matches;this.motionQuery.addEventListener('change',this.motionHandler);
    this.visibilityHandler=()=>{this.last=performance.now();};document.addEventListener('visibilitychange',this.visibilityHandler);
  }
  async init() {
    this.nodes=await createAppStars(this.universe);
    this.nodes.forEach((n,i)=>{const p=appDrift(i,0);n.home.set(p.x,p.y,p.z);n.group.position.copy(n.home);n.target.copy(n.home);n.currentScale=.42;n.group.scale.setScalar(.42);n.face.quaternion.copy(appOrientation(i,n.home));n.body.userData.appIndex=i;});
    this.controls.update();this.controls.saveState();this.setQuality(this.quality);
    this.warpFX.lines.visible=true;await this.renderer.compileAsync(this.scene,this.camera);this.warpFX.lines.visible=false;
    this.animate();return this;
  }
  resize() {
    const r=this.container.getBoundingClientRect();this.width=Math.max(r.width,1);this.height=Math.max(r.height,1);
    this.camera.aspect=this.width/this.height;this.camera.updateProjectionMatrix();
    this.nearDistance=1.65;this.farDistance=this.camera.aspect<.8?28:23.5;
    this.farFov=this.camera.aspect<.8?78:58;
    this.nearFov=this.camera.aspect<.8?78:72;
    this.renderer.setSize(this.width,this.height);this.composer.setSize(this.width,this.height);
    const ratio=this.renderer.getPixelRatio(),w=Math.round(this.width*ratio),h=Math.round(this.height*ratio);this.appDepth.setSize(w,h);this.nebula.setDepth(this.appDepth.depthTexture,w,h);
  }
  setQuality(value) {this.quality=value;this.nebula.setQuality(value);this.renderer.setPixelRatio(Math.min(devicePixelRatio,value==='lite'?1:value==='ultra'?1.8:1.4));this.composer.setPixelRatio(this.renderer.getPixelRatio());this.resize();}
  setPointer(x,y,active=true) {this.pointer.set(x*2-1,1-y*2);this.pointerActive=active;}
  setApproach(value){const next=THREE.MathUtils.clamp(value,0,1);if(this.warp&&next<.95)this.warp=null;if(this.focusedIndex>=0){this.leaveFocus(next);return;}this.targetApproach=next;this.energy=.65;if(this.flight?.index===-1)this.flight.end.position.copy(this.exploreDirection).multiplyScalar(THREE.MathUtils.lerp(this.farDistance,this.nearDistance,THREE.MathUtils.smoothstep(next,0,1)));}
  summon(){if(this.approach<.6)this.enterWarp();else this.setApproach(1);}
  enterWarp(){
    if(this.warp)return;this.cancelFlight();this.endRemote();this.focusedIndex=-1;this.hovered=-1;this.activation=-1;this.nodes.forEach(n=>n.keyboardFocus=false);
    this.exploreDirection.copy(this.camera.position).normalize();this.controls.target.set(0,0,0);this.camera.up.set(0,1,0);this.targetApproach=1;this.energy=1;
    this.warp={elapsed:0,startedAt:performance.now(),duration:this.motionQuery.matches ? .08 : 1.05,start:this.approach};this.pulse(V(),.8);
  }
  retreat(){this.setApproach(0);}
  reveal(index){return this.flyTo(index);}
  cancelFlight(){if(this.flight){const f=this.flight;this.flight=null;f.resolve(false);}this.controls.enabled=true;}
  startFlight(end,index,duration=1.45){
    this.cancelFlight();const start={position:this.camera.position.clone(),target:this.controls.target.clone(),up:this.camera.up.clone()};
    this.controls.enableDamping=false;this.controls.update();this.controls.enableDamping=true;this.controls.enabled=false;
    let resolve;const promise=new Promise(r=>resolve=r);this.flight={start,end,index,duration:this.motionQuery.matches ? .08 : duration,elapsed:0,resolve,promise};return promise;
  }
  isAtAppFront(index){const n=this.nodes[index];if(!n||this.focusedIndex!==index||this.flight)return false;const p=n.group.getWorldPosition(V()),normal=new THREE.Vector3(0,0,1).applyQuaternion(n.face.getWorldQuaternion(new THREE.Quaternion()));return this.camera.position.clone().sub(p).normalize().dot(normal)>.985&&this.controls.target.distanceTo(p)<.1;}
  flyTo(index,{duration=1.45}={}){
    const n=this.nodes[index];if(!n)return Promise.resolve(false);if(this.flight?.index===index)return this.flight.promise;if(this.isAtAppFront(index))return Promise.resolve(true);
    this.warp=null;if(this.focusedIndex<0)this.exploreDirection.copy(this.camera.position).sub(this.controls.target).normalize();
    this.focusedIndex=index;this.lastRemote=index;this.selected=index;this.hovered=-1;this.targetApproach=1;this.energy=.9;n.anchor.copy(n.group.position);n.locked=true;
    n.group.updateWorldMatrix(true,true);const pose=appFrontPose(n.group.getWorldPosition(V()),n.face.getWorldQuaternion(new THREE.Quaternion()),n.radius*.42,this.camera.aspect,this.nearFov);
    this.pulse(n.group.position,.65,index);return this.startFlight(pose,index,duration);
  }
  beginRemote(){
    if(!this.remoteMode){
      this.remoteMode=true;this.hovered=-1;this.pointerActive=false;
      this.routes=orderedRoutes(this.nodes.length);
    }
  }
  remoteEntry(){return chooseEntry(this.nodes.length,this.lastRemote);}
  remoteTo(index){this.beginRemote();this.lastRemote=index;return this.flyTo(index,{duration:this.focusedIndex<0?1.05:.8});}
  remoteNeighbor(key){return this.routes?.[this.focusedIndex]?.[key]??-1;}
  moveRemote(key){this.beginRemote();const next=this.focusedIndex<0?this.remoteEntry():this.remoteNeighbor(key);if(next>=0){this.remoteTo(next);return next;}return -1;}
  endRemote(){this.remoteMode=false;this.routes=null;}
  leaveFocus(approach=1,duration=1.1){
    this.warp=null;
    this.focusedIndex=-1;this.hovered=-1;this.activation=-1;this.nodes.forEach(n=>{n.focusUntil=-1;n.keyboardFocus=false;});this.targetApproach=THREE.MathUtils.clamp(approach,0,1);
    const d=THREE.MathUtils.lerp(this.farDistance,this.nearDistance,THREE.MathUtils.smoothstep(this.targetApproach,0,1));
    return this.startFlight({position:this.exploreDirection.clone().multiplyScalar(d),target:V(),up:new THREE.Vector3(0,1,0)},-1,duration);
  }
  activate(index){const n=this.nodes[index];if(!n)return;this.selected=index;this.activation=index;this.energy=1;this.pulse(n.group.position,1.1,index);}
  pulse(point,strength=1,index=-1){const world=this.universe.localToWorld(point.clone());this.fx.pulse(world,index<0?'#7beaff':apps[index].color,strength,this.camera.quaternion);this.nebula.pulse(point,this.time,this.fxTime);}
  scaleSpace(value){const next=THREE.MathUtils.clamp(value,0,1);if(Math.abs(next-this.targetApproach)>.02&&this.fxTime-this.lastPulse>.26){this.pulse(V(),.8);this.lastPulse=this.fxTime;}this.setApproach(next);}
  setModal(open){this.modalOpen=open;if(!open){this.activation=-1;this.hovered=-1;this.nodes.forEach(n=>{n.focusUntil=-1;n.keyboardFocus=false;});}}
  projectPosition(position) {
    const p=position.clone().project(this.camera),distance=this.camera.position.distanceTo(position);
    return {x:(p.x+1)*.5*this.width,y:(1-p.y)*.5*this.height,visible:p.z>-1&&p.z<1&&Math.abs(p.x)<1.1&&Math.abs(p.y)<1.1,scale:THREE.MathUtils.clamp(26/distance,.45,1.7),depth:p.z,distance};
  }
  nearest(x,y,maxDistance=105){
    this.raycaster.setFromCamera(new THREE.Vector2(x/this.width*2-1,1-y/this.height*2),this.camera);
    const hit=this.raycaster.intersectObjects(this.nodes.filter(n=>n.reveal>.62&&n.body.visible).map(n=>n.body),false)[0];if(hit)return hit.object.userData.appIndex;
    if(this.hovered>=0&&this.nodes[this.hovered].reveal>.62){const p=this.project(this.hovered);if(p.visible&&Math.hypot(p.x-x,p.y-y)<Math.max(42,p.radius+16))return this.hovered;}
    const candidates=[];
    this.nodes.forEach((n,i)=>{const p=this.project(i),d=Math.hypot(p.x-x,p.y-y);if(n.reveal>.62&&!n.occluded&&p.visible&&d<Math.min(maxDistance,Math.max(42,p.radius+20)))candidates.push({i,p,d});});
    const solid=candidates.filter(c=>c.d<c.p.radius);
    if(solid.length)return solid.sort((a,b)=>a.p.distance-b.p.distance)[0].i;
    return candidates.sort((a,b)=>a.d/(a.p.radius+20)-b.d/(b.p.radius+20))[0]?.i??-1;
  }
  handTarget(x,y,previous=-1){
    const targets=this.nodes.flatMap((n,i)=>{const p=this.project(i);return n.reveal>.5&&p.visible&&!n.occluded?[{id:i,x:p.x,y:p.y,radius:p.radius}]:[];});
    return pickHandTarget(targets,{x,y},previous,Math.max(.8,Math.min(1.8,this.height/720)));
  }
  project(index){const n=this.nodes[index];if(!n)return {x:-1000,y:-1000,visible:false,scale:1,depth:1,radius:40};const world=n.group.getWorldPosition(V()),p=this.projectPosition(world);const view=world.clone().applyMatrix4(this.camera.matrixWorldInverse);p.radius=n.radius*n.group.scale.x*this.height/(2*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))*Math.max(1,-view.z));return p;}
  reset(){this.warp=null;this.approach=0;this.endRemote();this.lastRemote=-1;this.cancelFlight();this.focusedIndex=-1;this.fx.clear();this.driftTime=0;this.selected=this.hovered=this.activation=-1;this.nodes.forEach(n=>{n.focusUntil=-1;n.locked=false;n.keyboardFocus=false;});this.camera.up.set(0,1,0);this.controls.reset();this.retreat();}
  animate=(now=performance.now())=>{
    this.raf=requestAnimationFrame(this.animate);if(document.hidden||this.suspended){this.last=now;return;}
    const dt=Math.min(Math.max((now-this.last)/1000,.001),.055);this.last=now;this.fxTime+=dt;if(!this.paused)this.time+=dt;
    const busy=this.hovered>=0||this.modalOpen;
    let warpStrength=0;
    if(this.warp){const w=this.warp;w.elapsed=Math.max(0,(now-w.startedAt)/1000);const t=Math.min(1,w.elapsed/w.duration);this.approach=THREE.MathUtils.lerp(w.start,1,THREE.MathUtils.smootherstep(t,0,1));warpStrength=this.motionQuery.matches?0:Math.pow(Math.sin(t*Math.PI),1.3);if(t===1)this.warp=null;}else this.approach=damp(this.approach,this.targetApproach,2.2,dt);
    this.energy=damp(this.energy,0,2.1,dt);
    const near=THREE.MathUtils.smoothstep(this.approach,0,1);
    this.controls.autoRotate=false;
    this.camera.fov=THREE.MathUtils.lerp(this.farFov,this.nearFov,near)+warpStrength*22;this.camera.updateProjectionMatrix();
    if(this.flight){
      const flight=this.flight;flight.elapsed+=dt;const p=sampleFlight(flight.start,flight.end,flight.elapsed/flight.duration);
      this.camera.position.copy(p.position);this.camera.up.copy(p.up);this.controls.target.copy(p.target);this.camera.lookAt(p.target);
      if(flight.elapsed>=flight.duration){this.flight=null;this.controls.enabled=true;this.controls.update();flight.resolve(true);}
    }else{this.controls.update(dt);if(this.focusedIndex<0){const distance=THREE.MathUtils.lerp(this.farDistance,this.nearDistance,near);this.camera.position.sub(this.controls.target).setLength(distance).add(this.controls.target);}}
    this.camera.updateMatrixWorld();
    this.warpFX.update(this.fxTime,warpStrength,this.camera);
    if(!busy){this.universe.rotation.y=damp(this.universe.rotation.y,0,4,dt);this.universe.rotation.x=damp(this.universe.rotation.x,0,4,dt);}
    this.nebula.update(this.time,near,this.energy,this.renderer.getPixelRatio(),this.fxTime);
    this.nebula.updateCamera(this.camera,this.universe);
    this.nebula.uniforms.uPointerActive.value=this.pointerActive?1:0;
    this.stars.material.uniforms.uTime.value=this.time;this.stars.material.uniforms.uRatio.value=this.renderer.getPixelRatio();this.stars.material.uniforms.uRush.value=Math.abs(this.targetApproach-this.approach)*2;
    if(!this.paused&&!this.modalOpen)this.driftTime+=dt;
    this.nodes.forEach((n,i)=>{
      const focused=i===this.hovered||n.keyboardFocus||this.fxTime<n.focusUntil||i===this.activation||i===this.focusedIndex;
      const desired=appDrift(i,this.driftTime);
      n.home.set(desired.x,desired.y,desired.z);
      if(focused&&!n.locked){n.anchor.copy(n.group.position);n.locked=true;}
      if(!focused)n.locked=false;
      n.target.copy(n.locked?n.anchor:n.home);
      n.group.position.lerp(n.target,1-Math.exp(-dt*3.5));
      n.focus=damp(n.focus,focused?1:0,8,dt);n.currentScale=damp(n.currentScale,.42*(1+n.focus*.08),6,dt);n.group.scale.setScalar(n.currentScale);
      if(!n.locked)n.face.quaternion.slerp(appOrientation(i,n.home,this.driftTime),1-Math.exp(-dt*2));
      n.group.updateWorldMatrix(true,false);
      const normal=new THREE.Vector3(0,0,1).applyQuaternion(n.face.getWorldQuaternion(new THREE.Quaternion()));n.facing=normal.dot(this.camera.position.clone().sub(n.group.getWorldPosition(V())).normalize());
      if(!this.paused&&focused&&this.fxTime-n.trailAt>.09){const movement=n.home.clone().sub(n.group.position).multiplyScalar(3);this.fx.emit(n.group.getWorldPosition(V()),apps[i].color,1,.08,movement,.8);n.trailAt=this.fxTime;}
    });
    const focus=this.nodes[this.focusedIndex>=0?this.focusedIndex:this.hovered];this.nebula.uniforms.uFocusStrength.value=focus?focus.focus*.7:0;if(focus)this.nebula.uniforms.uFocus.value.copy(focus.group.position);
    this.universe.updateWorldMatrix(true,true);
    const projected=this.nodes.map((_,i)=>this.project(i));
    const targetProjection=projected[this.focusedIndex];
    const detail=new Set(projected.map((p,i)=>({p,i,score:p.radius+(this.nodes[i].reveal>.5?7:0)+(i===this.focusedIndex||i===this.hovered?10000:0)}))
      .filter(({p,i})=>{
        if(i===this.focusedIndex)return true;
        const withinFrame=p.visible&&p.x>p.radius+18&&p.x<this.width-p.radius-18&&p.y>p.radius+80&&p.y<this.height-p.radius-135;
        const clearTarget=!targetProjection||Math.hypot(p.x-targetProjection.x,p.y-targetProjection.y)>p.radius+targetProjection.radius+24;
        return withinFrame&&clearTarget&&p.distance>2.3&&p.radius>8&&p.radius<this.height*.13;
      }).sort((a,b)=>b.score-a.score).slice(0,8).map(p=>p.i));
    this.detailIndices=[...detail];
    this.nodes.forEach((n,i)=>{
      const p=projected[i],reveal=detail.has(i)?Math.min(THREE.MathUtils.smoothstep(this.approach,.28,.88),THREE.MathUtils.smoothstep(p.radius,8,20)):0;
      n.reveal=damp(n.reveal,reveal,9,dt);if(n.reveal<.001)n.reveal=0;
      const viewDepth=n.group.getWorldPosition(V()).applyMatrix4(this.camera.matrixWorldInverse).z;
      n.atmosphere=THREE.MathUtils.smoothstep(-viewDepth,8,23)*near;
      n.body.material.opacity=n.reveal*(1-n.atmosphere*.08);n.body.material.depthWrite=n.reveal>.85;n.body.visible=n.reveal>.025;n.body.material.emissiveIntensity=.48+n.focus*.3+Math.sin(this.time*.8+i)*.04;
      if(n.reveal>.85)n.body.layers.enable(1);else n.body.layers.disable(1);
      if(n.reveal>.08&&detail.has(i)&&p.visible){const ions=n.ensureDetail();ions.material.uniforms.uTime.value=this.time;ions.material.uniforms.uReveal.value=n.reveal;ions.material.uniforms.uFocus.value=n.focus;ions.material.uniforms.uRatio.value=this.renderer.getPixelRatio();ions.visible=true;}else if(n.ions)n.ions.visible=false;
      n.photon.material.opacity=(1-n.reveal)*1.8;n.photon.visible=n.reveal<.995;
      // Keep an undiscovered app a small star even if the camera passes close.
      const photonSize=18*2*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))*Math.max(.1,-viewDepth)/this.height/n.group.scale.x;
      n.photon.scale.setScalar(photonSize*(1-n.reveal*.3));
      n.rim.visible=n.body.visible;n.halo.visible=n.body.visible;n.ring.visible=n.body.visible;
      n.rim.material.uniforms.uFocus.value=n.focus;n.rim.material.uniforms.uReveal.value=n.reveal;n.halo.material.opacity=(.025+.1*n.reveal+n.focus*.16)*n.reveal;n.ring.material.opacity=n.focus*.75*n.reveal;
      n.occluded=projected.some((q,j)=>j!==i&&q.visible&&this.nodes[j].reveal>.85&&q.distance<p.distance-1&&Math.hypot(q.x-p.x,q.y-p.y)+p.radius*.65<q.radius);
      const labelY=p.y+Math.max(23,p.radius)+23;
      n.labelOccluded=projected.some((q,j)=>j!==i&&q.visible&&this.nodes[j].reveal>.85&&q.distance<p.distance-1&&Math.hypot(Math.max(0,Math.abs(q.x-p.x)-52),Math.max(0,Math.abs(q.y-labelY)-15))<q.radius*.9);
      n.labelVisible=false;
    });
    const labels=[];
    projected.map((p,i)=>({p,i,score:(i===this.focusedIndex||i===this.hovered?10000:0)+p.radius})).sort((a,b)=>b.score-a.score).forEach(({p,i})=>{
      const n=this.nodes[i],focused=i===this.focusedIndex||i===this.hovered,y=p.y+Math.max(23,p.radius)+23;
      if(p.visible&&n.reveal>.62&&!n.occluded&&(focused||(!n.labelOccluded&&n.facing>.18&&labels.length<4&&y<this.height-145&&!labels.some(q=>Math.abs(p.x-q.x)<150&&Math.abs(y-q.y)<45)))){n.labelVisible=true;labels.push({x:p.x,y});}
    });
    this.nebula.updateApplications(this.nodes,this.camera,this.focusedIndex);this.fx.update(this.fxTime,dt,this.renderer.getPixelRatio());
    const mask=this.camera.layers.mask;this.camera.layers.set(1);this.scene.overrideMaterial=this.depthMaterial;this.renderer.setRenderTarget(this.appDepth);this.renderer.render(this.scene,this.camera);this.renderer.setRenderTarget(null);this.scene.overrideMaterial=null;this.camera.layers.mask=mask;
    this.nebula.renderVolume(this.renderer,this.scene,this.camera);
    this.composer.render();if(++this.frames%2===0)this.onFrame?.(now);
  };
  dispose(){this.cancelFlight();cancelAnimationFrame(this.raf);this.resizeObserver.disconnect();this.controls.dispose();this.motionQuery.removeEventListener('change',this.motionHandler);document.removeEventListener('visibilitychange',this.visibilityHandler);this.fx.dispose();this.nebula.dispose();this.scene.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());});this.appDepth.dispose();this.depthMaterial.dispose();this.composer.dispose();this.renderer.dispose();}
}
