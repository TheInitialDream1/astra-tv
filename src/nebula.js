import * as THREE from 'three';
import { galaxyFlowGLSL } from './vendor/galaxy-flow.js';
import { volumeSeeds } from './nebula-volume.js';

const densityGLSL=/* glsl */ `
  uniform sampler2D uNoise;
  float volumeNoise(vec3 p){
    vec3 cell=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    vec2 uv=cell.xy+vec2(37.,17.)*cell.z+f.xy;
    float a=texture2D(uNoise,(uv+.5)/128.).r;
    float b=texture2D(uNoise,(uv+vec2(37.,17.)+.5)/128.).r;
    return mix(a,b,f.z);
  }
  float cloudDensity(vec3 p,float t){
    vec3 q=p+vec3(sin(p.z*.14+t*.08),cos(p.x*.16-t*.07),sin(p.y*.17+t*.06))*.9;
    float shape=length(q/vec3(18.,10.,10.));
    float edge=1.-smoothstep(.58,1.04,shape);
    vec3 drift=vec3(t*.026,-t*.018,t*.021);
    float f=volumeNoise(q*.23+drift)*.5+volumeNoise(q*.49-drift*.8)*.25+volumeNoise(q*1.1+drift*.5)*.15+volumeNoise(q*2.5-drift)*.1;
    float pockets=smoothstep(.58,.83,volumeNoise(q*.12-drift*.6));
    return pow(smoothstep(.29,.72,f),1.25)*edge*(1.-pockets*.7);
  }
`;
function noiseTexture(){
  let seed=0x1eaf;const data=new Uint8Array(128*128*4);
  for(let i=0;i<128*128;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const value=seed>>>24;data.set([value,value,value,255],i*4);}
  const texture=new THREE.DataTexture(data,128,128);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=texture.minFilter=THREE.LinearFilter;texture.needsUpdate=true;return texture;
}

const vertex=/* glsl */ `
  attribute vec3 aSeed;attribute float aSize,aLayer;
  uniform float uTime,uRatio,uNear,uEnergy,uPulseAge,uPointerActive,uFocusStrength;
  uniform vec3 uPointer,uPulseOrigin,uFocus,uApplications[6],uAppColors[6];
  varying vec3 vColor;varying float vAlpha,vAngle,vHot;
  ${galaxyFlowGLSL}
  ${densityGLSL}
  vec3 energyVolume(vec3 seed,float layer,float t){
    // A filled 3D volume, not lanes, splines, rings or application bridges.
    vec3 p=(seed-.5)*vec3(36.,20.,20.);
    vec3 curl=vec3(
      sin(p.y*.37+t*.19)+cos(p.z*.29-t*.14),
      sin(p.z*.33+t*.16)+cos(p.x*.31+t*.12),
      sin(p.x*.35-t*.17)+cos(p.y*.28+t*.15));
    p+=curl*(.38+layer*.12);
    p+=vec3(sin(seed.z*31.+t*.12),cos(seed.x*27.+t*.1),sin(seed.y*29.-t*.11))*.3;
    return p;
  }
  void main(){
    vec3 p=energyVolume(aSeed,aLayer,uTime);
    float density=cloudDensity(p,uTime);
    vec3 color=mix(vec3(.10,.09,.48),vec3(.08,.68,.82),density*.7+aSeed.z*.3);
    float charge=0.;
    // Each application bends the same surrounding field, rather than sitting
    // on top of a visually unrelated particle background.
    for(int i=0;i<6;i++){
      vec3 q=p-uApplications[i];float fall=exp(-dot(q,q)*.42);
      vec3 axis=normalize(vec3(sin(float(i)*1.7)+.3,1.,cos(float(i)*1.3)));
      p+=cross(axis,q)*fall*.15*uFocusStrength;
      color=mix(color,uAppColors[i],fall*(.08+.4*uFocusStrength));charge=max(charge,fall);
    }
    float d=length(p-uPulseOrigin),age=uPulseAge;
    float wave=exp(-pow((d-age*10.)*1.4,2.))*exp(-age*.9);
    p+=normalize(p-uPulseOrigin+vec3(.001))*wave*.55;
    p+=mouseForce(p,uPointer,uPointerActive*uNear,.28,2.);
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
    float stream=.5+.5*sin(aSeed.x*81.+aSeed.y*53.+aSeed.z*119.+uTime*(.6+aSeed.x*.9));
    vHot=pow(stream,24.)*(aSeed.y>.7?1.:.15);
    float size=aSize*(1.+vHot*1.5);
    gl_PointSize=clamp(size*uRatio*145./max(2.,-mv.z),.85,7.);
    vAngle=0.;
    vColor=mix(color,vec3(.64,.95,1.),vHot*.75)*(1.5+vHot*2.+wave*2.+charge*.18);
    if(aSeed.z>.982)vColor=mix(vColor,vec3(1.,.57,.2),.65);
    vec3 f=(modelViewMatrix*vec4(uFocus,1.)).xyz;
    float clear=(1.-smoothstep(.6,1.5,length(mv.xy-f.xy)))*uFocusStrength;
    float opacity=aLayer<.5?.50:aLayer<1.5?.68:.38;
    vAlpha=opacity*mix(density*3.8,.6+density*.7,uNear)*(.45+stream*.55)*(1.-clear*.65)*smoothstep(.5,2.,-mv.z);

  }
`;
const fragment=/* glsl */ `
  varying vec3 vColor;varying float vAlpha,vAngle,vHot;
  void main(){vec2 uv=gl_PointCoord-.5;
    float r=dot(uv,uv);float core=exp(-r*110.),halo=exp(-r*25.)*.12;
    gl_FragColor=vec4(vColor,(core+halo)*vAlpha);}

`;
const coreVertex=`varying vec3 vLocal;void main(){vLocal=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const coreFragment=/* glsl */ `
  #include <packing>
  ${densityGLSL}
  varying vec3 vLocal;
  uniform vec3 uCamera,uForward,uFocus;uniform vec2 uResolution;
  uniform sampler2D uDepth;uniform float uCameraNear,uCameraFar,uTime,uNear,uEnergy,uFocusStrength;
  void main(){
    vec3 origin=uCamera,ray=normalize(vLocal-origin);
    float b=dot(origin,ray),c=dot(origin,origin)-400.,h=b*b-c;
    if(h<0.)discard;h=sqrt(h);float start=max(0.,-b-h),end=-b+h;
    float depth=texture2D(uDepth,gl_FragCoord.xy/uResolution).x;
    float viewZ=perspectiveDepthToViewZ(depth,uCameraNear,uCameraFar);
    end=min(end,-viewZ/max(.001,dot(ray,uForward)));
    if(end<=start)discard;
    float stepSize=(end-start)/28.,transmission=1.;vec3 light=vec3(0.);
    float clearance=(1.-smoothstep(.5,1.2,length(cross(uFocus-origin,ray))))*uFocusStrength;
    for(int i=0;i<28;i++){
      vec3 p=origin+ray*(start+(float(i)+.5)*stepSize);
      float field=cloudDensity(p,uTime);
      float density=field*mix(.045,.014,uNear)*(1.-clearance*.85);
      float a=1.-exp(-density*stepSize);
      float hue=volumeNoise(p*.13+vec3(5.,uTime*.01,3.));
      vec3 color=mix(vec3(.15,.055,.52),vec3(.035,.62,.72),smoothstep(.27,.75,hue));
      float fire=pow(smoothstep(.4,.9,field),2.);
      light+=transmission*color*a*(1.5+fire*2.+uEnergy*.7);transmission*=1.-a;
    }
    gl_FragColor=vec4(light,1.-transmission);
  }
`;

export class LivingNebula{
  constructor(root,count=42000){
    this.noise=noiseTexture();
    this.count=count;this.uniforms={uNoise:{value:this.noise},...{uTime:{value:0},uRatio:{value:1},uNear:{value:0},uEnergy:{value:0},uPulseAt:{value:-100},uPulseAge:{value:100},uPulseOrigin:{value:new THREE.Vector3()},uPointer:{value:new THREE.Vector3()},uPointerActive:{value:0},uFocus:{value:new THREE.Vector3()},uFocusStrength:{value:0},uApplications:{value:Array.from({length:6},()=>new THREE.Vector3())},uAppColors:{value:Array.from({length:6},()=>new THREE.Color())}}};
    const seeds=volumeSeeds(count),sizes=new Float32Array(count),layers=new Float32Array(count);
    for(let i=0;i<count;i++){layers[i]=i%3;sizes[i]=i%47===0?.85:.22+(i%13)/13*.48;}

    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*3),3));g.setAttribute('aSeed',new THREE.BufferAttribute(seeds,3));g.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));g.setAttribute('aLayer',new THREE.BufferAttribute(layers,1));
    this.material=new THREE.ShaderMaterial({uniforms:this.uniforms,vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
    this.cloud=new THREE.Points(g,this.material);this.cloud.frustumCulled=false;this.cloud.renderOrder=6;root.add(this.cloud);
    this.core=new THREE.Mesh(new THREE.SphereGeometry(20,40,28),new THREE.ShaderMaterial({uniforms:{uNoise:this.uniforms.uNoise,uCamera:{value:new THREE.Vector3()},uForward:{value:new THREE.Vector3()},uResolution:{value:new THREE.Vector2(1,1)},uDepth:{value:null},uCameraNear:{value:.1},uCameraFar:{value:600},uTime:this.uniforms.uTime,uNear:this.uniforms.uNear,uEnergy:this.uniforms.uEnergy,uFocus:this.uniforms.uFocus,uFocusStrength:this.uniforms.uFocusStrength},vertexShader:coreVertex,fragmentShader:coreFragment,transparent:true,premultipliedAlpha:true,depthTest:false,depthWrite:false,blending:THREE.NormalBlending,side:THREE.BackSide}));this.core.renderOrder=5;this.core.layers.set(2);root.add(this.core);
    this.volumeTarget=new THREE.WebGLRenderTarget(1,1,{depthBuffer:false,stencilBuffer:false,type:THREE.HalfFloatType});
    this.composite=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({uniforms:{uVolume:{value:this.volumeTarget.texture}},vertexShader:'varying vec2 vUV;void main(){vUV=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'uniform sampler2D uVolume;varying vec2 vUV;void main(){gl_FragColor=texture2D(uVolume,vUV);}',transparent:true,premultipliedAlpha:true,depthTest:false,depthWrite:false}));this.composite.frustumCulled=false;this.composite.renderOrder=5;root.add(this.composite);
    this.inverse=new THREE.Matrix4();
  }
  update(time,near,energy,ratio,fxTime){const u=this.uniforms;u.uTime.value=time;u.uNear.value=near;u.uEnergy.value=energy;u.uRatio.value=ratio;u.uPulseAge.value=Math.max(0,fxTime-(this.pulseClock??-100));}
  updateCamera(camera,root){root.updateWorldMatrix(true,false);this.inverse.copy(root.matrixWorld).invert();const u=this.core.material.uniforms;u.uCamera.value.copy(camera.position).applyMatrix4(this.inverse);camera.getWorldDirection(u.uForward.value).transformDirection(this.inverse);u.uCameraNear.value=camera.near;u.uCameraFar.value=camera.far;}
  setDepth(texture,width,height){const u=this.core.material.uniforms;u.uDepth.value=texture;const w=Math.ceil(width*.5),h=Math.ceil(height*.5);this.volumeTarget.setSize(w,h);u.uResolution.value.set(w,h);}
  updateApplications(nodes,camera,focused=-1){
    // A fixed number of local attractors keeps the particle shader's work
    // constant as the catalog grows. Every app can enter this local field.
    const closest=nodes.map((n,i)=>({n,i,score:n.group.position.distanceToSquared(camera.position)-(i===focused?1000:0)})).sort((a,b)=>a.score-b.score).slice(0,6);
    this.fieldIndices=closest.map(p=>p.i);
    closest.forEach(({n},i)=>{this.uniforms.uApplications.value[i].lerp(n.group.position,.08);this.uniforms.uAppColors.value[i].lerp(n.body.material.color,.08);});
  }
  pulse(point,time,fxTime){this.uniforms.uPulseOrigin.value.copy(point);this.uniforms.uPulseAt.value=time;this.pulseClock=fxTime;}
  renderVolume(renderer,scene,camera){
    const mask=camera.layers.mask,background=scene.background,clear=renderer.getClearColor(new THREE.Color()),alpha=renderer.getClearAlpha();
    scene.background=null;camera.layers.set(2);renderer.setClearColor(0,0);renderer.setRenderTarget(this.volumeTarget);renderer.clear();renderer.render(scene,camera);
    renderer.setRenderTarget(null);renderer.setClearColor(clear,alpha);camera.layers.mask=mask;scene.background=background;
  }
  dispose(){this.noise.dispose();this.volumeTarget.dispose();}
  setQuality(value){this.cloud.geometry.setDrawRange(0,Math.floor(this.count*({lite:.4,standard:.8,ultra:1}[value]||.8)));}
}
