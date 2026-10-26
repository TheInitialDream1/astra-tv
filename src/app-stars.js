import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { apps } from './catalog.js';

function glowTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');
  const g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,.85)');g.addColorStop(.16,'rgba(255,255,255,.28)');g.addColorStop(.6,'rgba(255,255,255,.035)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(canvas);
}
function glyphGeometry(app){
  const svg=new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${app.icon.path}"/></svg>`);
  const shapes=svg.paths.flatMap(path=>path.toShapes());
  const geometry=new THREE.ExtrudeGeometry(shapes,{depth:2.2,bevelEnabled:true,bevelSize:.25,bevelThickness:.24,bevelSegments:2,curveSegments:8,steps:1});
  geometry.rotateX(Math.PI);geometry.scale(.086,.086,.086);geometry.computeBoundingBox();const center=geometry.boundingBox.getCenter(new THREE.Vector3());geometry.translate(-center.x,-center.y,-center.z);geometry.computeVertexNormals();geometry.computeBoundingBox();
  return geometry;
}
function surfaceIons(body,color){
  const count=1100,anchors=new Float32Array(count*3),seeds=new Float32Array(count*3),sampler=new MeshSurfaceSampler(body).build(),p=new THREE.Vector3();
  for(let i=0;i<count;i++){sampler.sample(p);anchors.set(p.toArray(),i*3);seeds.set([Math.random(),Math.random(),Math.random()],i*3);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(anchors,3));geometry.setAttribute('aSeed',new THREE.BufferAttribute(seeds,3));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uReveal:{value:0},uFocus:{value:0},uRatio:{value:1},uColor:{value:new THREE.Color(color)}},
    vertexShader:`attribute vec3 aSeed;uniform float uTime,uReveal,uFocus,uRatio;varying float vAlpha,vHot;
    void main(){float age=fract(aSeed.z+uTime*(.075+aSeed.y*.035));float wake=sin(age*3.14159265);float a=aSeed.x*6.2831853+uTime*.7;
      vec3 drift=vec3(cos(a)*.65,sin(a*1.3+aSeed.y*5.)*.55,(age-.5)*2.4);
      vec3 p=position*(1.+wake*.12)+drift*wake*(1.-uFocus*.55);
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((.6+aSeed.y*1.6)*uRatio*10./max(2.,-mv.z),.65,5.);
      vHot=pow(max(0.,cos(aSeed.x*20.-uTime*3.)),12.);vAlpha=wake*(.12+vHot*.55+uFocus*.16)*uReveal;}`,
    fragmentShader:`uniform vec3 uColor;varying float vAlpha,vHot;void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;gl_FragColor=vec4(mix(uColor,vec3(.7,1.,1.),vHot*.65)*1.8,exp(-r*r*38.)*vAlpha);}`});
  const ions=new THREE.Points(geometry,material);ions.frustumCulled=false;ions.renderOrder=2;return ions;
}
function brackets(){
  const points=[];for(const x of [-1,1])for(const y of [-1,1]){points.push(x*.92,y*1.2,.15,x*1.2,y*1.2,.15,x*1.2,y*1.2,.15,x*1.2,y*.92,.15);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  return new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:'#a5f6ff',transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
}

export async function createAppStars(root){
  const glow=glowTexture(),loader=new THREE.TextureLoader();
  const textures=await Promise.all(apps.map(a=>a.iconUrl?loader.loadAsync(a.iconUrl).then(t=>{t.colorSpace=THREE.SRGBColorSpace;return t;}).catch(()=>null):null));
  return apps.map((app,i)=>{
    const group=new THREE.Group(),face=new THREE.Group();group.add(face);root.add(group);
    const texture=textures[i],geometry=app.iconUrl?new RoundedBoxGeometry(2,2,.3,3,.12):glyphGeometry(app);geometry.computeBoundingBox();
    const material=new THREE.MeshPhysicalMaterial({color:texture?'#ffffff':app.color,map:texture,emissiveMap:texture,metalness:texture ? .05 : .42,roughness:.3,clearcoat:.65,emissive:app.color,emissiveIntensity:.48,transparent:true,opacity:0});
    material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight=min(outgoingLight,diffuseColor.rgb*1.3+vec3(0.025));\n#include <opaque_fragment>');};
    const body=new THREE.Mesh(geometry,material);body.layers.enable(1);face.add(body);
    const rim=new THREE.Mesh(geometry,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.BackSide,
      uniforms:{uColor:{value:new THREE.Color(app.color)},uFocus:{value:0},uReveal:{value:0}},
      vertexShader:'varying vec3 vNormal,vView;void main(){vec4 p=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=-p.xyz;gl_Position=projectionMatrix*p;}',
      fragmentShader:'uniform vec3 uColor;uniform float uFocus,uReveal;varying vec3 vNormal,vView;void main(){float rim=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),2.);gl_FragColor=vec4(uColor*(1.1+uFocus),(.16+rim*.5)*uReveal);}',
    }));rim.scale.setScalar(1.025);face.add(rim);
    // Only readable, nearby glyphs allocate and draw their charged surface.
    let ions=null;
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:app.color,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.06}));halo.scale.set(3.4,3.4,1);face.add(halo);
    const ring=brackets();face.add(ring);
    const photon=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:'#b4f6ff',blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:1.5}));photon.scale.set(.6,.6,1);photon.renderOrder=4;face.add(photon);
    const size=geometry.boundingBox.getSize(new THREE.Vector3());
    return {group,face,body,logo:body,halo,rim,get ions(){return ions;},ensureDetail(){if(!ions){ions=surfaceIons(body,app.color);face.add(ions);}return ions;},ring,photon,reveal:0,home:new THREE.Vector3(),target:new THREE.Vector3(),anchor:new THREE.Vector3(),radius:Math.max(size.x,size.y)*.5+.05,focus:0,focusUntil:-1,locked:false,currentScale:.42,trailAt:0};
  });
}
